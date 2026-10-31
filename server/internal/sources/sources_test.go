package sources

import (
	"context"
	"errors"
	"io"
	"net/http"
	"strings"
	"testing"
)

type fakeTransport map[string]*fakeResponse

type fakeResponse struct {
	status      int
	body        string
	contentType string
}

// RoundTrip answers by URL prefix, longest match wins so hosts can have specific paths.
func (f fakeTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	var match *fakeResponse
	longest := 0
	for prefix, response := range f {
		if strings.HasPrefix(req.URL.String(), prefix) && len(prefix) > longest {
			match, longest = response, len(prefix)
		}
	}
	if match == nil {
		match = &fakeResponse{status: http.StatusNotFound}
	}
	return &http.Response{
		StatusCode: match.status,
		Status:     http.StatusText(match.status),
		Header:     http.Header{"Content-Type": {match.contentType}},
		Body:       io.NopCloser(strings.NewReader(match.body)),
		Request:    req,
	}, nil
}

func useFake(t *testing.T, fake fakeTransport) {
	t.Helper()
	original := httpClient
	httpClient = &http.Client{Transport: fake}
	t.Cleanup(func() { httpClient = original })
}

const page = `<html><head><title>Fallback</title>
<meta content="Article &amp; more" property="og:title">
<meta property="og:image" content="/x.jpg"></head></html>`

var picture = &fakeResponse{status: 200, contentType: "image/jpeg"}

func check(link string) Result {
	return Check(context.Background(), []string{link}).Links[0]
}

func TestYouTubeOEmbed(t *testing.T) {
	useFake(t, fakeTransport{
		"https://www.youtube.com/oembed": {status: 200, body: `{"title":"Song","thumbnail_url":"https://img.test/a.jpg"}`},
		"https://img.test/":              picture,
	})

	got := check("https://music.youtube.com/watch?v=1")
	if got.Status != StatusOK || got.Source != "oembed" || got.Title != "Song" {
		t.Errorf("got %+v", got)
	}
}

func TestTikTokEmbedPage(t *testing.T) {
	state := `{"source":{"data":{"/embed/v2/1":{"videoData":{"itemInfos":{"text":" Clip ","covers":["https://img.test/c.jpg"]}}}}}}`
	useFake(t, fakeTransport{
		"https://www.tiktok.com/embed/v2/1": {status: 200, body: `<script id="__FRONTITY_CONNECT_STATE__" type="application/json">` + state + `</script>`},
		"https://img.test/":                 picture,
	})

	got := check("https://www.tiktok.com/@a/video/1")
	if got.Status != StatusOK || got.Source != "tiktok_embed" || got.Title != "Clip" {
		t.Errorf("got %+v", got)
	}
}

func TestTikTokFallsBackWhenEmbedPageChanges(t *testing.T) {
	useFake(t, fakeTransport{
		"https://www.tiktok.com/embed/v2/1": {status: 200, body: `<html>new layout</html>`},
		"https://www.tiktok.com/oembed":     {status: 200, body: `{"title":"Clip","thumbnail_url":"https://img.test/c.jpg"}`},
		"https://img.test/":                 picture,
	})

	got := check("https://www.tiktok.com/@a/video/1")
	if got.Status != StatusOK || got.Source != "oembed" {
		t.Errorf("got %+v", got)
	}
}

func TestRedditHostIsRewritten(t *testing.T) {
	useFake(t, fakeTransport{
		"https://www.reddit.com/oembed?format=json&url=https%3A%2F%2Fwww.reddit.com%2Fr%2Fa": {status: 200, body: `{"title":"Post","thumbnail_url":"https://img.test/r.jpg"}`},
		"https://img.test/": picture,
	})

	if got := check("https://old.reddit.com/r/a"); got.Status != StatusOK {
		t.Errorf("got %+v", got)
	}
}

func TestGenericFallback(t *testing.T) {
	useFake(t, fakeTransport{
		"https://example.com/article": {status: 200, body: page},
		"https://example.com/x.jpg":   picture,
	})

	got := check("https://example.com/article")
	if got.Status != StatusOK || got.Source != "page" || got.Title != "Article & more" {
		t.Errorf("got %+v", got)
	}
}

func TestGenericFallbackUsesTitleTagAndTwitterImage(t *testing.T) {
	useFake(t, fakeTransport{
		"https://example.com/a": {status: 200, body: `<title> Plain </title><meta name="twitter:image" content='https://img.test/t.jpg'>`},
		"https://img.test/":     picture,
	})

	if got := check("https://example.com/a"); got.Status != StatusOK || got.Title != "Plain" {
		t.Errorf("got %+v", got)
	}
}

func TestMissingPictureFails(t *testing.T) {
	useFake(t, fakeTransport{
		"https://www.youtube.com/oembed": {status: 200, body: `{"title":"Song"}`},
	})

	got := check("https://youtu.be/1")
	if got.Status != StatusFailed || got.Error != "no picture" {
		t.Errorf("got %+v", got)
	}
}

