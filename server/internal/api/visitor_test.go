package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"

	"zaveit/server/internal/firestore/firestoretest"
)

func visitorRouter(t *testing.T) (http.Handler, *firestoretest.Server) {
	t.Helper()
	router, fake := usernameRouter(t, rejectAll)
	withUsername(fake, "andrei", "u1")
	withList(fake, "u1", "books", "open sesame", true, "books", "reading")
	return router, fake
}

func rejectAll(string) error { return fmt.Errorf("rejected") }

func withList(fake *firestoretest.Server, uid, path, password string, published bool, tags ...string) {
	salt := newListSalt()
	values := []any{}
	for _, tag := range tags {
		values = append(values, map[string]any{"stringValue": tag})
	}
	fake.Put("users/"+uid+"/lists/"+path, map[string]any{
		"name":         map[string]any{"stringValue": "My " + path},
		"tags":         map[string]any{"arrayValue": map[string]any{"values": values}},
		"published":    map[string]any{"booleanValue": published},
		"salt":         map[string]any{"stringValue": salt},
		"passwordHash": map[string]any{"stringValue": hashListPassword(password, salt)},
	})
}

func listPost(title string, timestamp string, tags ...string) map[string]any {
	values := []any{}
	for _, tag := range tags {
		values = append(values, map[string]any{"stringValue": tag})
	}
	s := func(v string) map[string]any { return map[string]any{"stringValue": v} }
	return map[string]any{"mapValue": map[string]any{"fields": map[string]any{
		"id": s("id-" + title), "url": s("https://example.com/" + title), "title": s(title), "author": s("Ann"),
		"thumbnailUrl": s("https://pics/" + title), "timestamp": map[string]any{"integerValue": timestamp},
		"tags": map[string]any{"arrayValue": map[string]any{"values": values}},
	}}}
}

var visits int
var visitsMu sync.Mutex

// visit sends a Visitor request from its own address unless ip is set.
func visit(router http.Handler, method, target, token, body, ip string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, target, strings.NewReader(body))
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	if ip == "" {
		visitsMu.Lock()
		visits++
		ip = fmt.Sprintf("10.2.%d.%d", visits/256, visits%256)
		visitsMu.Unlock()
	}
	req.RemoteAddr = ip + ":1"
	res := httptest.NewRecorder()
	router.ServeHTTP(res, req)
	return res
}

func unlock(t *testing.T, router http.Handler, target, password string) string {
	t.Helper()
	res := visit(router, "POST", target+"/unlock", "", `{"password":"`+password+`"}`, "")
	var body struct{ Token string }
	json.Unmarshal(res.Body.Bytes(), &body)
	if res.Code != http.StatusOK || body.Token == "" {
		t.Fatalf("unlock %s: got %d %s", target, res.Code, res.Body)
	}
	return body.Token
}

func TestVisitorFailuresLookTheSame(t *testing.T) {
	router, fake := visitorRouter(t)
	withList(fake, "u1", "hidden", "open sesame", false, "books")
	want := visit(router, "POST", "/v1/published-lists/andrei/books/unlock", "", `{"password":"wrong"}`, "")
	if want.Code != http.StatusUnauthorized {
		t.Fatalf("wrong password: got %d %s", want.Code, want.Body)
	}
	for name, target := range map[string]string{
		"unknown username":  "/v1/published-lists/nobody/books/unlock",
		"unknown list path": "/v1/published-lists/andrei/nothing/unlock",
		"offline list":      "/v1/published-lists/andrei/hidden/unlock",
		"bare username":     "/v1/published-lists/andrei/unlock",
		"invalid username":  "/v1/published-lists/A!/books/unlock",
	} {
		res := visit(router, "POST", target, "", `{"password":"open sesame"}`, "")
		if res.Code != want.Code || res.Body.String() != want.Body.String() {
			t.Errorf("%s: got %d %s, want %d %s", name, res.Code, res.Body, want.Code, want.Body)
		}
	}
}

func TestVisitorSeesOnlyMatchingPostsNewestFirst(t *testing.T) {
	router, fake := visitorRouter(t)
	// Not a List: the top-level lists collection holds a user's Posts.
	fake.Put("lists/doc1", map[string]any{
		"userId": map[string]any{"stringValue": "u1"},
		"posts": map[string]any{"arrayValue": map[string]any{"values": []any{
			listPost("old", "1000", "books"), listPost("cooking", "3000", "food"), listPost("new", "2000", "reading", "x"),
		}}},
	})
	fake.Put("lists/doc2", map[string]any{
		"userId": map[string]any{"stringValue": "u2"},
		"posts":  map[string]any{"arrayValue": map[string]any{"values": []any{listPost("other user", "5000", "books")}}},
	})

	token := unlock(t, router, "/v1/published-lists/Andrei/books", "open sesame")
	res := visit(router, "GET", "/v1/published-lists/andrei/books", token, "", "")
	want := `{"name":"My books","posts":[` +
		`{"url":"https://example.com/new","title":"new","author":"Ann","tags":["reading","x"],"thumbnailUrl":"https://pics/new","timestamp":2000},` +
		`{"url":"https://example.com/old","title":"old","author":"Ann","tags":["books"],"thumbnailUrl":"https://pics/old","timestamp":1000}]}`
	if res.Code != http.StatusOK || strings.TrimSpace(res.Body.String()) != want {
		t.Errorf("got %d %s", res.Code, res.Body)
	}
}

