// Package api holds the HTTP routes. Each route has its own file.
package api

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"zaveit/server/internal/deepseek"
)

// NewRouter is the list of every route the server has.
func NewRouter(ai deepseek.Client, logTagDetails bool) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", health)
	mux.HandleFunc("POST /tags", suggestTags(ai, logTagDetails))
	return logRequests(mux)
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
