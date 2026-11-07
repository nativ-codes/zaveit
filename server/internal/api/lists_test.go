package api

import (
	"fmt"
	"net/http"
	"strings"
	"testing"

	"zaveit/server/internal/firestore/firestoretest"
)

func TestListPath(t *testing.T) {
	for name, want := range map[string]string{
		"My Books":                 "my-books",
		"  Weeknight recipes  ":    "weeknight-recipes",
		"a - b  --  c":             "a-b-c",
		"Rock-n-Roll":              "rock-n-roll",
		"2026":                     "2026",
		"-Edge-":                   "edge",
		strings.Repeat("a", 30):    strings.Repeat("a", 30),
		strings.Repeat("a", 31):    "", // path too long
		"ab":                       "", // path too short
		"---":                      "", // no letter or digit
		"":                         "",
		"Café":                     "", // é is not allowed
		"books!":                   "",
		"under_score":              "",
		strings.Repeat("a b ", 13): "", // name over 50 characters
	} {
		if got, ok := listPath(name); got != want || ok != (want != "") {
			t.Errorf("listPath(%q) = %q, %v, want %q", name, got, ok, want)
		}
	}
}

func withUsername(fake *firestoretest.Server, username, uid string) {
	fake.Put("usernames/"+username, map[string]any{"uid": map[string]any{"stringValue": uid}})
}

func TestCreateListThenGetLists(t *testing.T) {
	router, fake := usernameRouter(t, allowAll)
	withUsername(fake, "andrei", "u1")

	res := ownerSend(router, "POST", "/v1/lists", "u1", `{"name":" My Books ","tags":["books","reading"],"password":"abc","published":true}`)
	want := `{"listPath":"my-books","name":"My Books","tags":["books","reading"],"published":true}`
	if res.Code != http.StatusCreated || strings.TrimSpace(res.Body.String()) != want {
		t.Fatalf("create: got %d %s", res.Code, res.Body)
	}
	fields, ok := fake.Doc("users/u1/lists/my-books")
	if !ok || fields["passwordHash"] == nil || fields["salt"] == nil || fields["createdAt"] == nil {
		t.Fatalf("stored %v %v", ok, fields)
	}
	if strings.Contains(fmt.Sprint(fields["passwordHash"]), "abc") {
		t.Error("the List Password was stored as given")
	}

	res = ownerSend(router, "GET", "/v1/lists", "u1", "")
	if res.Code != http.StatusOK || strings.TrimSpace(res.Body.String()) != `{"lists":[`+want+`],"username":"andrei"}` {
		t.Errorf("get: got %d %s", res.Code, res.Body)
	}
	if strings.Contains(res.Body.String(), "salt") || strings.Contains(res.Body.String(), "Hash") {
		t.Error("GET returned the hash or salt")
	}
}

func TestEachListGetsItsOwnSalt(t *testing.T) {
	router, fake := usernameRouter(t, allowAll)
	withUsername(fake, "andrei", "u1")
	for _, name := range []string{"one list", "two list"} {
		if res := ownerSend(router, "POST", "/v1/lists", "u1", `{"name":"`+name+`","tags":["a"],"password":"same","published":false}`); res.Code != http.StatusCreated {
			t.Fatalf("%s: got %d %s", name, res.Code, res.Body)
		}
	}
	one, _ := fake.Doc("users/u1/lists/one-list")
	two, _ := fake.Doc("users/u1/lists/two-list")
	if fmt.Sprint(one["salt"]) == fmt.Sprint(two["salt"]) || fmt.Sprint(one["passwordHash"]) == fmt.Sprint(two["passwordHash"]) {
		t.Error("two Lists with the same password share a salt or hash")
	}
}

func TestCreateListClashIs409(t *testing.T) {
	router, fake := usernameRouter(t, allowAll)
	withUsername(fake, "andrei", "u1")
	withUsername(fake, "other", "u2")
	body := `{"name":"My Books","tags":["a"],"password":"abc","published":true}`
	if res := ownerSend(router, "POST", "/v1/lists", "u1", body); res.Code != http.StatusCreated {
		t.Fatalf("first: got %d %s", res.Code, res.Body)
	}
	if res := ownerSend(router, "POST", "/v1/lists", "u1", `{"name":"my  books","tags":["b"],"password":"xyz","published":false}`); res.Code != http.StatusConflict {
		t.Errorf("same List Path: got %d %s", res.Code, res.Body)
	}
	if res := ownerSend(router, "POST", "/v1/lists", "u2", body); res.Code != http.StatusCreated {
		t.Errorf("another user's List Path: got %d %s", res.Code, res.Body)
	}
}

