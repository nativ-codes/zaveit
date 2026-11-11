// Package sources checks that saved links still give a title and a picture. Its
// platform rules mirror mobile/screens/share-intent/share-intent.platforms.ts,
// and TestPlatformRulesMatchTheApp fails when the two differ.
package sources

import (
	"context"
	_ "embed"
	"encoding/json"
	"errors"
	"fmt"
	"html"
	"io"
	"net"
	"net/http"
	"net/netip"
	"net/url"
	"regexp"
	"strings"
	"sync"
	"syscall"
	"time"
)

const (
	StatusOK      = "ok"
	StatusBlocked = "blocked" // the site refused this server, which says nothing about phones
	StatusFailed  = "failed"

	linkTimeout   = 15 * time.Second
	maxConcurrent = 5
	maxPageBytes  = 4 << 20
	userAgent     = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
	// Same as the app's fetchPage on iOS, for checking the phone's own page fetch.
	phoneUserAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
)

//go:embed links.txt
var linksFile string

var (
	httpClient = &http.Client{Timeout: 8 * time.Second, Transport: publicTransport()}
	retryDelay = 1500 * time.Millisecond
	errBlocked = errors.New("blocked")

	// ErrInvalidLink means the link is not one Metadata will fetch.
	ErrInvalidLink = errors.New("invalid link")

	sharedAddressSpace = netip.MustParsePrefix("100.64.0.0/10")

	tiktokVideoID = regexp.MustCompile(`/(?:video|photo)/(\d+)`)
	tiktokState   = regexp.MustCompile(`(?s)<script[^>]*id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)</script>`)
	metaTag       = regexp.MustCompile(`(?is)<meta\s[^>]*>`)
	metaName      = regexp.MustCompile(`(?i)\s(?:property|name)\s*=\s*["']([^"']+)["']`)
	metaContent   = regexp.MustCompile(`(?is)\scontent\s*=\s*(?:"([^"]*)"|'([^']*)')`)
	pageTitle     = regexp.MustCompile(`(?is)<title[^>]*>(.*?)</title>`)
	redditHost    = regexp.MustCompile(`(?i)^https?://(?:[^/]+\.)?reddit\.com`)
)

type platform struct {
	domains  []string
	oembed   string
	resolve  bool
	tiktok   bool
	rewrites func(string) string
	// titleOnly skips the picture check, for sites that give no usable picture.
	titleOnly bool
}

var platforms = []platform{
	{domains: []string{"tiktok.com"}, oembed: "https://www.tiktok.com/oembed", resolve: true, tiktok: true},
	{
		domains: []string{"reddit.com", "redd.it"},
		oembed:  "https://www.reddit.com/oembed",
		resolve: true,
		rewrites: func(link string) string {
			return redditHost.ReplaceAllString(link, "https://www.reddit.com")
		},
		titleOnly: true,
	},
	{domains: []string{"youtube.com", "youtu.be"}, oembed: "https://www.youtube.com/oembed"},
	{domains: []string{"facebook.com", "fb.watch"}, titleOnly: true},
}

type Result struct {
	URL     string `json:"url"`
	Status  string `json:"status"`
	Source  string `json:"source,omitempty"`
	Title   string `json:"title,omitempty"`
	Picture string `json:"picture,omitempty"`
	Error   string `json:"error,omitempty"`
	MS      int64  `json:"ms"`
}

type Report struct {
	Status string   `json:"status"`
	Links  []Result `json:"links"`
}

type metadata struct {
	title, picture string
}

// Links returns the URLs in links.txt.
func Links() []string {
	var links []string
	for _, line := range strings.Split(linksFile, "\n") {
		line = strings.TrimSpace(line)
		if line != "" && !strings.HasPrefix(line, "#") {
			links = append(links, line)
		}
	}
	return links
}

// publicTransport refuses private addresses at connect time, so a user's link
// can't reach this server's network through a redirect or a DNS answer either.
func publicTransport() *http.Transport {
	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.Proxy = nil
	transport.DialContext = (&net.Dialer{Timeout: 5 * time.Second, Control: publicOnly}).DialContext
	return transport
}

func publicOnly(_, address string, _ syscall.RawConn) error {
	parsed, err := netip.ParseAddrPort(address)
	if err != nil {
		return err
	}
	ip := parsed.Addr().Unmap()
	if !ip.IsGlobalUnicast() || ip.IsPrivate() || sharedAddressSpace.Contains(ip) {
		return fmt.Errorf("address %s is not public", ip)
	}
	return nil
}

// Metadata returns the title and picture for a link a user is saving.
func Metadata(ctx context.Context, link string) (title, picture string, err error) {
	parsed, err := url.Parse(link)
	if err != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") || parsed.Hostname() == "" {
		return "", "", ErrInvalidLink
	}

	ctx, cancel := context.WithTimeout(ctx, linkTimeout)
	defer cancel()

	meta, _, err := extract(ctx, link)
	return meta.title, meta.picture, err
}

