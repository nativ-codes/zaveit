// Package jwks checks the signature of RS256 JWTs against a cached JSON Web Key Set.
// The App Check and ID token verifiers share it; each checks its own claims.
// It uses only the standard library so the server stays dependency free.
package jwks

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
	"strings"
	"sync"
	"time"
)

const (
	// Google serves its keys with max-age of about six hours.
	keysTTL = 6 * time.Hour
	// Bounds fetches, because an unknown kid in a junk token would otherwise trigger one per request.
	fetchCooldown = time.Minute
	maxJWKSBytes  = 1 << 20
)

// ErrInvalid is returned for every rejected token. Its message never quotes the token.
var ErrInvalid = errors.New("invalid token")

// Keys is the key set served at one URL. Use New to create one.
type Keys struct {
	url    string
	client *http.Client

	mu          sync.Mutex
	keys        map[string]*rsa.PublicKey
	fetchedAt   time.Time
	attemptedAt time.Time
}

// New returns the key set served at url, fetched on first use.
func New(url string) *Keys {
	return &Keys{url: url, client: &http.Client{Timeout: 5 * time.Second}}
}

// Verify decodes the claims of a JWT signed with RS256 by one of the keys, without checking them.
func (k *Keys) Verify(token string, claims any) error {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return ErrInvalid
	}

	var header struct {
		Alg string `json:"alg"`
		Typ string `json:"typ"`
		Kid string `json:"kid"`
	}
	if err := decodeSegment(parts[0], &header); err != nil {
		return ErrInvalid
	}
	// The algorithm is pinned, so a token can never choose how it is checked.
	if header.Alg != "RS256" || header.Typ != "JWT" {
		return ErrInvalid
	}

	key := k.key(header.Kid)
	if key == nil {
		return ErrInvalid
	}

	signature, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil {
		return ErrInvalid
	}
	digest := sha256.Sum256([]byte(parts[0] + "." + parts[1]))
	if rsa.VerifyPKCS1v15(key, crypto.SHA256, digest[:], signature) != nil {
		return ErrInvalid
	}
	if decodeSegment(parts[1], claims) != nil {
		return ErrInvalid
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
func (k *Keys) key(kid string) *rsa.PublicKey {
	k.mu.Lock()
	defer k.mu.Unlock()

	key := k.keys[kid]
	if key != nil && time.Since(k.fetchedAt) < keysTTL {
		return key
	}
	if time.Since(k.attemptedAt) < fetchCooldown {
		return key
	}

	k.attemptedAt = time.Now()
	keys, err := k.fetchKeys()
	if err != nil {
		log.Printf("keys from %s: %v", k.url, err)
		return key
	}
	k.keys = keys
	k.fetchedAt = time.Now()
	return keys[kid]
}

func (k *Keys) fetchKeys() (map[string]*rsa.PublicKey, error) {
	res, err := k.client.Get(k.url)
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