func TestCreateListRefusedAtTen(t *testing.T) {
	router, fake := usernameRouter(t, allowAll)
	withUsername(fake, "andrei", "u1")
	for i := range 10 {
		fake.Put(fmt.Sprintf("users/u1/lists/list-%d", i), map[string]any{"name": map[string]any{"stringValue": "x"}})
	}
	if res := ownerSend(router, "POST", "/v1/lists", "u1", `{"name":"eleventh","tags":["a"],"password":"abc","published":true}`); res.Code != http.StatusForbidden {
		t.Errorf("got %d %s", res.Code, res.Body)
	}
	if _, ok := fake.Doc("users/u1/lists/eleventh"); ok {
		t.Error("an eleventh List was stored")
	}
}

func TestCreateListNeedsAUsername(t *testing.T) {
	router, fake := usernameRouter(t, allowAll)
	if res := ownerSend(router, "POST", "/v1/lists", "u1", `{"name":"My Books","tags":["a"],"password":"abc","published":true}`); res.Code != http.StatusForbidden {
		t.Errorf("got %d %s", res.Code, res.Body)
	}
	if _, ok := fake.Doc("users/u1/lists/my-books"); ok {
		t.Error("a List was stored without a Username")
	}
}

func TestCreateListRejectsInvalidInput(t *testing.T) {
	router, fake := usernameRouter(t, allowAll)
	withUsername(fake, "andrei", "u1")
	for _, body := range []string{
		`{"name":"My Books","tags":[],"password":"abc","published":true}`,
		`{"name":"My Books","password":"abc","published":true}`,
		`{"name":"My Books","tags":[""],"password":"abc","published":true}`,
		`{"name":"My Books","tags":["a"],"password":"ab","published":true}`,
		`{"name":"My Books","tags":["a"],"password":"` + strings.Repeat("p", 129) + `","published":true}`,
		`{"name":"ab","tags":["a"],"password":"abc","published":true}`,
		`{"name":"Books!","tags":["a"],"password":"abc","published":true}`,
		`not json`,
	} {
		if res := ownerSend(router, "POST", "/v1/lists", "u1", body); res.Code != http.StatusBadRequest {
			t.Errorf("%.60s: got %d %s", body, res.Code, res.Body)
		}
	}
	if _, ok := fake.Doc("users/u1/lists/my-books"); ok {
		t.Error("an invalid List was stored")
	}
}

// ownedList makes u1 (Username "andrei") a List "My Books" at my-books and returns its stored salt.
func ownedList(t *testing.T) (http.Handler, *firestoretest.Server, string) {
	t.Helper()
	router, fake := usernameRouter(t, allowAll)
	withUsername(fake, "andrei", "u1")
	if res := ownerSend(router, "POST", "/v1/lists", "u1", `{"name":"My Books","tags":["a"],"password":"abc","published":true}`); res.Code != http.StatusCreated {
		t.Fatalf("create: got %d %s", res.Code, res.Body)
	}
	fields, _ := fake.Doc("users/u1/lists/my-books")
	return router, fake, fmt.Sprint(fields["salt"])
}

func TestRenameFreesTheOldPathAndKeepsTheSalt(t *testing.T) {
	router, fake, salt := ownedList(t)
	res := ownerSend(router, "PATCH", "/v1/lists/my-books", "u1", `{"name":"Old Books"}`)
	if res.Code != http.StatusOK || strings.TrimSpace(res.Body.String()) != `{"listPath":"old-books","name":"Old Books","tags":["a"],"published":true}` {
		t.Fatalf("got %d %s", res.Code, res.Body)
	}
	if _, ok := fake.Doc("users/u1/lists/my-books"); ok {
		t.Error("the old List Path is still taken")
	}
	fields, ok := fake.Doc("users/u1/lists/old-books")
	if !ok || fmt.Sprint(fields["salt"]) != salt || fields["passwordHash"] == nil || fields["createdAt"] == nil {
		t.Errorf("renamed List stored as %v %v", ok, fields)
	}
}

