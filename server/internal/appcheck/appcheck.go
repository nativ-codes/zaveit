// Package appcheck verifies Firebase App Check tokens, following
// https://firebase.google.com/docs/app-check/custom-resource-backend.
package appcheck

import (
	"errors"
	"slices"
	"time"

	"zaveit/server/internal/jwks"
)

const issuerPrefix = "https://firebaseappcheck.googleapis.com/"

// ErrInvalidToken is returned for every rejected token. Its message never quotes the token.
var ErrInvalidToken = errors.New("invalid app check token")

// Verifier checks tokens against one Firebase project. Use New to create one.
type Verifier struct {
	projectNumber string
	keys          *jwks.Keys
}

// New returns a Verifier for the project's number, not its id.
func New(projectNumber string) *Verifier {
	return &Verifier{projectNumber: projectNumber, keys: jwks.New(issuerPrefix + "v1/jwks")}
}

// Verify returns nil only for an unexpired token signed by Firebase for this project.
func (v *Verifier) Verify(token string) error {
	var claims struct {
		Iss string   `json:"iss"`
		Aud []string `json:"aud"`
		Exp int64    `json:"exp"`
	}
	if v.keys.Verify(token, &claims) != nil ||
		claims.Iss != issuerPrefix+v.projectNumber ||
		!slices.Contains(claims.Aud, "projects/"+v.projectNumber) ||
		time.Now().Unix() >= claims.Exp {
		return ErrInvalidToken
	}
	return nil
}
