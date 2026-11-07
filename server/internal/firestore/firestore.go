// Package firestore reads and writes Firestore through its REST API as a service account
// (https://firebase.google.com/docs/firestore/use-rest-api), with the standard library only.
// Service-account access skips Security Rules, so callers are the only access check.
package firestore

import (
	"bytes"
	"context"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"
)

const (
	scope = "https://www.googleapis.com/auth/datastore"
	// A token is refetched this long before it expires, so a request never carries one that lapses in flight.
	tokenMargin = time.Minute
)

var (
	// ErrNotFound is returned by Get for a missing document.
	ErrNotFound = errors.New("firestore: document not found")
	// ErrPrecondition is returned by Commit when a write's exists precondition fails. Nothing was written.
	ErrPrecondition = errors.New("firestore: precondition failed")
)

var httpClient = &http.Client{Timeout: 15 * time.Second}

// Client is one project's default database. Use New for a service account; a Client with no
// account sends no Authorization header, which suits the firestoretest fake.
type Client struct {
	BaseURL   string // https://firestore.googleapis.com, or a fake's URL
	ProjectID string

	account *account
}

// Value is a Firestore value in its REST JSON form; exactly one field is set.
type Value struct {
	StringValue    *string  `json:"stringValue,omitempty"`
	BooleanValue   *bool    `json:"booleanValue,omitempty"`
	IntegerValue   *string  `json:"integerValue,omitempty"` // int64 sent as a decimal string
	DoubleValue    *float64 `json:"doubleValue,omitempty"`
	TimestampValue *string  `json:"timestampValue,omitempty"` // RFC 3339
	NullValue      *string  `json:"nullValue,omitempty"`
	ArrayValue     *struct {
		Values []Value `json:"values,omitempty"`
	} `json:"arrayValue,omitempty"`
	MapValue *struct {
		Fields map[string]Value `json:"fields,omitempty"`
	} `json:"mapValue,omitempty"`
}

// Document is a document's path relative to the database root, such as "usernames/andrei", and its fields.
type Document struct {
	Path   string
	Fields map[string]Value
}

// Write replaces the document at Path with Fields, or deletes it. Exists, when set, is the
// currentDocument precondition: false to create only, true to touch only an existing document.
type Write struct {
	Path   string
	Fields map[string]Value
	Delete bool
	Exists *bool
}

// Where is an equality filter on one field.
type Where struct {
	Field string
	Value Value
}

// New reads a service-account key file, as downloaded from the Google Cloud console.
func New(keyFile string) (*Client, error) {
	raw, err := os.ReadFile(keyFile)
	if err != nil {
		return nil, fmt.Errorf("firestore: read service-account key: %w", err)
	}
	var key struct {
		ProjectID   string `json:"project_id"`
		ClientEmail string `json:"client_email"`
		PrivateKey  string `json:"private_key"`
		TokenURI    string `json:"token_uri"`
	}
	if err := json.Unmarshal(raw, &key); err != nil {
		return nil, fmt.Errorf("firestore: parse service-account key: %w", err)
	}
	block, _ := pem.Decode([]byte(key.PrivateKey))
	if block == nil || key.ProjectID == "" || key.ClientEmail == "" || key.TokenURI == "" {
		return nil, errors.New("firestore: service-account key is missing project_id, client_email, private_key or token_uri")
	}
	parsed, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	rsaKey, ok := parsed.(*rsa.PrivateKey)
	if err != nil || !ok {
		return nil, errors.New("firestore: service-account private_key is not a PKCS#8 RSA key")
	}
	return &Client{
		BaseURL:   "https://firestore.googleapis.com",
		ProjectID: key.ProjectID,
		account:   &account{email: key.ClientEmail, key: rsaKey, tokenURI: key.TokenURI},
	}, nil
}

// Get returns the document at path, or ErrNotFound.
func (c *Client) Get(ctx context.Context, path string) (Document, error) {
	var doc restDocument
	if err := c.do(ctx, http.MethodGet, "/"+path, nil, &doc); err != nil {
		return Document{}, err
	}
	return c.document(doc), nil
}

// Query returns up to limit documents of the collection under parent ("" for the root),
// ordered by document id, keeping only those matching where when it isn't nil.
func (c *Client) Query(ctx context.Context, parent, collection string, where *Where, limit int) ([]Document, error) {
	type field struct {
		FieldPath string `json:"fieldPath"`
	}
	query := map[string]any{
		"from":    []any{map[string]string{"collectionId": collection}},
		"orderBy": []any{map[string]any{"field": field{"__name__"}, "direction": "ASCENDING"}},
		"limit":   limit,
	}
	if where != nil {
		query["where"] = map[string]any{"fieldFilter": map[string]any{"field": field{where.Field}, "op": "EQUAL", "value": where.Value}}
	}
	if parent != "" {
		parent = "/" + parent
	}
	var results []struct {
		Document *restDocument `json:"document"`
	}
	if err := c.do(ctx, http.MethodPost, parent+":runQuery", map[string]any{"structuredQuery": query}, &results); err != nil {
		return nil, err
	}
	docs := []Document{}
	for _, result := range results {
		if result.Document != nil {
			docs = append(docs, c.document(*result.Document))
		}
	}
	return docs, nil
}

