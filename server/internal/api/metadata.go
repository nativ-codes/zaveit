package api

import (
	"errors"
	"net/http"

	"zaveit/server/internal/sources"
)

// getMetadata never logs the link or the error, which quotes it: links reveal what a user saved.
// shortcut: unauthenticated like /tags, see docs/adr/0001-tags-endpoint-auth-roadmap.md before exposing it publicly.
func getMetadata(w http.ResponseWriter, r *http.Request) {
	title, picture, err := sources.Metadata(r.Context(), r.URL.Query().Get("url"))
	if errors.Is(err, sources.ErrInvalidLink) {
		writeError(w, http.StatusBadRequest, "invalid url")
		return
	}
	if err != nil {
		writeError(w, http.StatusBadGateway, "could not read link")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"title": title, "thumbnail": picture})
}
