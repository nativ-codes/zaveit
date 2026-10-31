package appcheck

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
	"strings"
	"sync/atomic"
	"testing"
	"time"
)

const project = "123"

var testKey = mustKey()

func mustKey() *rsa.PrivateKey {
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		panic(err)
	}
	return key
}

func segment(t *testing.T, value any) string {
	t.Helper()
	raw, err := json.Marshal(value)
	if err != nil {
		t.Fatal(err)
	}
	return base64.RawURLEncoding.EncodeToString(raw)
}

func sign(t *testing.T, key *rsa.PrivateKey, header, claims any) string {
	t.Helper()
	unsigned := segment(t, header) + "." + segment(t, claims)
	digest := sha256.Sum256([]byte(unsigned))
	signature, err := rsa.SignPKCS1v15(rand.Reader, key, crypto.SHA256, digest[:])
	if err != nil {
		t.Fatal(err)
	}
	return unsigned + "." + base64.RawURLEncoding.EncodeToString(signature)
}

func validHeader() map[string]any {
	return map[string]any{"alg": "RS256", "typ": "JWT", "kid": "k1"}
}

func validClaims() map[string]any {
	return map[string]any{
		"iss": issuerPrefix + project,
		"aud": []string{"projects/" + project, "projects/some-id"},
		"exp": time.Now().Add(time.Hour).Unix(),
	}
}

func with(base map[string]any, key string, value any) map[string]any {
	base[key] = value
	return base
}

// newVerifier serves testKey as k1 and counts how many times the keys are fetched.
func newVerifier(t *testing.T) (*Verifier, *atomic.Int32) {
	t.Helper()
	fetches := new(atomic.Int32)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		fetches.Add(1)
		json.NewEncoder(w).Encode(map[string]any{"keys": []map[string]string{{
			"kty": "RSA",
			"kid": "k1",
			"n":   base64.RawURLEncoding.EncodeToString(testKey.N.Bytes()),
			"e":   base64.RawURLEncoding.EncodeToString(big.NewInt(int64(testKey.E)).Bytes()),
		}}})
	}))
	t.Cleanup(server.Close)

	verifier := New(project)
	verifier.jwksURL = server.URL
	return verifier, fetches
}

func TestVerifyAcceptsValidToken(t *testing.T) {
	verifier, _ := newVerifier(t)
	if err := verifier.Verify(sign(t, testKey, validHeader(), validClaims())); err != nil {
		t.Fatal(err)
	}
}

func TestVerifyRejects(t *testing.T) {
	good := sign(t, testKey, validHeader(), validClaims())
	parts := strings.Split(good, ".")

	tokens := map[string]string{
		"empty":           "",
		"not a jwt":       "nope",
		"bad segments":    "a.b.c",
		"foreign key":     sign(t, mustKey(), validHeader(), validClaims()),
		"unknown kid":     sign(t, testKey, with(validHeader(), "kid", "other"), validClaims()),
		"hs256":           sign(t, testKey, with(validHeader(), "alg", "HS256"), validClaims()),
		"alg none":        segment(t, with(validHeader(), "alg", "none")) + "." + parts[1] + ".",
		"wrong typ":       sign(t, testKey, with(validHeader(), "typ", "at+jwt"), validClaims()),
		"tampered claims": parts[0] + "." + segment(t, with(validClaims(), "iss", "x")) + "." + parts[2],
		"empty signature": parts[0] + "." + parts[1] + ".",
		"expired":         sign(t, testKey, validHeader(), with(validClaims(), "exp", time.Now().Add(-time.Second).Unix())),
		"no exp":          sign(t, testKey, validHeader(), with(validClaims(), "exp", 0)),
		"wrong issuer":    sign(t, testKey, validHeader(), with(validClaims(), "iss", issuerPrefix+"999")),
		"wrong audience":  sign(t, testKey, validHeader(), with(validClaims(), "aud", []string{"projects/999"})),
		"string audience": sign(t, testKey, validHeader(), with(validClaims(), "aud", "projects/"+project)),
	}

	for name, token := range tokens {
		t.Run(name, func(t *testing.T) {
			verifier, _ := newVerifier(t)
			if verifier.Verify(token) == nil {
				t.Error("token was accepted")
			}
		})
	}
}

func TestUnknownKidCannotForceFetches(t *testing.T) {
	verifier, fetches := newVerifier(t)
	token := sign(t, testKey, with(validHeader(), "kid", "other"), validClaims())
	for range 5 {
		verifier.Verify(token)
	}
	if got := fetches.Load(); got != 1 {
		t.Errorf("fetched keys %d times", got)
	}
}

func TestKeysAreCached(t *testing.T) {
	verifier, fetches := newVerifier(t)
	token := sign(t, testKey, validHeader(), validClaims())
	for range 3 {
		if err := verifier.Verify(token); err != nil {
			t.Fatal(err)
		}
	}
	if got := fetches.Load(); got != 1 {
		t.Errorf("fetched keys %d times", got)
	}
}

func TestStaleKeysSurviveFailedRefresh(t *testing.T) {
	verifier, _ := newVerifier(t)
	token := sign(t, testKey, validHeader(), validClaims())
	if err := verifier.Verify(token); err != nil {
		t.Fatal(err)
	}

	verifier.jwksURL = "http://127.0.0.1:1"
	verifier.fetchedAt = time.Now().Add(-2 * keysTTL)
	verifier.attemptedAt = time.Time{}
	if err := verifier.Verify(token); err != nil {
		t.Errorf("stale key was dropped: %v", err)
	}
}
