// Package idtoken verifies Firebase ID tokens and returns the signed-in user's uid, following
// https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library.
package idtoken

import (
	"errors"
	"time"

	"zaveit/server/internal/jwks"
)

const (
	issuerPrefix = "https://securetoken.google.com/"
	// The JWK form of the x509 certificates the Firebase docs point to.
	keysURL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
)

// ErrInvalidToken is returned for every rejected token. Its message never quotes the token.
var ErrInvalidToken = errors.New("invalid id token")

// Verifier checks tokens against one Firebase project. Use New to create one.
type Verifier struct {
	projectID string
	keys      *jwks.Keys
}

// New returns a Verifier for the project's id, not its number.
func New(projectID string) *Verifier {
	return &Verifier{projectID: projectID, keys: jwks.New(keysURL)}
}

// Verify returns the uid of an unexpired token signed by Firebase for this project.
func (v *Verifier) Verify(token string) (string, error) {
	var claims struct {
		Iss string `json:"iss"`
		Aud string `json:"aud"`
		Exp int64  `json:"exp"`
		Sub string `json:"sub"`
	}
	if v.keys.Verify(token, &claims) != nil ||
		claims.Iss != issuerPrefix+v.projectID ||
		claims.Aud != v.projectID ||
		time.Now().Unix() >= claims.Exp ||
		claims.Sub == "" {
		return "", ErrInvalidToken
	}
	return claims.Sub, nil
}
