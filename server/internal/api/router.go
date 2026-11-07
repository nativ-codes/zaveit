// Package api holds the HTTP routes. Each route has its own file.
package api

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"zaveit/server/internal/deepseek"
	"zaveit/server/internal/firestore"
	"zaveit/server/internal/r2"
)

// VerifyToken returns nil when an App Check token is genuine.
type VerifyToken func(token string) error

// NewRouter is the list of every route the server has.
func NewRouter(ai deepseek.Client, logTagDetails bool, check SourcesCheck, verify VerifyToken, verifyUser VerifyUser, store r2.Client, db *firestore.Client, visitorSecret string) http.Handler {
	limiter := newRateLimiter(rateLimitRequests, rateLimitWindow)
	v1 := func(next http.HandlerFunc) http.HandlerFunc {
		return limitRate(limiter, requireAppCheck(verify, next))
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", health)
	mux.HandleFunc("GET /health/sources", checkSources(check))
	mux.HandleFunc("GET /v1/metadata", v1(getMetadata))
	mux.HandleFunc("POST /v1/tags", v1(suggestTags(ai, logTagDetails)))
	mux.HandleFunc("POST /v1/thumbnails", v1(requireUser(verifyUser, uploadThumbnail(store))))
	mux.HandleFunc("DELETE /v1/thumbnails", v1(requireUser(verifyUser, deleteThumbnails(store))))
	mux.HandleFunc("GET /v1/username/{username}", v1(requireUser(verifyUser, checkUsername(db))))
	mux.HandleFunc("POST /v1/username", v1(requireUser(verifyUser, claimUsername(db))))
	mux.HandleFunc("DELETE /v1/username", v1(requireUser(verifyUser, deleteUsername(db))))
	mux.HandleFunc("GET /v1/lists", v1(requireUser(verifyUser, getLists(db))))
	mux.HandleFunc("POST /v1/lists", v1(requireUser(verifyUser, createList(db))))
	mux.HandleFunc("PATCH /v1/lists/{listPath}", v1(requireUser(verifyUser, updateList(db))))
	mux.HandleFunc("DELETE /v1/lists/{listPath}", v1(requireUser(verifyUser, deleteList(db))))
	// Visitor routes: public, so the per-IP limit applies but not App Check.
	unlock := limitRate(limiter, unlockList(db, []byte(visitorSecret)))
	mux.HandleFunc("POST /v1/published-lists/{username}/{listPath}/unlock", unlock)
	mux.HandleFunc("POST /v1/published-lists/{username}/unlock", unlock) // a bare /{username} link
	mux.HandleFunc("GET /v1/published-lists/{username}/{listPath}", limitRate(limiter, getPublishedList(db, []byte(visitorSecret))))
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

// VerifyUser returns the uid of a genuine Firebase ID token.
type VerifyUser func(token string) (string, error)

type uidKey struct{}

// requireUser only lets signed-in users reach the handler, which reads their uid with userID.
// Wrap it in v1 so App Check and the rate limit still apply.
func requireUser(verify VerifyUser, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token, ok := strings.CutPrefix(r.Header.Get("Authorization"), "Bearer ")
		var uid string
		var err error
		if ok {
			uid, err = verify(token)
		}
		if !ok || err != nil {
			writeError(w, http.StatusUnauthorized, "invalid id token")
			return
		}
		next(w, r.WithContext(context.WithValue(r.Context(), uidKey{}, uid)))
	}
}

func userID(r *http.Request) string {
	uid, _ := r.Context().Value(uidKey{}).(string)
	return uid
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
