package api

import (
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"

	"zaveit/server/internal/deepseek"
	"zaveit/server/internal/firestore"
	"zaveit/server/internal/firestore/firestoretest"
	"zaveit/server/internal/r2"
)

func TestValidUsername(t *testing.T) {
	for name, want := range map[string]bool{
		"abc":                   true,
		"andrei-otea":           true,
		"a1-b2-c3":              true,
		"007":                   true,
		strings.Repeat("a", 30): true,
		"ab":                    false,
		strings.Repeat("a", 31): false,
		"-abc":                  false,
		"abc-":                  false,
		"a--b":                  false,
		"Abc":                   false,
		"a_b":                   false,
		"a.b":                   false,
		"a b":                   false,
		"élan":                  false,
		"":                      false,
	} {
		if got := validUsername(name); got != want {
			t.Errorf("validUsername(%q) = %v, want %v", name, got, want)
		}
	}
}

// usernameRouter (Visitor token secret "test-secret") accepts the ID tokens "u1", "u2" and "u3" as those uids, backed by the Firestore fake.
func usernameRouter(t *testing.T, appCheck VerifyToken) (http.Handler, *firestoretest.Server) {
	t.Helper()
	fake := firestoretest.New(t)
	verifyUser := func(token string) (string, error) {
		if token == "u1" || token == "u2" || token == "u3" {
			return token, nil
		}
		return "", errors.New("rejected")
	}
	db := &firestore.Client{BaseURL: fake.URL, ProjectID: "p"}
	return NewRouter(deepseek.Client{}, false, SourcesCheck{}, appCheck, verifyUser, r2.Client{}, db, "test-secret"), fake
}

var ownerRequests int
var ownerRequestsMu sync.Mutex

func ownerSend(router http.Handler, method, target, token, body string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, target, strings.NewReader(body))
	req.Header.Set("Authorization", "Bearer "+token)
	ownerRequestsMu.Lock()
	ownerRequests++
	// A different address per request keeps the per-IP limiter out of the way.
	req.RemoteAddr = fmt.Sprintf("10.1.%d.%d:1", ownerRequests/256, ownerRequests%256)
	ownerRequestsMu.Unlock()
	res := httptest.NewRecorder()
	router.ServeHTTP(res, req)
	return res
}

func uid(fields map[string]any) any {
	value, _ := fields["uid"].(map[string]any)
	return value["stringValue"]
}

func TestClaimUsername(t *testing.T) {
	router, fake := usernameRouter(t, allowAll)

	if res := ownerSend(router, "POST", "/v1/username", "u1", `{"username":"Andrei"}`); res.Code != http.StatusCreated {
		t.Fatalf("claim: got %d %s", res.Code, res.Body)
	}
	if fields, ok := fake.Doc("usernames/andrei"); !ok || uid(fields) != "u1" {
		t.Fatalf("stored %v %v", ok, fields)
	}
	if res := ownerSend(router, "POST", "/v1/username", "u2", `{"username":"andrei"}`); res.Code != http.StatusConflict {
		t.Errorf("taken: got %d %s", res.Code, res.Body)
	}
	if res := ownerSend(router, "POST", "/v1/username", "u1", `{"username":"second"}`); res.Code != http.StatusConflict {
		t.Errorf("already has one: got %d %s", res.Code, res.Body)
	}
	if _, ok := fake.Doc("usernames/second"); ok {
		t.Error("a second Username was stored")
	}
}

func TestClaimUsernameRejectsInvalidAndReserved(t *testing.T) {
	router, fake := usernameRouter(t, allowAll)
	for _, body := range []string{`{"username":"ab"}`, `{"username":"a--b"}`, `{"username":"admin"}`, `{"username":"nativcodes"}`, `{}`, `not json`} {
		if res := ownerSend(router, "POST", "/v1/username", "u1", body); res.Code != http.StatusBadRequest {
			t.Errorf("%s: got %d %s", body, res.Code, res.Body)
		}
	}
	if _, ok := fake.Doc("usernames/admin"); ok {
		t.Error("a reserved name was stored")
	}
}

func TestConcurrentClaimsOneWins(t *testing.T) {
	router, fake := usernameRouter(t, allowAll)
	codes := make(chan int, 3)
	var wg sync.WaitGroup
	for _, token := range []string{"u1", "u2", "u3"} {
		wg.Go(func() { codes <- ownerSend(router, "POST", "/v1/username", token, `{"username":"race"}`).Code })
	}
	wg.Wait()
	close(codes)
	won := 0
	for code := range codes {
		switch code {
		case http.StatusCreated:
			won++
		case http.StatusConflict:
		default:
			t.Errorf("got %d", code)
		}
	}
	if _, ok := fake.Doc("usernames/race"); won != 1 || !ok {
		t.Errorf("%d claims won", won)
	}
}

