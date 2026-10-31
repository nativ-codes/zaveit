package api

import (
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"zaveit/server/internal/deepseek"
)

// limitedRouter rejects every token, so requests under the limit get 401 without any upstream.
func limitedRouter() http.Handler {
	reject := func(string) error { return errors.New("rejected") }
	return NewRouter(deepseek.Client{}, false, SourcesCheck{}, reject)
}

func send(router http.Handler, path, forwardedFor string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodGet, path, nil)
	if forwardedFor != "" {
		req.Header.Set("X-Forwarded-For", forwardedFor)
	}
	res := httptest.NewRecorder()
	router.ServeHTTP(res, req)
	return res
}

func exhaust(t *testing.T, router http.Handler, forwardedFor string) {
	t.Helper()
	for i := range rateLimitRequests {
		if res := send(router, "/v1/metadata", forwardedFor); res.Code != http.StatusUnauthorized {
			t.Fatalf("request %d: got %d", i, res.Code)
		}
	}
}

func TestV1OverLimitGets429(t *testing.T) {
	router := limitedRouter()
	exhaust(t, router, "203.0.113.1")

	res := send(router, "/v1/metadata", "203.0.113.1")
	if res.Code != http.StatusTooManyRequests || strings.TrimSpace(res.Body.String()) != `{"error":"too many requests"}` {
		t.Errorf("got %d %s", res.Code, res.Body)
	}
	if res.Header().Get("Content-Type") != "application/json" {
		t.Errorf("got content type %q", res.Header().Get("Content-Type"))
	}

	// The budget is shared across /v1 routes.
	req := httptest.NewRequest(http.MethodPost, "/v1/tags", strings.NewReader(`{"title":"x"}`))
	req.Header.Set("X-Forwarded-For", "203.0.113.1")
	tags := httptest.NewRecorder()
	router.ServeHTTP(tags, req)
	if tags.Code != http.StatusTooManyRequests {
		t.Errorf("tags: got %d", tags.Code)
	}
}

func TestLimitIsPerClient(t *testing.T) {
	router := limitedRouter()
	exhaust(t, router, "203.0.113.1")
	if res := send(router, "/v1/metadata", "203.0.113.2"); res.Code != http.StatusUnauthorized {
		t.Errorf("got %d", res.Code)
	}
}

func TestClientCannotFakeAddress(t *testing.T) {
	router := limitedRouter()
	exhaust(t, router, "203.0.113.1")
	// A proxy that appends leaves the client's own text on the left; only the last entry counts.
	if res := send(router, "/v1/metadata", "198.51.100.7, 203.0.113.1"); res.Code != http.StatusTooManyRequests {
		t.Errorf("got %d", res.Code)
	}
}

func TestIPv6ClientsShareTheirSlash64(t *testing.T) {
	router := limitedRouter()
	exhaust(t, router, "2001:db8:1:2::1")
	if res := send(router, "/v1/metadata", "2001:db8:1:2::ffff"); res.Code != http.StatusTooManyRequests {
		t.Errorf("got %d", res.Code)
	}
}

func TestDirectRequestsUseTheConnectionAddress(t *testing.T) {
	router := limitedRouter()
	exhaust(t, router, "")
	if res := send(router, "/v1/metadata", ""); res.Code != http.StatusTooManyRequests {
		t.Errorf("got %d", res.Code)
	}
}

func TestHealthIsNotLimited(t *testing.T) {
	router := limitedRouter()
	for i := range rateLimitRequests + 1 {
		if res := send(router, "/health", "203.0.113.1"); res.Code != http.StatusOK {
			t.Fatalf("request %d: got %d", i, res.Code)
		}
	}
}

func TestLimitResetsAfterTheWindow(t *testing.T) {
	limiter := newRateLimiter()
	start := time.Now()
	for range rateLimitRequests {
		limiter.allow("a", start)
	}
	if limiter.allow("a", start) {
		t.Error("over the limit but allowed")
	}
	if !limiter.allow("a", start.Add(rateLimitWindow)) {
		t.Error("still limited in the next window")
	}
}

func TestLimiterMemoryIsBounded(t *testing.T) {
	limiter := newRateLimiter()
	start := time.Now()
	for i := range rateLimitMaxClients * 2 {
		limiter.allow(fmt.Sprint(i), start)
	}
	if len(limiter.counts) > rateLimitMaxClients {
		t.Errorf("tracking %d clients", len(limiter.counts))
	}
}
