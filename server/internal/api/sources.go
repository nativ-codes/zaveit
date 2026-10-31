package api

import (
	"crypto/subtle"
	"net/http"

	"zaveit/server/internal/sources"
)

// SourcesCheck configures GET /health/sources. An empty Token keeps the route locked.
type SourcesCheck struct {
	Token string
}

// Answers 503 on a failed link, so an uptime monitor can alert on the status code.
func checkSources(config SourcesCheck) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := r.URL.Query().Get("token")
		if config.Token == "" || subtle.ConstantTimeCompare([]byte(token), []byte(config.Token)) != 1 {
			writeError(w, http.StatusUnauthorized, "invalid token")
			return
		}

		report := sources.Check(r.Context(), sources.Links())

		status := http.StatusOK
		if report.Status == sources.StatusFailed {
			status = http.StatusServiceUnavailable
		}
		writeJSON(w, status, report)
	}
}
