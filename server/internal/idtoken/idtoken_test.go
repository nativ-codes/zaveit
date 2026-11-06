package idtoken

import (
	"testing"
	"time"

	"zaveit/server/internal/jwks"
	"zaveit/server/internal/jwks/jwkstest"
)

const project = "zaveit-test"

func validClaims() map[string]any {
	return map[string]any{
		"iss": issuerPrefix + project,
		"aud": project,
		"exp": time.Now().Add(time.Hour).Unix(),
		"sub": "user-1",
	}
}

func newVerifier(t *testing.T) *Verifier {
	url, _ := jwkstest.Server(t)
	verifier := New(project)
	verifier.keys = jwks.New(url)
	return verifier
}

func TestVerifyReturnsUID(t *testing.T) {
	uid, err := newVerifier(t).Verify(jwkstest.Sign(t, jwkstest.Key, jwkstest.Header(), validClaims()))
	if err != nil {
		t.Fatal(err)
	}
	if uid != "user-1" {
		t.Errorf("got uid %q", uid)
	}
}

func TestVerifyRejects(t *testing.T) {
	tokens := map[string]string{
		"not a jwt":      "nope",
		"unknown key":    jwkstest.Sign(t, jwkstest.NewKey(), jwkstest.With(jwkstest.Header(), "kid", "other"), validClaims()),
		"foreign key":    jwkstest.Sign(t, jwkstest.NewKey(), jwkstest.Header(), validClaims()),
		"expired":        jwkstest.Sign(t, jwkstest.Key, jwkstest.Header(), jwkstest.With(validClaims(), "exp", time.Now().Add(-time.Second).Unix())),
		"no exp":         jwkstest.Sign(t, jwkstest.Key, jwkstest.Header(), jwkstest.With(validClaims(), "exp", 0)),
		"wrong issuer":   jwkstest.Sign(t, jwkstest.Key, jwkstest.Header(), jwkstest.With(validClaims(), "iss", issuerPrefix+"other")),
		"wrong audience": jwkstest.Sign(t, jwkstest.Key, jwkstest.Header(), jwkstest.With(validClaims(), "aud", "other")),
		"no uid":         jwkstest.Sign(t, jwkstest.Key, jwkstest.Header(), jwkstest.With(validClaims(), "sub", "")),
	}

	for name, token := range tokens {
		t.Run(name, func(t *testing.T) {
			if uid, err := newVerifier(t).Verify(token); err == nil || uid != "" {
				t.Errorf("token was accepted as %q", uid)
			}
		})
	}
}
