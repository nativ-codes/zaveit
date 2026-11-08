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
	thumbnailBaseURL  = "https://img.zaveit.app/"
	// Keys are never rewritten, so the picture behind a URL never changes.
	thumbnailCacheControl = "public, max-age=31536000, immutable"
	uploadsPerMinute      = 30
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

// deleteThumbnails deletes every Thumbnail under the signed-in user's prefix, one listing page at a time,
// before their account is deleted. It fails as a whole if any page fails. Wrap it in requireUser.
func deleteThumbnails(store r2.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		prefix := "zaveit/" + userID(r) + "/"
		token := ""
		for {
			objects, next, err := store.List(r.Context(), prefix, token)
			if err == nil && len(objects) > 0 {
				keys := make([]string, len(objects))
				for i, object := range objects {
					keys[i] = object.Key
				}
				err = store.Delete(r.Context(), keys)
			}
			if err != nil {
				log.Printf("thumbnail delete failed: %v", err)
				writeError(w, http.StatusBadGateway, "could not delete thumbnails")
				return
			}
			if next == "" {
				break
			}
			token = next
		}
		w.WriteHeader(http.StatusNoContent)
	}
}
