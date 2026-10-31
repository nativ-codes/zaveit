// Package api holds the HTTP routes. Each route has its own file.
package api

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"zaveit/server/internal/deepseek"
)

// VerifyToken returns nil when an App Check token is genuine.
type VerifyToken func(token string) error

// NewRouter is the list of every route the server has.
// shortcut: no per-IP rate limit yet, ADR 0001 stage 2 needs one before exposing /v1 publicly.
func NewRouter(ai deepseek.Client, logTagDetails bool, check SourcesCheck, verify VerifyToken) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", health)
	mux.HandleFunc("GET /health/sources", checkSources(check))
	mux.HandleFunc("GET /v1/metadata", requireAppCheck(verify, getMetadata))
	mux.HandleFunc("POST /v1/tags", requireAppCheck(verify, suggestTags(ai, logTagDetails)))
	return logRequests(mux)
}

// requireAppCheck only lets requests from the real app reach the handler.
func requireAppCheck(verify VerifyToken, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if verify(r.Header.Get("X-Firebase-AppCheck")) != nil {
			writeError(w, http.StatusUnauthorized, "invalid app check token")
			return
		}
		next(w, r)
	}
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(body)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(status int) {
	r.status = status
	r.ResponseWriter.WriteHeader(status)
}

func logRequests(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		recorder := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(recorder, r)
		log.Printf("%d %s %s %s", recorder.status, r.Method, r.URL.Path, time.Since(start).Round(time.Millisecond))
	})
}
