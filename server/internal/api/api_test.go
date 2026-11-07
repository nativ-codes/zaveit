package api

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"zaveit/server/internal/deepseek"
	"zaveit/server/internal/r2"
	"zaveit/server/internal/tags"
)

func allowAll(string) error { return nil }

// post runs a request against the router, backed by a fake DeepSeek.
func post(t *testing.T, body string, upstream http.HandlerFunc) *httptest.ResponseRecorder {
	t.Helper()
	fake := httptest.NewServer(upstream)
	defer fake.Close()

	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/v1/tags", strings.NewReader(body))
	NewRouter(deepseek.Client{BaseURL: fake.URL, Model: "m", APIKey: "k"}, false, SourcesCheck{}, allowAll, nil, r2.Client{}, nil, "").ServeHTTP(res, req)
	return res
}

func TestTags(t *testing.T) {
	var sentTitle string
	res := post(t, `{"title":" `+strings.Repeat("é", tags.MaxTitleLen+50)+` "}`, func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Authorization") != "Bearer k" {
			t.Errorf("missing api key")
		}
		var got struct {
			Messages []struct {
				Content string `json:"content"`
			} `json:"messages"`
		}
		json.NewDecoder(r.Body).Decode(&got)
		sentTitle = got.Messages[1].Content
		io.WriteString(w, `{"choices":[{"message":{"content":"Art, music"}}]}`)
	})

	if res.Code != http.StatusOK || strings.TrimSpace(res.Body.String()) != `{"tags":["art","music"]}` {
		t.Fatalf("got %d %s", res.Code, res.Body)
	}
	if res.Header().Get("Content-Type") != "application/json" {
		t.Errorf("got content type %q", res.Header().Get("Content-Type"))
	}
	if sentTitle != strings.Repeat("é", tags.MaxTitleLen) {
		t.Errorf("title was not trimmed and truncated: %d runes", len([]rune(sentTitle)))
	}
}

func TestTagsEmptyModelReply(t *testing.T) {
	res := post(t, `{"title":"x"}`, func(w http.ResponseWriter, _ *http.Request) {
		io.WriteString(w, `{"choices":[]}`)
	})
	if res.Code != http.StatusOK || strings.TrimSpace(res.Body.String()) != `{"tags":[]}` {
		t.Errorf("got %d %s", res.Code, res.Body)
	}
}

func TestTagsRejectsBadInput(t *testing.T) {
	inputs := []string{``, `nope`, `{}`, `{"title":"   "}`, `{"title":"` + strings.Repeat("a", maxBodyBytes) + `"}`}
	for _, input := range inputs {
		res := post(t, input, func(http.ResponseWriter, *http.Request) {
			t.Errorf("DeepSeek must not be called for %.20q", input)
		})
		if res.Code != http.StatusBadRequest {
			t.Errorf("%.20q: got %d", input, res.Code)
		}
	}
}

func TestTagsUpstreamFailure(t *testing.T) {
	res := post(t, `{"title":"x"}`, func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	})
	if res.Code != http.StatusBadGateway {
		t.Errorf("got %d", res.Code)
	}
}

func TestV1RoutesRequireAppCheck(t *testing.T) {
	var sent string
	reject := func(token string) error {
		sent = token
		return errors.New("rejected")
	}
	fake := httptest.NewServer(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		t.Error("DeepSeek must not be called without a valid token")
	}))
	defer fake.Close()
	router := NewRouter(deepseek.Client{BaseURL: fake.URL}, false, SourcesCheck{}, reject, nil, r2.Client{}, nil, "")

	for _, req := range []*http.Request{
		httptest.NewRequest(http.MethodPost, "/v1/tags", strings.NewReader(`{"title":"x"}`)),
		httptest.NewRequest(http.MethodGet, "/v1/metadata?url=https%3A%2F%2Fexample.com", nil),
	} {
		req.Header.Set("X-Firebase-AppCheck", "the-token")
		res := httptest.NewRecorder()
		router.ServeHTTP(res, req)
		if res.Code != http.StatusUnauthorized {
			t.Errorf("%s: got %d", req.URL.Path, res.Code)
		}
		if sent != "the-token" {
			t.Errorf("%s: verified %q", req.URL.Path, sent)
		}
	}
}