// Check tries every link and reports the worst status as the overall one.
func Check(ctx context.Context, links []string) Report {
	report := Report{Status: StatusOK, Links: make([]Result, len(links))}
	slots := make(chan struct{}, maxConcurrent)

	var wg sync.WaitGroup
	for i, link := range links {
		wg.Add(1)
		go func() {
			defer wg.Done()
			slots <- struct{}{}
			defer func() { <-slots }()
			report.Links[i] = checkLink(ctx, link)
		}()
	}
	wg.Wait()

	for _, result := range report.Links {
		if result.Status == StatusFailed {
			report.Status = StatusFailed
			break
		}
		if result.Status == StatusBlocked {
			report.Status = StatusBlocked
		}
	}
	return report
}

func checkLink(ctx context.Context, link string) Result {
	ctx, cancel := context.WithTimeout(ctx, linkTimeout)
	defer cancel()
	start := time.Now()

	meta, source, err := extract(ctx, link)
	p := findPlatform(link)
	if p == nil || p.oembed == "" {
		meta, source, err = phoneFallback(ctx, link, meta, source, err)
	}
	if err == nil {
		if meta.title == "" {
			err = errors.New("no title")
		} else if p != nil && p.titleOnly {
			// the title is all this site promises
		} else if meta.picture == "" {
			err = errors.New("no picture")
		} else {
			err = checkPicture(ctx, meta.picture)
		}
	}

	result := Result{
		URL:     link,
		Status:  StatusOK,
		Source:  source,
		Title:   meta.title,
		Picture: meta.picture,
		MS:      time.Since(start).Milliseconds(),
	}
	if err != nil {
		result.Status = StatusFailed
		if errors.Is(err, errBlocked) {
			result.Status = StatusBlocked
		}
		result.Error = strings.ReplaceAll(err.Error(), "\n", "; ")
	}
	return result
}

type userAgentKey struct{}

// phoneFallback mirrors the app's getMetadata: when the server answer has no
// picture, the phone fetches the page itself and its title wins.
func phoneFallback(ctx context.Context, link string, meta metadata, source string, err error) (metadata, string, error) {
	if err == nil && meta.picture != "" {
		return meta, source, nil
	}

	phone, phoneErr := pageTags(context.WithValue(ctx, userAgentKey{}, phoneUserAgent), link)
	if phoneErr != nil || (phone.title == "" && phone.picture == "") {
		if err == nil {
			return meta, source, nil // the caller reports the missing picture
		}
		return meta, source, errors.Join(err, sourceError("phone_page", phoneErr))
	}

	if phone.title != "" {
		meta.title = phone.title
	}
	if meta.picture == "" {
		meta.picture = phone.picture
	}
	if meta.title == "" {
		return meta, source, errors.Join(err, errors.New("phone_page: no title"))
	}
	return meta, "phone_page", nil
}

// extract returns the first source's answer, as the app does. A source that
// gives a title without a picture still wins, because the app stops there too.
func extract(ctx context.Context, link string) (metadata, string, error) {
	var errs []error

	if p := findPlatform(link); p != nil {
		target := link
		if p.resolve {
			target = resolve(ctx, link)
		}
		if p.rewrites != nil {
			target = p.rewrites(target)
		}

		if p.tiktok {
			meta, err := tiktokPage(ctx, target)
			if err == nil && (meta.title != "" || meta.picture != "") {
				return meta, "tiktok_page", nil
			}
			errs = append(errs, sourceError("tiktok_page", err))
		}

		if p.oembed != "" {
			meta, err := oembed(ctx, p.oembed, target)
			if err == nil && meta.title != "" {
				return meta, "oembed", nil
			}
			errs = append(errs, sourceError("oembed", err))
		}
	}

	meta, err := pageTags(ctx, link)
	if err == nil && meta.title != "" {
		return meta, "page", nil
	}
	errs = append(errs, sourceError("page", err))
	return metadata{}, "", errors.Join(errs...)
}

func sourceError(source string, err error) error {
	if err == nil {
		return fmt.Errorf("%s: empty result", source)
	}
	return fmt.Errorf("%s: %w", source, err)
}

func findPlatform(link string) *platform {
	parsed, err := url.Parse(link)
	if err != nil {
		return nil
	}
	host := strings.ToLower(parsed.Hostname())

	for i := range platforms {
		for _, domain := range platforms[i].domains {
			if host == domain || strings.HasSuffix(host, "."+domain) {
				return &platforms[i]
			}
		}
	}
	return nil
}

