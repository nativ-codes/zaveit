package api

import (
	"crypto/rand"
	"errors"
	"io"
	"log"
	"net/http"
	"time"

	"zaveit/server/internal/r2"
)

const (
	maxThumbnailBytes = 200 << 10
	thumbnailBaseURL  = "https://img.nativ.codes/"
	// Keys are never rewritten, so the picture behind a URL never changes.
	thumbnailCacheControl = "public, max-age=31536000, immutable"
	uploadsPerMinute      = 120
	uploadsPerDay         = 2_000
)

// uploadThumbnail stores a WebP under the signed-in user's prefix and returns its public URL. Wrap it in requireUser.
func uploadThumbnail(store r2.Client) http.HandlerFunc {
	perMinute := newRateLimiter(uploadsPerMinute, time.Minute)
	// shortcut: 100k distinct uploaders in a day reset every daily count early (rateLimitMaxClients),
	// fine at today's user count, give the limiter its own bound or eviction if that ever gets close.
	perDay := newRateLimiter(uploadsPerDay, 24*time.Hour)

	return func(w http.ResponseWriter, r *http.Request) {
		uid := userID(r)
		now := time.Now()
		if !perMinute.allow(uid, now) || !perDay.allow(uid, now) {
			writeError(w, http.StatusTooManyRequests, "too many requests")
			return
		}
		if r.Header.Get("Content-Type") != "image/webp" {
			writeError(w, http.StatusUnsupportedMediaType, "thumbnail must be image/webp")
			return
		}
		body, err := io.ReadAll(http.MaxBytesReader(w, r.Body, maxThumbnailBytes))
		if err != nil {
			if maxErr := new(http.MaxBytesError); errors.As(err, &maxErr) {
				writeError(w, http.StatusRequestEntityTooLarge, "thumbnail is too large")
			} else {
				writeError(w, http.StatusBadRequest, "could not read body")
			}
			return
		}
		if http.DetectContentType(body) != "image/webp" {
			writeError(w, http.StatusUnsupportedMediaType, "thumbnail must be image/webp")
			return
		}

		key := "zaveit/" + uid + "/" + rand.Text() + ".webp"
		if err := store.Put(r.Context(), key, body, "image/webp", thumbnailCacheControl); err != nil {
			log.Printf("thumbnail upload failed: %v", err)
			writeError(w, http.StatusBadGateway, "could not store thumbnail")
			return
		}
		writeJSON(w, http.StatusCreated, map[string]string{"url": thumbnailBaseURL + key})
	}
}
