package api

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"regexp"
	"strings"
	"testing"

	"zaveit/server/internal/deepseek"
	"zaveit/server/internal/r2"
)

var webp = append([]byte("RIFF\x00\x00\x00\x00WEBPVP8 "), make([]byte, 100)...)

type storedObject struct {
	path, contentType, cacheControl string
	body                            []byte
}

// thumbnailRouter accepts the ID token "good" as user-1 and "other" as user-2, backed by a fake R2 that records puts.
func thumbnailRouter(t *testing.T) (http.Handler, *[]storedObject) {
	t.Helper()
	var stored []storedObject
	fake := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		if r.Method != http.MethodPut || !strings.HasPrefix(r.Header.Get("Authorization"), "AWS4-HMAC-SHA256 ") {
			http.Error(w, "unexpected request", http.StatusBadRequest)
			return
		}
		stored = append(stored, storedObject{r.URL.Path, r.Header.Get("Content-Type"), r.Header.Get("Cache-Control"), body})
	}))
	t.Cleanup(fake.Close)

	users := map[string]string{"good": "user-1", "other": "user-2"}
	verifyUser := func(token string) (string, error) {
		if uid, ok := users[token]; ok {
			return uid, nil
		}
		return "", errors.New("rejected")
	}
	store := r2.Client{Endpoint: fake.URL, Bucket: "bucket", AccessKeyID: "id", SecretAccessKey: "secret"}
	return NewRouter(deepseek.Client{}, false, SourcesCheck{}, allowAll, verifyUser, store), &stored
}

var uploadCount int

func upload(router http.Handler, token, contentType string, body []byte) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodPost, "/v1/thumbnails", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", contentType)
	// A different address per request keeps the per-IP limiter out of the per-uid tests.
	uploadCount++
	req.RemoteAddr = fmt.Sprintf("10.0.%d.%d:1", uploadCount/256, uploadCount%256)
	res := httptest.NewRecorder()
	router.ServeHTTP(res, req)
	return res
}

func TestUploadThumbnailStoresUnderUID(t *testing.T) {
	router, stored := thumbnailRouter(t)

	res := upload(router, "good", "image/webp", webp)
	var got struct{ URL string }
	json.Unmarshal(res.Body.Bytes(), &got)
	if res.Code != http.StatusCreated || !regexp.MustCompile(`^https://img\.nativ\.codes/zaveit/user-1/[A-Z2-7]{26}\.webp$`).MatchString(got.URL) {
		t.Fatalf("got %d %s", res.Code, res.Body)
	}
	if len(*stored) != 1 {
		t.Fatalf("stored %d objects", len(*stored))
	}
	object := (*stored)[0]
	if object.path != "/bucket/"+strings.TrimPrefix(got.URL, thumbnailBaseURL) || object.contentType != "image/webp" ||
		!strings.Contains(object.cacheControl, "max-age=31536000") || !bytes.Equal(object.body, webp) {
		t.Errorf("stored %+v", object)
	}

	if second := upload(router, "good", "image/webp", webp); strings.Contains(second.Body.String(), got.URL) {
		t.Errorf("two uploads got the same URL %s", got.URL)
	}
}

func TestUploadThumbnailRejects(t *testing.T) {
	router, stored := thumbnailRouter(t)
	for name, test := range map[string]struct {
		token, contentType string
		body               []byte
		want               int
	}{
		"bad id token":      {"bad", "image/webp", webp, http.StatusUnauthorized},
		"too large":         {"good", "image/webp", append(webp, make([]byte, maxThumbnailBytes)...), http.StatusRequestEntityTooLarge},
		"wrong type header": {"good", "image/png", webp, http.StatusUnsupportedMediaType},
		"not webp bytes":    {"good", "image/webp", []byte("<html>not found</html>"), http.StatusUnsupportedMediaType},
	} {
		if res := upload(router, test.token, test.contentType, test.body); res.Code != test.want {
			t.Errorf("%s: got %d %s", name, res.Code, res.Body)
		}
	}
	if len(*stored) != 0 {
		t.Errorf("rejected uploads reached R2: %d", len(*stored))
	}
}

func TestUploadThumbnailNeedsAppCheck(t *testing.T) {
	reject := func(string) error { return errors.New("rejected") }
	verifyUser := func(string) (string, error) { return "user-1", nil }
	router := NewRouter(deepseek.Client{}, false, SourcesCheck{}, reject, verifyUser, r2.Client{})
	if res := upload(router, "good", "image/webp", webp); res.Code != http.StatusUnauthorized {
		t.Errorf("got %d", res.Code)
	}
}

func TestUploadThumbnailPerUIDLimit(t *testing.T) {
	router, _ := thumbnailRouter(t)
	for i := range uploadsPerMinute {
		if res := upload(router, "good", "image/webp", webp); res.Code != http.StatusCreated {
			t.Fatalf("upload %d: got %d", i, res.Code)
		}
	}
	if res := upload(router, "good", "image/webp", webp); res.Code != http.StatusTooManyRequests {
		t.Errorf("over the limit: got %d", res.Code)
	}
	if res := upload(router, "other", "image/webp", webp); res.Code != http.StatusCreated {
		t.Errorf("another user: got %d", res.Code)
	}
}