// request retries once on 429, because TikTok rate limits short bursts at random
// and that alone would fail a healthy link.
func request(ctx context.Context, method, target string) (*http.Response, error) {
	for attempt := 0; ; attempt++ {
		req, err := http.NewRequestWithContext(ctx, method, target, nil)
		if err != nil {
			return nil, err
		}
		agent, ok := ctx.Value(userAgentKey{}).(string)
		if !ok {
			agent = userAgent
		}
		req.Header.Set("User-Agent", agent)

		res, err := httpClient.Do(req)
		if err != nil || res.StatusCode != http.StatusTooManyRequests || attempt == 1 {
			return res, err
		}
		res.Body.Close()

		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-time.After(retryDelay):
		}
	}
}

func statusError(res *http.Response) error {
	switch res.StatusCode {
	case http.StatusUnauthorized, http.StatusForbidden, http.StatusTooManyRequests:
		return fmt.Errorf("%w (%s)", errBlocked, res.Status)
	}
	return fmt.Errorf("got %s", res.Status)
}

func getBody(ctx context.Context, target string) ([]byte, error) {
	res, err := request(ctx, http.MethodGet, target)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return nil, statusError(res)
	}
	return io.ReadAll(io.LimitReader(res.Body, maxPageBytes))
}

func resolve(ctx context.Context, link string) string {
	res, err := request(ctx, http.MethodHead, link)
	if err != nil {
		return link
	}
	defer res.Body.Close()
	return res.Request.URL.String()
}

func oembed(ctx context.Context, endpoint, link string) (metadata, error) {
	body, err := getBody(ctx, endpoint+"?format=json&url="+url.QueryEscape(link))
	if err != nil {
		return metadata{}, err
	}

	var data struct {
		Title        string `json:"title"`
		ThumbnailURL string `json:"thumbnail_url"`
	}
	if err := json.Unmarshal(body, &data); err != nil {
		return metadata{}, err
	}
	return metadata{data.Title, data.ThumbnailURL}, nil
}

// pageTags reads the page's own Open Graph tags, for sites with no dedicated source.
func pageTags(ctx context.Context, link string) (metadata, error) {
	body, err := getBody(ctx, link)
	if err != nil {
		return metadata{}, err
	}

	tags := map[string]string{}
	for _, tag := range metaTag.FindAllString(string(body), -1) {
		name, content := metaName.FindStringSubmatch(tag), metaContent.FindStringSubmatch(tag)
		if name != nil && content != nil && tags[strings.ToLower(name[1])] == "" {
			tags[strings.ToLower(name[1])] = html.UnescapeString(content[1] + content[2])
		}
	}

	meta := metadata{title: strings.TrimSpace(tags["og:title"]), picture: tags["og:image"]}
	if meta.title == "" {
		if title := pageTitle.FindSubmatch(body); title != nil {
			meta.title = strings.TrimSpace(html.UnescapeString(string(title[1])))
		}
	}
	if meta.picture == "" {
		meta.picture = tags["twitter:image"]
	}
	if base, err := url.Parse(link); err == nil && meta.picture != "" {
		if absolute, err := base.Parse(meta.picture); err == nil {
			meta.picture = absolute.String()
		}
	}
	return meta, nil
}

// tiktokPage reads the video page's rehydration data. The embed page and oEmbed
// stopped carrying the cover in Nov 2026. Photo posts only carry it under /video/,
// and the page answers without the username.
func tiktokPage(ctx context.Context, link string) (metadata, error) {
	id := tiktokVideoID.FindStringSubmatch(link)
	if id == nil {
		return metadata{}, errors.New("no video id in url")
	}

	body, err := getBody(ctx, "https://www.tiktok.com/@/video/"+id[1])
	if err != nil {
		return metadata{}, err
	}

	script := tiktokState.FindSubmatch(body)
	if script == nil {
		return metadata{}, errors.New("state script missing")
	}

	var state struct {
		Scope struct {
			Detail struct {
				ItemInfo struct {
					ItemStruct struct {
						Desc  string `json:"desc"`
						Video struct {
							Cover string `json:"cover"`
						} `json:"video"`
					} `json:"itemStruct"`
				} `json:"itemInfo"`
			} `json:"webapp.video-detail"`
		} `json:"__DEFAULT_SCOPE__"`
	}
	if err := json.Unmarshal(script[1], &state); err != nil {
		return metadata{}, err
	}

	item := state.Scope.Detail.ItemInfo.ItemStruct
	return metadata{title: strings.TrimSpace(item.Desc), picture: item.Video.Cover}, nil
}

func checkPicture(ctx context.Context, picture string) error {
	if strings.HasPrefix(picture, "http://") {
		picture = "https://" + strings.TrimPrefix(picture, "http://") // same as the app's forceHttps
	}

	res, err := request(ctx, http.MethodGet, picture)
	if err != nil {
		return fmt.Errorf("picture: %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return fmt.Errorf("picture: %w", statusError(res))
	}
	if contentType := res.Header.Get("Content-Type"); !strings.HasPrefix(contentType, "image/") {
		return fmt.Errorf("picture: got content type %q", contentType)
	}
	return nil
}