func TestRequireUser(t *testing.T) {
	verify := func(token string) (string, error) {
		if token == "good" {
			return "user-1", nil
		}
		return "", errors.New("rejected")
	}
	var reached string
	handler := requireUser(verify, func(_ http.ResponseWriter, r *http.Request) { reached = userID(r) })

	for header, want := range map[string]int{
		"Bearer good": http.StatusOK,
		"Bearer bad":  http.StatusUnauthorized,
		"good":        http.StatusUnauthorized,
		"":            http.StatusUnauthorized,
	} {
		reached = ""
		req := httptest.NewRequest(http.MethodPost, "/v1/x", nil)
		req.Header.Set("Authorization", header)
		res := httptest.NewRecorder()
		handler(res, req)
		if res.Code != want {
			t.Errorf("%q: got %d", header, res.Code)
		}
		if want == http.StatusOK && reached != "user-1" {
			t.Errorf("%q: handler saw uid %q", header, reached)
		}
		if want != http.StatusOK && (reached != "" || strings.Contains(res.Body.String(), "bad")) {
			t.Errorf("%q: got %s, handler saw %q", header, res.Body, reached)
		}
	}
}

func TestHealthNeedsNoAppCheck(t *testing.T) {
	reject := func(string) error { return errors.New("rejected") }
	res := httptest.NewRecorder()
	NewRouter(deepseek.Client{}, false, SourcesCheck{}, reject, nil, r2.Client{}, nil, "").ServeHTTP(res, httptest.NewRequest(http.MethodGet, "/health", nil))
	if res.Code != http.StatusOK {
		t.Errorf("got %d", res.Code)
	}
}

func TestHealth(t *testing.T) {
	res := httptest.NewRecorder()
	NewRouter(deepseek.Client{}, false, SourcesCheck{}, allowAll, nil, r2.Client{}, nil, "").ServeHTTP(res, httptest.NewRequest(http.MethodGet, "/health", nil))
	if res.Code != http.StatusOK {
		t.Errorf("got %d", res.Code)
	}
}

func TestSourcesRejectsBadToken(t *testing.T) {
	for _, check := range []struct{ configured, sent string }{{"", ""}, {"secret", ""}, {"secret", "wrong"}} {
		res := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, "/health/sources?token="+check.sent, nil)
		NewRouter(deepseek.Client{}, false, SourcesCheck{Token: check.configured}, allowAll, nil, r2.Client{}, nil, "").ServeHTTP(res, req)
		if res.Code != http.StatusUnauthorized {
			t.Errorf("%+v: got %d", check, res.Code)
		}
	}
}

func TestMetadataRejectsBadURL(t *testing.T) {
	for _, target := range []string{"/v1/metadata", "/v1/metadata?url=nope", "/v1/metadata?url=file%3A%2F%2F%2Fetc%2Fpasswd"} {
		res := httptest.NewRecorder()
		NewRouter(deepseek.Client{}, false, SourcesCheck{}, allowAll, nil, r2.Client{}, nil, "").ServeHTTP(res, httptest.NewRequest(http.MethodGet, target, nil))
		if res.Code != http.StatusBadRequest {
			t.Errorf("%s: got %d", target, res.Code)
		}
	}
}

func TestTagDetailsLogging(t *testing.T) {
	defer log.SetOutput(log.Writer())

	for _, enabled := range []bool{false, true} {
		var logs bytes.Buffer
		log.SetOutput(&logs)

		fake := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			io.WriteString(w, `{"choices":[{"message":{"content":"art"}}]}`)
		}))
		req := httptest.NewRequest(http.MethodPost, "/v1/tags", strings.NewReader(`{"title":"secret title"}`))
		NewRouter(deepseek.Client{BaseURL: fake.URL}, enabled, SourcesCheck{}, allowAll, nil, r2.Client{}, nil, "").ServeHTTP(httptest.NewRecorder(), req)
		fake.Close()

		if got := strings.Contains(logs.String(), "secret title"); got != enabled {
			t.Errorf("enabled=%v: title logged=%v: %s", enabled, got, logs.String())
		}
	}
}
