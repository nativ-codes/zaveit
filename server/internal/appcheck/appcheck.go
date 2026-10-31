// Package appcheck verifies Firebase App Check tokens, following
// https://firebase.google.com/docs/app-check/custom-resource-backend.
// It uses only the standard library so the server stays dependency free.
package appcheck

import (
	"crypto"
	"crypto/rsa"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"math/big"
	"net/http"
	"slices"
	"strings"
	"sync"
	"time"
)

const (
	issuerPrefix = "https://firebaseappcheck.googleapis.com/"
	jwksURL      = issuerPrefix + "v1/jwks"
	// Google serves the keys with max-age=21600.
	keysTTL = 6 * time.Hour
	// Bounds fetches, because an unknown kid in a junk token would otherwise trigger one per request.
	fetchCooldown = time.Minute
	maxJWKSBytes  = 1 << 20
)

// ErrInvalidToken is returned for every rejected token. Its message never quotes the token.
var ErrInvalidToken = errors.New("invalid app check token")

// Verifier checks tokens against one Firebase project. Use New to create one.
type Verifier struct {
	projectNumber string
	jwksURL       string
	client        *http.Client

	mu          sync.Mutex
	keys        map[string]*rsa.PublicKey
	fetchedAt   time.Time
	attemptedAt time.Time
}

// New returns a Verifier for the project's number, not its id.
func New(projectNumber string) *Verifier {
	return &Verifier{
		projectNumber: projectNumber,
		jwksURL:       jwksURL,
		client:        &http.Client{Timeout: 5 * time.Second},
	}
}

// Verify returns nil only for an unexpired token signed by Firebase for this project.
func (v *Verifier) Verify(token string) error {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return ErrInvalidToken
	}

	var header struct {
		Alg string `json:"alg"`
		Typ string `json:"typ"`
		Kid string `json:"kid"`
	}
	if err := decodeSegment(parts[0], &header); err != nil {
		return ErrInvalidToken
	}
	// The algorithm is pinned, so a token can never choose how it is checked.
	if header.Alg != "RS256" || header.Typ != "JWT" {
		return ErrInvalidToken
	}

	key := v.key(header.Kid)
	if key == nil {
		return ErrInvalidToken
	}

	signature, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil {
		return ErrInvalidToken
	}
	digest := sha256.Sum256([]byte(parts[0] + "." + parts[1]))
	if rsa.VerifyPKCS1v15(key, crypto.SHA256, digest[:], signature) != nil {
		return ErrInvalidToken
	}

	var claims struct {
		Iss string   `json:"iss"`
		Aud []string `json:"aud"`
		Exp int64    `json:"exp"`
	}
	if err := decodeSegment(parts[1], &claims); err != nil {
		return ErrInvalidToken
	}
	if claims.Iss != issuerPrefix+v.projectNumber ||
		!slices.Contains(claims.Aud, "projects/"+v.projectNumber) ||
		time.Now().Unix() >= claims.Exp {
		return ErrInvalidToken
	}
	return nil
}

func decodeSegment(segment string, into any) error {
	raw, err := base64.RawURLEncoding.DecodeString(segment)
	if err != nil {
		return err
	}
	return json.Unmarshal(raw, into)
}

// key returns the public key for kid, or nil. It keeps serving cached keys when a refresh
// fails, so a short Google outage does not reject every request.
func (v *Verifier) key(kid string) *rsa.PublicKey {
	v.mu.Lock()
	defer v.mu.Unlock()

	key := v.keys[kid]
	if key != nil && time.Since(v.fetchedAt) < keysTTL {
		return key
	}
	if time.Since(v.attemptedAt) < fetchCooldown {
		return key
	}

	v.attemptedAt = time.Now()
	keys, err := v.fetchKeys()
	if err != nil {
		log.Printf("app check keys: %v", err)
		return key
	}
	v.keys = keys
	v.fetchedAt = time.Now()
	return keys[kid]
}

func (v *Verifier) fetchKeys() (map[string]*rsa.PublicKey, error) {
	res, err := v.client.Get(v.jwksURL)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("jwks answered %d", res.StatusCode)
	}

	var body struct {
		Keys []struct {
			Kty string `json:"kty"`
			Kid string `json:"kid"`
			N   string `json:"n"`
			E   string `json:"e"`
		} `json:"keys"`
	}
	if err := json.NewDecoder(io.LimitReader(res.Body, maxJWKSBytes)).Decode(&body); err != nil {
		return nil, err
	}

	keys := make(map[string]*rsa.PublicKey, len(body.Keys))
	for _, jwk := range body.Keys {
		if jwk.Kty != "RSA" {
			continue
		}
		n, err := base64.RawURLEncoding.DecodeString(jwk.N)
		if err != nil {
			return nil, err
		}
		e, err := base64.RawURLEncoding.DecodeString(jwk.E)
		if err != nil {
			return nil, err
		}
		exponent := new(big.Int).SetBytes(e)
		if !exponent.IsInt64() || exponent.Int64() > 1<<31-1 {
			return nil, errors.New("jwks key has an oversized exponent")
		}
		keys[jwk.Kid] = &rsa.PublicKey{N: new(big.Int).SetBytes(n), E: int(exponent.Int64())}
	}
	if len(keys) == 0 {
		return nil, errors.New("jwks has no usable keys")
	}
	return keys, nil
}
