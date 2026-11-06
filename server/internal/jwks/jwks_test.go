package jwks

import (
	"strings"
	"testing"
	"time"

	"zaveit/server/internal/jwks/jwkstest"
)

var claims = map[string]any{"sub": "u1"}

func newKeys(t *testing.T) *Keys {
	url, _ := jwkstest.Server(t)
	return New(url)
}

func TestVerifyDecodesClaims(t *testing.T) {
	var got struct{ Sub string }
	if err := newKeys(t).Verify(jwkstest.Sign(t, jwkstest.Key, jwkstest.Header(), claims), &got); err != nil {
		t.Fatal(err)
	}
	if got.Sub != "u1" {
		t.Errorf("got sub %q", got.Sub)
	}
}

func TestVerifyRejects(t *testing.T) {
	good := jwkstest.Sign(t, jwkstest.Key, jwkstest.Header(), claims)
	parts := strings.Split(good, ".")

	tokens := map[string]string{
		"empty":           "",
		"not a jwt":       "nope",
		"bad segments":    "a.b.c",
		"foreign key":     jwkstest.Sign(t, jwkstest.NewKey(), jwkstest.Header(), claims),
		"unknown kid":     jwkstest.Sign(t, jwkstest.Key, jwkstest.With(jwkstest.Header(), "kid", "other"), claims),
		"hs256":           jwkstest.Sign(t, jwkstest.Key, jwkstest.With(jwkstest.Header(), "alg", "HS256"), claims),
		"alg none":        jwkstest.Segment(t, jwkstest.With(jwkstest.Header(), "alg", "none")) + "." + parts[1] + ".",
		"wrong typ":       jwkstest.Sign(t, jwkstest.Key, jwkstest.With(jwkstest.Header(), "typ", "at+jwt"), claims),
		"tampered claims": parts[0] + "." + jwkstest.Segment(t, map[string]any{"sub": "u2"}) + "." + parts[2],
		"empty signature": parts[0] + "." + parts[1] + ".",
	}

	for name, token := range tokens {
		t.Run(name, func(t *testing.T) {
			var got map[string]any
			if newKeys(t).Verify(token, &got) == nil {
				t.Error("token was accepted")
			}
		})
	}
}

func TestUnknownKidCannotForceFetches(t *testing.T) {
	url, fetches := jwkstest.Server(t)
	keys := New(url)
	token := jwkstest.Sign(t, jwkstest.Key, jwkstest.With(jwkstest.Header(), "kid", "other"), claims)
	for range 5 {
		keys.Verify(token, &map[string]any{})
	}
	if got := fetches.Load(); got != 1 {
		t.Errorf("fetched keys %d times", got)
	}
}

func TestKeysAreCached(t *testing.T) {
	url, fetches := jwkstest.Server(t)
	keys := New(url)
	token := jwkstest.Sign(t, jwkstest.Key, jwkstest.Header(), claims)
	for range 3 {
		if err := keys.Verify(token, &map[string]any{}); err != nil {
			t.Fatal(err)
		}
	}
	if got := fetches.Load(); got != 1 {
		t.Errorf("fetched keys %d times", got)
	}
}

func TestStaleKeysSurviveFailedRefresh(t *testing.T) {
	keys := newKeys(t)
	token := jwkstest.Sign(t, jwkstest.Key, jwkstest.Header(), claims)
	if err := keys.Verify(token, &map[string]any{}); err != nil {
		t.Fatal(err)
	}

	keys.url = "http://127.0.0.1:1"
	keys.fetchedAt = time.Now().Add(-2 * keysTTL)
	keys.attemptedAt = time.Time{}
	if err := keys.Verify(token, &map[string]any{}); err != nil {
		t.Errorf("stale key was dropped: %v", err)
	}
}
