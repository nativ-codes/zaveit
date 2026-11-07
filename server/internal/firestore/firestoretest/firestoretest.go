// Package firestoretest is an in-memory fake of the parts of the Firestore REST API the server uses:
// get, runQuery (one collection, an optional EQUAL filter, __name__ order, limit) and commit.
// Fields are kept as their raw typed JSON, so the fake doesn't depend on the client's types.
package firestoretest

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"reflect"
	"slices"
	"strings"
	"sync"
	"testing"
)

// Server holds documents by path relative to the database root, such as "usernames/andrei".
type Server struct {
	URL string

	mu       sync.Mutex
	docs     map[string]map[string]any
	requests int
}

// Requests is how many requests the fake has answered, so tests can compare Firestore costs.
func (s *Server) Requests() int {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.requests
}

// New starts a fake for any project, closed when the test ends.
func New(t *testing.T) *Server {
	t.Helper()
	s := &Server{docs: map[string]map[string]any{}}
	server := httptest.NewServer(http.HandlerFunc(s.serve))
	t.Cleanup(server.Close)
	s.URL = server.URL
	return s
}

// Put stores a document, replacing any at path. Fields are in REST form, such as {"uid": {"stringValue": "u1"}}.
func (s *Server) Put(path string, fields map[string]any) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.docs[path] = fields
}

// Doc returns the document at path, if there is one.
func (s *Server) Doc(path string) (map[string]any, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	fields, ok := s.docs[path]
	return fields, ok
}

func (s *Server) serve(w http.ResponseWriter, r *http.Request) {
	root, rest, ok := strings.Cut(r.URL.Path, "/documents")
	if !ok || !strings.HasPrefix(root, "/v1/projects/") {
		apiError(w, http.StatusNotFound, "NOT_FOUND", "unknown path "+r.URL.Path)
		return
	}
	root = strings.TrimPrefix(root, "/v1/") + "/documents/"
	s.mu.Lock()
	defer s.mu.Unlock()
	s.requests++

	switch {
	case r.Method == http.MethodGet:
		path := strings.TrimPrefix(rest, "/")
		fields, ok := s.docs[path]
		if !ok {
			apiError(w, http.StatusNotFound, "NOT_FOUND", "no document "+path)
			return
		}
		json.NewEncoder(w).Encode(map[string]any{"name": root + path, "fields": fields})
	case r.Method == http.MethodPost && rest == ":commit":
		s.commit(w, r, root)
	case r.Method == http.MethodPost && strings.HasSuffix(rest, ":runQuery"):
		s.runQuery(w, r, root, strings.TrimPrefix(strings.TrimSuffix(rest, ":runQuery"), "/"))
	default:
		apiError(w, http.StatusNotFound, "NOT_FOUND", "unsupported "+r.Method+" "+r.URL.Path)
	}
}

func (s *Server) commit(w http.ResponseWriter, r *http.Request, root string) {
	var body struct {
		Writes []struct {
			Update *struct {
				Name   string         `json:"name"`
				Fields map[string]any `json:"fields"`
			} `json:"update"`
			Delete          string `json:"delete"`
			CurrentDocument *struct {
				Exists *bool `json:"exists"`
			} `json:"currentDocument"`
		} `json:"writes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		apiError(w, http.StatusBadRequest, "INVALID_ARGUMENT", err.Error())
		return
	}
	// Writes apply in order to a copy, which replaces the store only if every precondition holds.
	next := map[string]map[string]any{}
	for path, fields := range s.docs {
		next[path] = fields
	}
	for _, write := range body.Writes {
		name := write.Delete
		if write.Update != nil {
			name = write.Update.Name
		}
		path, ok := strings.CutPrefix(name, root)
		if !ok {
			apiError(w, http.StatusBadRequest, "INVALID_ARGUMENT", "bad document name "+name)
			return
		}
		_, exists := next[path]
		if pre := write.CurrentDocument; pre != nil && pre.Exists != nil && *pre.Exists != exists {
			// The statuses real Firestore gives: Create on an existing document, Update on a missing one.
			if exists {
				apiError(w, http.StatusConflict, "ALREADY_EXISTS", "document already exists: "+name)
			} else {
				apiError(w, http.StatusNotFound, "NOT_FOUND", "no document to update: "+name)
			}
			return
		}
		if write.Update != nil {
			next[path] = write.Update.Fields
		} else {
			delete(next, path)
		}
	}
	s.docs = next
	w.Write([]byte(`{}`))
}

func (s *Server) runQuery(w http.ResponseWriter, r *http.Request, root, parent string) {
	var body struct {
		StructuredQuery struct {
			From  []struct{ CollectionID string } `json:"from"`
			Where *struct {
				FieldFilter struct {
					Field struct{ FieldPath string } `json:"field"`
					Op    string                     `json:"op"`
					Value any                        `json:"value"`
				} `json:"fieldFilter"`
			} `json:"where"`
			OrderBy []struct {
				Field     struct{ FieldPath string } `json:"field"`
				Direction string                     `json:"direction"`
			} `json:"orderBy"`
			Limit int `json:"limit"`
		} `json:"structuredQuery"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		apiError(w, http.StatusBadRequest, "INVALID_ARGUMENT", err.Error())
		return
	}
	q := body.StructuredQuery
	if len(q.From) != 1 || len(q.OrderBy) != 1 || q.OrderBy[0].Field.FieldPath != "__name__" ||
		q.OrderBy[0].Direction != "ASCENDING" || (q.Where != nil && q.Where.FieldFilter.Op != "EQUAL") {
		apiError(w, http.StatusBadRequest, "INVALID_ARGUMENT", "the fake supports one collection, EQUAL and __name__ ASCENDING only")
		return
	}
	prefix := q.From[0].CollectionID + "/"
	if parent != "" {
		prefix = parent + "/" + prefix
	}
	var paths []string
	for path, fields := range s.docs {
		id, ok := strings.CutPrefix(path, prefix)
		if !ok || strings.Contains(id, "/") {
			continue
		}
		if f := q.Where; f != nil && !reflect.DeepEqual(fields[f.FieldFilter.Field.FieldPath], f.FieldFilter.Value) {
			continue
		}
		paths = append(paths, path)
	}
	slices.Sort(paths)
	if q.Limit > 0 && len(paths) > q.Limit {
		paths = paths[:q.Limit]
	}
	// Real Firestore answers an empty result with one entry that has only a readTime.
	results := []map[string]any{}
	for _, path := range paths {
		results = append(results, map[string]any{"document": map[string]any{"name": root + path, "fields": s.docs[path]}})
	}
	if len(results) == 0 {
		results = append(results, map[string]any{"readTime": "2026-11-07T00:00:00Z"})
	}
	json.NewEncoder(w).Encode(results)
}

func apiError(w http.ResponseWriter, code int, status, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	fmt.Fprintf(w, `{"error":{"code":%d,"message":%q,"status":%q}}`, code, message, status)
}
