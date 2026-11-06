// Package jwkstest signs test tokens and serves their key, for the verifier tests.
package jwkstest

import (
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"math/big"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
)

// Key is served as "k1" by Server.
var Key = NewKey()

// NewKey makes a key Server does not serve.
func NewKey() *rsa.PrivateKey {
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		panic(err)
	}
	return key
}

// Segment is value as a base64url JSON token segment.
func Segment(t *testing.T, value any) string {
	t.Helper()
	raw, err := json.Marshal(value)
	if err != nil {
		t.Fatal(err)
	}
	return base64.RawURLEncoding.EncodeToString(raw)
}

// Sign makes a token signed with key.
func Sign(t *testing.T, key *rsa.PrivateKey, header, claims any) string {
	t.Helper()
	unsigned := Segment(t, header) + "." + Segment(t, claims)
	digest := sha256.Sum256([]byte(unsigned))
	signature, err := rsa.SignPKCS1v15(rand.Reader, key, crypto.SHA256, digest[:])
	if err != nil {
		t.Fatal(err)
	}
	return unsigned + "." + base64.RawURLEncoding.EncodeToString(signature)
}

// Header is a valid header for a token signed with Key.
func Header() map[string]any {
	return map[string]any{"alg": "RS256", "typ": "JWT", "kid": "k1"}
}

// With sets key on base and returns it.
func With(base map[string]any, key string, value any) map[string]any {
	base[key] = value
	return base
}

// Server serves Key as k1 and counts how many times the keys are fetched.
func Server(t *testing.T) (string, *atomic.Int32) {
	t.Helper()
	fetches := new(atomic.Int32)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		fetches.Add(1)
		json.NewEncoder(w).Encode(map[string]any{"keys": []map[string]string{{
			"kty": "RSA",
			"kid": "k1",
			"n":   base64.RawURLEncoding.EncodeToString(Key.N.Bytes()),
			"e":   base64.RawURLEncoding.EncodeToString(big.NewInt(int64(Key.E)).Bytes()),
		}}})
	}))
	t.Cleanup(server.Close)
	return server.URL, fetches
}