func TestCapitalsOnlyRenameKeepsThePath(t *testing.T) {
	router, fake, salt := ownedList(t)
	res := ownerSend(router, "PATCH", "/v1/lists/my-books", "u1", `{"name":"MY books"}`)
	if res.Code != http.StatusOK || !strings.Contains(res.Body.String(), `"listPath":"my-books","name":"MY books"`) {
		t.Fatalf("got %d %s", res.Code, res.Body)
	}
	if fields, ok := fake.Doc("users/u1/lists/my-books"); !ok || fmt.Sprint(fields["salt"]) != salt {
		t.Errorf("stored %v %v", ok, fields)
	}
}

func TestRenameClashIs409(t *testing.T) {
	router, fake, _ := ownedList(t)
	ownerSend(router, "POST", "/v1/lists", "u1", `{"name":"Films","tags":["b"],"password":"abc","published":true}`)
	if res := ownerSend(router, "PATCH", "/v1/lists/my-books", "u1", `{"name":"films"}`); res.Code != http.StatusConflict {
		t.Errorf("got %d %s", res.Code, res.Body)
	}
	if _, ok := fake.Doc("users/u1/lists/my-books"); !ok {
		t.Error("a refused rename removed the List")
	}
}

func TestOnlyANewPasswordChangesTheSalt(t *testing.T) {
	router, fake, salt := ownedList(t)
	res := ownerSend(router, "PATCH", "/v1/lists/my-books", "u1", `{"tags":["x","y"],"published":false}`)
	if res.Code != http.StatusOK || strings.TrimSpace(res.Body.String()) != `{"listPath":"my-books","name":"My Books","tags":["x","y"],"published":false}` {
		t.Fatalf("got %d %s", res.Code, res.Body)
	}
	before, _ := fake.Doc("users/u1/lists/my-books")
	if fmt.Sprint(before["salt"]) != salt {
		t.Error("changing Tags or published changed the salt")
	}
	if res := ownerSend(router, "PATCH", "/v1/lists/my-books", "u1", `{"password":"new one"}`); res.Code != http.StatusOK {
		t.Fatalf("password: got %d %s", res.Code, res.Body)
	}
	after, _ := fake.Doc("users/u1/lists/my-books")
	if fmt.Sprint(after["salt"]) == salt || fmt.Sprint(after["passwordHash"]) == fmt.Sprint(before["passwordHash"]) {
		t.Error("a new List Password kept the salt or hash")
	}
}

func TestUpdateListRejectsBadInput(t *testing.T) {
	router, _, _ := ownedList(t)
	for _, body := range []string{`{"password":"ab"}`, `{"tags":[]}`, `{"tags":[""]}`, `{"name":"Books!"}`, `not json`} {
		if res := ownerSend(router, "PATCH", "/v1/lists/my-books", "u1", body); res.Code != http.StatusBadRequest {
			t.Errorf("%s: got %d %s", body, res.Code, res.Body)
		}
	}
	if res := ownerSend(router, "PATCH", "/v1/lists/nope", "u1", `{"published":false}`); res.Code != http.StatusNotFound {
		t.Errorf("unknown List: got %d %s", res.Code, res.Body)
	}
	if res := ownerSend(router, "PATCH", "/v1/lists/my-books", "u2", `{"published":false}`); res.Code != http.StatusNotFound {
		t.Errorf("another user's List: got %d %s", res.Code, res.Body)
	}
}

func TestDeleteFreesThePath(t *testing.T) {
	router, fake, _ := ownedList(t)
	if res := ownerSend(router, "DELETE", "/v1/lists/my-books", "u1", ""); res.Code != http.StatusNoContent {
		t.Fatalf("got %d %s", res.Code, res.Body)
	}
	if _, ok := fake.Doc("users/u1/lists/my-books"); ok {
		t.Error("the List is still stored")
	}
	if res := ownerSend(router, "POST", "/v1/lists", "u1", `{"name":"my books","tags":["a"],"password":"abc","published":true}`); res.Code != http.StatusCreated {
		t.Errorf("path not free: got %d %s", res.Code, res.Body)
	}
}