func TestTitleOnlySitesSkipThePicture(t *testing.T) {
	useFake(t, fakeTransport{
		"https://www.reddit.com/oembed": {status: 200, body: `{"title":"Post"}`},
		"https://www.facebook.com/":     {status: 200, body: page},
	})

	for _, link := range []string{"https://www.reddit.com/r/a", "https://www.facebook.com/a/posts/1"} {
		if got := check(link); got.Status != StatusOK {
			t.Errorf("%s: got %+v", link, got)
		}
	}
}

func TestTitleOnlySitesStillNeedATitle(t *testing.T) {
	useFake(t, fakeTransport{"https://www.facebook.com/": {status: 200, body: `<html></html>`}})

	if got := check("https://www.facebook.com/a/posts/1"); got.Status != StatusFailed {
		t.Errorf("got %+v", got)
	}
}

func TestDeadPictureFails(t *testing.T) {
	useFake(t, fakeTransport{
		"https://example.com/":      {status: 200, body: page},
		"https://example.com/x.jpg": {status: 200, contentType: "text/html"},
	})

	if got := check("https://example.com/"); got.Status != StatusFailed {
		t.Errorf("got %+v", got)
	}
}

func TestBlockedIsNotFailed(t *testing.T) {
	useFake(t, fakeTransport{
		"https://www.reddit.com/": {status: 403},
	})

	got := Check(context.Background(), []string{"https://www.reddit.com/r/a"})
	if got.Status != StatusBlocked || got.Links[0].Status != StatusBlocked {
		t.Errorf("got %+v", got)
	}
}

func TestFailedOutranksBlocked(t *testing.T) {
	useFake(t, fakeTransport{
		"https://www.reddit.com/": {status: 403},
		"https://youtu.be/":       {status: 500},
	})

	links := []string{"https://www.reddit.com/r/a", "https://youtu.be/1", "https://www.reddit.com/r/b"}
	if got := Check(context.Background(), links); got.Status != StatusFailed {
		t.Errorf("got %+v", got)
	}
}

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(req *http.Request) (*http.Response, error) { return f(req) }

func TestRetriesOnceOn429(t *testing.T) {
	original, originalDelay := httpClient, retryDelay
	t.Cleanup(func() { httpClient, retryDelay = original, originalDelay })
	retryDelay = 0

	calls := 0
	httpClient = &http.Client{Transport: roundTripFunc(func(req *http.Request) (*http.Response, error) {
		calls++
		return &http.Response{StatusCode: 429, Status: "429", Body: http.NoBody, Request: req}, nil
	})}

	if _, err := getBody(context.Background(), "https://example.com"); !errors.Is(err, errBlocked) {
		t.Errorf("got %v", err)
	}
	if calls != 2 {
		t.Errorf("got %d calls", calls)
	}
}

func TestMetadata(t *testing.T) {
	useFake(t, fakeTransport{"https://example.com/article": {status: 200, body: page}})

	title, picture, err := Metadata(context.Background(), "https://example.com/article")
	if err != nil || title != "Article & more" || picture != "https://example.com/x.jpg" {
		t.Errorf("got %q %q %v", title, picture, err)
	}
}

func TestMetadataOnlyFetchesWebLinks(t *testing.T) {
	useFake(t, fakeTransport{})

	for _, link := range []string{"", "nope", "file:///etc/passwd", "ftp://example.com", "https://"} {
		if _, _, err := Metadata(context.Background(), link); !errors.Is(err, ErrInvalidLink) {
			t.Errorf("%q: got %v", link, err)
		}
	}
}

func TestPublicOnly(t *testing.T) {
	cases := map[string]bool{
		"93.184.216.34:443":           true,
		"[2606:4700::1111]:443":       true,
		"127.0.0.1:8080":              false,
		"10.0.0.1:80":                 false,
		"192.168.1.1:80":              false,
		"169.254.169.254:80":          false,
		"100.64.0.1:80":               false,
		"0.0.0.0:80":                  false,
		"[::1]:80":                    false,
		"[fd00::1]:80":                false,
		"[fe80::1]:80":                false,
		"[::ffff:127.0.0.1]:80":       false,
		"[::ffff:169.254.169.254]:80": false,
	}
	for address, allowed := range cases {
		if err := publicOnly("tcp", address, nil); (err == nil) != allowed {
			t.Errorf("%s: got %v", address, err)
		}
	}
}

func TestLinksFileIsValid(t *testing.T) {
	links := Links()
	if len(links) == 0 {
		t.Fatal("no links")
	}
	for _, link := range links {
		if !strings.HasPrefix(link, "https://") {
			t.Errorf("bad link %q", link)
		}
	}
}