// Commit applies the writes atomically and in order: all of them, or none. A failed exists
// precondition returns ErrPrecondition.
func (c *Client) Commit(ctx context.Context, writes []Write) error {
	rest := make([]map[string]any, len(writes))
	for i, w := range writes {
		name := c.root() + w.Path
		if w.Delete {
			rest[i] = map[string]any{"delete": name}
		} else {
			rest[i] = map[string]any{"update": restDocument{Name: name, Fields: w.Fields}}
		}
		if w.Exists != nil {
			rest[i]["currentDocument"] = map[string]bool{"exists": *w.Exists}
		}
	}
	err := c.do(ctx, http.MethodPost, ":commit", map[string]any{"writes": rest}, nil)
	var apiErr *apiError
	// Read error.status, never the HTTP code alone: ABORTED shares 409 with ALREADY_EXISTS.
	// NOT_FOUND is what exists: true on a missing document returns, and a commit has no other cause for it.
	if errors.As(err, &apiErr) && (apiErr.Status == "ALREADY_EXISTS" || apiErr.Status == "FAILED_PRECONDITION" || apiErr.Status == "NOT_FOUND") {
		return fmt.Errorf("%w: %s", ErrPrecondition, apiErr.Message)
	}
	return err
}

type restDocument struct {
	Name   string           `json:"name"`
	Fields map[string]Value `json:"fields,omitempty"`
}

type apiError struct {
	Status, Message string
}

func (e *apiError) Error() string { return "firestore: " + e.Status + ": " + e.Message }

func (c *Client) root() string {
	return "projects/" + c.ProjectID + "/databases/(default)/documents/"
}

func (c *Client) document(doc restDocument) Document {
	return Document{Path: strings.TrimPrefix(doc.Name, c.root()), Fields: doc.Fields}
}

// do sends body as JSON to the documents resource plus suffix, and decodes a 2xx answer into out.
func (c *Client) do(ctx context.Context, method, suffix string, body, out any) error {
	var reqBody io.Reader
	if body != nil {
		raw, err := json.Marshal(body)
		if err != nil {
			return err
		}
		reqBody = bytes.NewReader(raw)
	}
	req, err := http.NewRequestWithContext(ctx, method, c.BaseURL+"/v1/"+strings.TrimSuffix(c.root(), "/")+suffix, reqBody)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	if c.account != nil {
		token, err := c.account.token(ctx)
		if err != nil {
			return err
		}
		req.Header.Set("Authorization", "Bearer "+token)
	}
	res, err := httpClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	resBody, err := io.ReadAll(res.Body)
	if err != nil {
		return err
	}
	if res.StatusCode/100 != 2 {
		var e struct{ Error apiError }
		if json.Unmarshal(resBody, &e) != nil || e.Error.Status == "" {
			return fmt.Errorf("firestore %s %s returned %s: %.200s", method, suffix, res.Status, resBody)
		}
		if e.Error.Status == "NOT_FOUND" && method == http.MethodGet {
			return ErrNotFound
		}
		return &e.Error
	}
	if out == nil {
		return nil
	}
	return json.Unmarshal(resBody, out)
}

// account exchanges a signed JWT for an OAuth access token
// (https://developers.google.com/identity/protocols/oauth2/service-account#httprest) and caches it.
type account struct {
	email, tokenURI string
	key             *rsa.PrivateKey

	mu      sync.Mutex
	cached  string
	expires time.Time
}

func (a *account) token(ctx context.Context) (string, error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	if a.cached != "" && time.Now().Before(a.expires.Add(-tokenMargin)) {
		return a.cached, nil
	}

	now := time.Now()
	segment := func(v any) string {
		raw, _ := json.Marshal(v)
		return base64.RawURLEncoding.EncodeToString(raw)
	}
	unsigned := segment(map[string]string{"alg": "RS256", "typ": "JWT"}) + "." + segment(map[string]any{
		"iss": a.email, "scope": scope, "aud": a.tokenURI, "iat": now.Unix(), "exp": now.Add(time.Hour).Unix(),
	})
	digest := sha256.Sum256([]byte(unsigned))
	signature, err := rsa.SignPKCS1v15(rand.Reader, a.key, crypto.SHA256, digest[:])
	if err != nil {
		return "", err
	}
	form := url.Values{
		"grant_type": {"urn:ietf:params:oauth:grant-type:jwt-bearer"},
		"assertion":  {unsigned + "." + base64.RawURLEncoding.EncodeToString(signature)},
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, a.tokenURI, strings.NewReader(form.Encode()))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	res, err := httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()
	resBody, err := io.ReadAll(res.Body)
	if err != nil {
		return "", err
	}
	var answer struct {
		AccessToken string `json:"access_token"`
		ExpiresIn   int    `json:"expires_in"`
	}
	if res.StatusCode != http.StatusOK || json.Unmarshal(resBody, &answer) != nil || answer.AccessToken == "" {
		return "", fmt.Errorf("firestore: token exchange returned %s: %.200s", res.Status, resBody)
	}
	a.cached, a.expires = answer.AccessToken, now.Add(time.Duration(answer.ExpiresIn)*time.Second)
	return a.cached, nil
}
