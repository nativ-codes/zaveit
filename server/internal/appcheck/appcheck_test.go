package appcheck

import (
	"testing"
	"time"

	"zaveit/server/internal/jwks"
	"zaveit/server/internal/jwks/jwkstest"
)

const project = "123"

func validClaims() map[string]any {
	return map[string]any{
		"iss": issuerPrefix + project,
		"aud": []string{"projects/" + project, "projects/some-id"},
		"exp": time.Now().Add(time.Hour).Unix(),
	}
}

func newVerifier(t *testing.T) *Verifier {
	url, _ := jwkstest.Server(t)
	verifier := New(project)
	verifier.keys = jwks.New(url)
	return verifier
}

func TestVerifyAcceptsValidToken(t *testing.T) {
	if err := newVerifier(t).Verify(jwkstest.Sign(t, jwkstest.Key, jwkstest.Header(), validClaims())); err != nil {
		t.Fatal(err)
	}
}

func TestVerifyRejects(t *testing.T) {
	tokens := map[string]string{
		"not a jwt":       "nope",
		"foreign key":     jwkstest.Sign(t, jwkstest.NewKey(), jwkstest.Header(), validClaims()),
		"expired":         jwkstest.Sign(t, jwkstest.Key, jwkstest.Header(), jwkstest.With(validClaims(), "exp", time.Now().Add(-time.Second).Unix())),
		"no exp":          jwkstest.Sign(t, jwkstest.Key, jwkstest.Header(), jwkstest.With(validClaims(), "exp", 0)),
		"wrong issuer":    jwkstest.Sign(t, jwkstest.Key, jwkstest.Header(), jwkstest.With(validClaims(), "iss", issuerPrefix+"999")),
		"wrong audience":  jwkstest.Sign(t, jwkstest.Key, jwkstest.Header(), jwkstest.With(validClaims(), "aud", []string{"projects/999"})),
		"string audience": jwkstest.Sign(t, jwkstest.Key, jwkstest.Header(), jwkstest.With(validClaims(), "aud", "projects/"+project)),
	}

	for name, token := range tokens {
		t.Run(name, func(t *testing.T) {
			if newVerifier(t).Verify(token) == nil {
				t.Error("token was accepted")
			}
		})
	}
}
