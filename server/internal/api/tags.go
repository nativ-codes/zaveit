package api

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"zaveit/server/internal/deepseek"
	"zaveit/server/internal/tags"
)

const maxBodyBytes = 16 << 10

func suggestTags(ai deepseek.Client, logDetails bool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Title string `json:"title"`
		}
		err := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxBodyBytes)).Decode(&body)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid body")
			return
		}

		title := strings.TrimSpace(body.Title)
		if title == "" {
			writeError(w, http.StatusBadRequest, "title is required")
			return
		}

		suggested, err := tags.Suggest(r.Context(), ai, title)
		if err != nil {
			log.Printf("suggest tags: %v", err)
			writeError(w, http.StatusBadGateway, "could not suggest tags")
			return
		}

		// Titles reveal what a user saved, so this stays off outside local testing.
		if logDetails {
			log.Printf("tags: title=%.*q tags=%v", tags.MaxTitleLen, title, suggested)
		}

		writeJSON(w, http.StatusOK, map[string][]string{"tags": suggested})
	}
}