func TestVisitorTokenOpensOnlyItsOwnList(t *testing.T) {
	router, fake := visitorRouter(t)
	withList(fake, "u1", "films", "open sesame", true, "films")
	token := unlock(t, router, "/v1/published-lists/andrei/books", "open sesame")

	for _, target := range []string{"/v1/published-lists/andrei/films", "/v1/published-lists/andrei/books"} {
		for _, sent := range []string{"", "garbage", token + "x"} {
			if res := visit(router, "GET", target, sent, "", ""); res.Code != http.StatusUnauthorized {
				t.Errorf("%s with %q: got %d", target, sent, res.Code)
			}
		}
	}
	if res := visit(router, "GET", "/v1/published-lists/andrei/films", token, "", ""); res.Code != http.StatusUnauthorized {
		t.Errorf("other list: got %d", res.Code)
	}
}

func TestVisitorTokenFailsAfterPasswordChange(t *testing.T) {
	router, fake := visitorRouter(t)
	token := unlock(t, router, "/v1/published-lists/andrei/books", "open sesame")
	if res := visit(router, "GET", "/v1/published-lists/andrei/books", token, "", ""); res.Code != http.StatusOK {
		t.Fatalf("before: got %d %s", res.Code, res.Body)
	}
	withList(fake, "u1", "books", "new password", true, "books")
	if res := visit(router, "GET", "/v1/published-lists/andrei/books", token, "", ""); res.Code != http.StatusUnauthorized {
		t.Errorf("after: got %d %s", res.Code, res.Body)
	}
}

func TestVisitorGuessLimitPerIP(t *testing.T) {
	router, _ := visitorRouter(t)
	for i := range 10 {
		// Unknown pairs count too.
		target := fmt.Sprintf("/v1/published-lists/nobody/list-%d/unlock", i)
		if res := visit(router, "POST", target, "", `{"password":"x"}`, "203.0.113.9"); res.Code != http.StatusUnauthorized {
			t.Fatalf("guess %d: got %d", i, res.Code)
		}
	}
	if res := visit(router, "POST", "/v1/published-lists/andrei/books/unlock", "", `{"password":"open sesame"}`, "203.0.113.9"); res.Code != http.StatusTooManyRequests {
		t.Errorf("11th guess: got %d", res.Code)
	}
}

func TestVisitorGuessLimitPerList(t *testing.T) {
	router, _ := visitorRouter(t)
	for i := range 20 {
		if res := visit(router, "POST", "/v1/published-lists/andrei/books/unlock", "", `{"password":"wrong"}`, ""); res.Code != http.StatusUnauthorized {
			t.Fatalf("guess %d: got %d", i, res.Code)
		}
	}
	if res := visit(router, "POST", "/v1/published-lists/andrei/books/unlock", "", `{"password":"open sesame"}`, ""); res.Code != http.StatusTooManyRequests {
		t.Errorf("21st guess: got %d", res.Code)
	}
	if res := visit(router, "POST", "/v1/published-lists/andrei/other/unlock", "", `{"password":"x"}`, ""); res.Code != http.StatusUnauthorized {
		t.Errorf("another list: got %d", res.Code)
	}
}

func TestBlockedIPDoesNotCountAgainstTheList(t *testing.T) {
	router, _ := visitorRouter(t)
	for range 25 {
		// The first 10 count; the 15 refused for the IP must not.
		visit(router, "POST", "/v1/published-lists/andrei/books/unlock", "", `{"password":"wrong"}`, "203.0.113.9")
	}
	for i := range 10 {
		if res := visit(router, "POST", "/v1/published-lists/andrei/books/unlock", "", `{"password":"wrong"}`, ""); res.Code != http.StatusUnauthorized {
			t.Fatalf("guess %d from another IP: got %d", i, res.Code)
		}
	}
	if res := visit(router, "POST", "/v1/published-lists/andrei/books/unlock", "", `{"password":"open sesame"}`, ""); res.Code != http.StatusTooManyRequests {
		t.Errorf("21st counted guess: got %d", res.Code)
	}
}

func TestUnknownUsernameCostsAsManyReadsAsUnknownListPath(t *testing.T) {
	router, fake := visitorRouter(t)
	requests := func(target string) int {
		before := fake.Requests()
		visit(router, "POST", target, "", `{"password":"x"}`, "")
		return fake.Requests() - before
	}
	unknownList := requests("/v1/published-lists/andrei/nothing/unlock")
	if got := requests("/v1/published-lists/nobody/nothing/unlock"); got != unknownList {
		t.Errorf("unknown username: %d Firestore requests, unknown list path: %d", got, unknownList)
	}
}
