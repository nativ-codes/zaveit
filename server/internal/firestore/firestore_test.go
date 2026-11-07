package firestore_test

import (
	"context"
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"sync/atomic"
	"testing"

	"zaveit/server/internal/firestore"
	"zaveit/server/internal/firestore/firestoretest"
	"zaveit/server/internal/jwks/jwkstest"
)

var ctx = context.Background()

func str(s string) firestore.Value { return firestore.Value{StringValue: &s} }

func TestGetQueryAndCommit(t *testing.T) {
	fake := firestoretest.New(t)
	fake.Put("lists/b", map[string]any{"userId": map[string]any{"stringValue": "u1"}})
	fake.Put("lists/a", map[string]any{"userId": map[string]any{"stringValue": "u1"}})
	fake.Put("lists/c", map[string]any{"userId": map[string]any{"stringValue": "u2"}})
	client := &firestore.Client{BaseURL: fake.URL, ProjectID: "p"}

	if _, err := client.Get(ctx, "usernames/andrei"); !errors.Is(err, firestore.ErrNotFound) {
		t.Fatalf("missing document: got %v", err)
	}

	no := false
	err := client.Commit(ctx, []firestore.Write{
		{Path: "usernames/andrei", Fields: map[string]firestore.Value{"uid": str("u1")}, Exists: &no},
		{Path: "lists/a", Delete: true},
	})
	if err != nil {
		t.Fatal(err)
	}
	doc, err := client.Get(ctx, "usernames/andrei")
	if err != nil || doc.Path != "usernames/andrei" || *doc.Fields["uid"].StringValue != "u1" {
		t.Fatalf("got %+v %v", doc, err)
	}

	docs, err := client.Query(ctx, "", "lists", &firestore.Where{Field: "userId", Value: str("u1")}, 1)
	if err != nil || len(docs) != 1 || docs[0].Path != "lists/b" {
		t.Fatalf("lowest matching id should win, got %+v %v", docs, err)
	}
	docs, err = client.Query(ctx, "users/u1", "lists", nil, 10)
	if err != nil || len(docs) != 0 {
		t.Fatalf("empty subcollection: got %+v %v", docs, err)
	}

	// A lost claim fails as a whole: the second write must not land.
	err = client.Commit(ctx, []firestore.Write{
		{Path: "usernames/other", Fields: map[string]firestore.Value{"uid": str("u2")}},
		{Path: "usernames/andrei", Fields: map[string]firestore.Value{"uid": str("u2")}, Exists: &no},
	})
	if !errors.Is(err, firestore.ErrPrecondition) {
		t.Fatalf("taken name: got %v", err)
	}
	if _, err := client.Get(ctx, "usernames/other"); !errors.Is(err, firestore.ErrNotFound) {
		t.Errorf("failed commit applied a write: %v", err)
	}

	yes := true
	err = client.Commit(ctx, []firestore.Write{{Path: "usernames/nobody", Delete: true, Exists: &yes}})
	if !errors.Is(err, firestore.ErrPrecondition) {
		t.Errorf("exists: true on a missing document: got %v", err)
	}
}

// ABORTED shares HTTP 409 with ALREADY_EXISTS, so it must not read as a lost precondition.
func TestAbortedIsNotAPreconditionFailure(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusConflict)
		w.Write([]byte(`{"error":{"code":409,"message":"Too much contention","status":"ABORTED"}}`))
	}))
	defer server.Close()
	client := &firestore.Client{BaseURL: server.URL, ProjectID: "p"}
	err := client.Commit(ctx, []firestore.Write{{Path: "usernames/a", Delete: true}})
	if err == nil || errors.Is(err, firestore.ErrPrecondition) {
		t.Errorf("got %v", err)
	}
}

func TestNewAuthenticatesAndCachesTheToken(t *testing.T) {
	var fetches atomic.Int32
	expiresIn := 3600
	tokens := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fetches.Add(1)
		if r.FormValue("grant_type") != "urn:ietf:params:oauth:grant-type:jwt-bearer" || r.FormValue("assertion") == "" {
			http.Error(w, "bad grant", http.StatusBadRequest)
			return
		}
		json.NewEncoder(w).Encode(map[string]any{"access_token": "tok", "expires_in": expiresIn})
	}))
	defer tokens.Close()

	der, _ := x509.MarshalPKCS8PrivateKey(jwkstest.Key)
	keyFile := filepath.Join(t.TempDir(), "key.json")
	key, _ := json.Marshal(map[string]string{
		"project_id":   "p",
		"client_email": "server@p.iam.gserviceaccount.com",
		"private_key":  string(pem.EncodeToMemory(&pem.Block{Type: "PRIVATE KEY", Bytes: der})),
		"token_uri":    tokens.URL,
	})
	os.WriteFile(keyFile, key, 0o600)

	var auth string
	firestoreAPI := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		auth = r.Header.Get("Authorization")
		w.Write([]byte(`{"name":"projects/p/databases/(default)/documents/a/b"}`))
	}))
	defer firestoreAPI.Close()

	client, err := firestore.New(keyFile)
	if err != nil || client.ProjectID != "p" {
		t.Fatalf("got %+v %v", client, err)
	}
	client.BaseURL = firestoreAPI.URL
	client.Get(ctx, "a/b")
	client.Get(ctx, "a/b")
	if auth != "Bearer tok" || fetches.Load() != 1 {
		t.Errorf("got auth %q after %d fetches, want one cached token", auth, fetches.Load())
	}

	// A token that expires within the safety margin is fetched again.
	expiresIn = 30
	client, _ = firestore.New(keyFile)
	client.BaseURL = firestoreAPI.URL
	client.Get(ctx, "a/b")
	client.Get(ctx, "a/b")
	if fetches.Load() != 3 {
		t.Errorf("got %d fetches, want a fresh token per call near expiry", fetches.Load())
	}

	if _, err := firestore.New(filepath.Join(t.TempDir(), "missing.json")); err == nil {
		t.Error("a missing key file should fail clearly")
	}
}