func TestUsernameAvailability(t *testing.T) {
	router, fake := usernameRouter(t, allowAll)
	fake.Put("usernames/taken", map[string]any{"uid": map[string]any{"stringValue": "u2"}})
	for target, want := range map[string]string{
		"/v1/username/free":  `{"available":true}`,
		"/v1/username/Free":  `{"available":true}`,
		"/v1/username/taken": `{"available":false}`,
		"/v1/username/admin": `{"available":false}`,
	} {
		res := ownerSend(router, "GET", target, "u1", "")
		if res.Code != http.StatusOK || strings.TrimSpace(res.Body.String()) != want {
			t.Errorf("%s: got %d %s", target, res.Code, res.Body)
		}
	}
	if res := ownerSend(router, "GET", "/v1/username/a--b", "u1", ""); res.Code != http.StatusBadRequest {
		t.Errorf("invalid: got %d", res.Code)
	}
}

func TestGetListsReturnsUsername(t *testing.T) {
	router, fake := usernameRouter(t, allowAll)
	if res := ownerSend(router, "GET", "/v1/lists", "u1", ""); res.Code != http.StatusOK || strings.TrimSpace(res.Body.String()) != `{"lists":[],"username":null}` {
		t.Errorf("no Username: got %d %s", res.Code, res.Body)
	}
	fake.Put("usernames/andrei", map[string]any{"uid": map[string]any{"stringValue": "u1"}})
	fake.Put("usernames/other", map[string]any{"uid": map[string]any{"stringValue": "u2"}})
	if res := ownerSend(router, "GET", "/v1/lists", "u1", ""); res.Code != http.StatusOK || strings.TrimSpace(res.Body.String()) != `{"lists":[],"username":"andrei"}` {
		t.Errorf("with Username: got %d %s", res.Code, res.Body)
	}
}

func TestOwnerEndpointsNeedIDTokenAppCheckAndFirestore(t *testing.T) {
	requests := [][2]string{{"GET", "/v1/username/free"}, {"POST", "/v1/username"}, {"GET", "/v1/lists"}, {"POST", "/v1/lists"}, {"DELETE", "/v1/username"}}

	router, _ := usernameRouter(t, allowAll)
	for _, r := range requests {
		if res := ownerSend(router, r[0], r[1], "bad", `{"username":"free"}`); res.Code != http.StatusUnauthorized {
			t.Errorf("%v without ID token: got %d", r, res.Code)
		}
	}

	router, _ = usernameRouter(t, func(string) error { return errors.New("rejected") })
	for _, r := range requests {
		if res := ownerSend(router, r[0], r[1], "u1", `{"username":"free"}`); res.Code != http.StatusUnauthorized {
			t.Errorf("%v without App Check: got %d", r, res.Code)
		}
	}
}

func TestDeleteUsernameRemovesListsAndUsername(t *testing.T) {
	router, fake := usernameRouter(t, allowAll)
	fake.Put("usernames/andrei", map[string]any{"uid": map[string]any{"stringValue": "u1"}})
	fake.Put("usernames/other", map[string]any{"uid": map[string]any{"stringValue": "u2"}})
	for _, path := range []string{"users/u1/lists/one", "users/u1/lists/two", "users/u2/lists/keep"} {
		fake.Put(path, map[string]any{"name": map[string]any{"stringValue": "x"}})
	}
	if res := ownerSend(router, "DELETE", "/v1/username", "u1", ""); res.Code != http.StatusNoContent {
		t.Fatalf("got %d: %s", res.Code, res.Body)
	}
	for _, gone := range []string{"usernames/andrei", "users/u1/lists/one", "users/u1/lists/two"} {
		if _, ok := fake.Doc(gone); ok {
			t.Errorf("%s still exists", gone)
		}
	}
	for _, kept := range []string{"usernames/other", "users/u2/lists/keep"} {
		if _, ok := fake.Doc(kept); !ok {
			t.Errorf("%s was deleted", kept)
		}
	}
}

func TestDeleteUsernameWhenNothingExists(t *testing.T) {
	router, _ := usernameRouter(t, allowAll)
	if res := ownerSend(router, "DELETE", "/v1/username", "u1", ""); res.Code != http.StatusNoContent {
		t.Fatalf("got %d: %s", res.Code, res.Body)
	}
}
