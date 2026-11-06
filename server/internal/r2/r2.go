// Package r2 talks to Cloudflare R2 through its S3 API, with requests signed by
// header-based SigV4 (https://docs.aws.amazon.com/AmazonS3/latest/API/sig-v4-header-based-auth.html).
package r2

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/md5"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/xml"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"slices"
	"strings"
	"time"
)

var httpClient = &http.Client{Timeout: 30 * time.Second}

// Client is one bucket. Endpoint is the account's S3 URL, https://<account id>.r2.cloudflarestorage.com.
type Client struct {
	Endpoint, Bucket, AccessKeyID, SecretAccessKey string
}

// Object is one key from a listing.
type Object struct {
	Key          string
	LastModified time.Time
}

// Put stores body at key, replacing any object already there.
func (c Client) Put(ctx context.Context, key string, body []byte, contentType, cacheControl string) error {
	header := http.Header{"Content-Type": {contentType}, "Cache-Control": {cacheControl}}
	_, err := c.do(ctx, http.MethodPut, "/"+key, nil, header, body)
	return err
}

// List returns one page of up to 1,000 keys under prefix, and the token for the next page, which is empty on the last one.
func (c Client) List(ctx context.Context, prefix, continuationToken string) ([]Object, string, error) {
	query := url.Values{"list-type": {"2"}, "prefix": {prefix}}
	if continuationToken != "" {
		query.Set("continuation-token", continuationToken)
	}
	res, err := c.do(ctx, http.MethodGet, "", query, nil, nil)
	if err != nil {
		return nil, "", err
	}
	var page struct {
		Contents              []Object
		IsTruncated           bool
		NextContinuationToken string
	}
	if err := xml.Unmarshal(res, &page); err != nil {
		return nil, "", err
	}
	if !page.IsTruncated {
		page.NextContinuationToken = ""
	}
	return page.Contents, page.NextContinuationToken, nil
}

// Delete removes up to 1,000 keys in one DeleteObjects request. It fails if any key wasn't deleted.
func (c Client) Delete(ctx context.Context, keys []string) error {
	type object struct{ Key string }
	objects := make([]object, len(keys))
	for i, key := range keys {
		objects[i] = object{key}
	}
	body, err := xml.Marshal(struct {
		XMLName xml.Name `xml:"Delete"`
		Quiet   bool
		Object  []object
	}{Quiet: true, Object: objects})
	if err != nil {
		return err
	}
	sum := md5.Sum(body)
	header := http.Header{"Content-Md5": {base64.StdEncoding.EncodeToString(sum[:])}, "Content-Type": {"application/xml"}}
	res, err := c.do(ctx, http.MethodPost, "", url.Values{"delete": {""}}, header, body)
	if err != nil {
		return err
	}
	// Quiet mode lists only the keys that failed, and the request itself still answers 200.
	var result struct {
		Error []struct{ Key, Code string }
	}
	if err := xml.Unmarshal(res, &result); err != nil {
		return err
	}
	if len(result.Error) > 0 {
		return fmt.Errorf("r2: %d keys not deleted, first %s: %s", len(result.Error), result.Error[0].Key, result.Error[0].Code)
	}
	return nil
}

// do sends a signed request for path within the bucket and returns the body of a 2xx answer.
// shortcut: the path is sent as Go escapes it, which matches SigV4 only for keys of [A-Za-z0-9/._-];
// fine while the server picks every key, upgrade to per-segment SigV4 escaping if keys ever come from users.
func (c Client) do(ctx context.Context, method, path string, query url.Values, header http.Header, body []byte) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, method, c.Endpoint+"/"+c.Bucket+path, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.URL.RawQuery = strings.ReplaceAll(query.Encode(), "+", "%20")
	for name, values := range header {
		req.Header[name] = values
	}
	sign(req, hexSHA256(body), c.AccessKeyID, c.SecretAccessKey, "auto", time.Now())

	res, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	resBody, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}
	if res.StatusCode/100 != 2 {
		return nil, fmt.Errorf("r2 %s %s returned %s: %.200s", method, path, res.Status, resBody)
	}
	return resBody, nil
}

// sign adds the SigV4 Authorization header, signing host and every header already on the request.
func sign(req *http.Request, payloadHash, accessKeyID, secret, region string, now time.Time) {
	amzDate := now.UTC().Format("20060102T150405Z")
	date := amzDate[:8]
	req.Header.Set("X-Amz-Date", amzDate)
	req.Header.Set("X-Amz-Content-Sha256", payloadHash)

	names := []string{"host"}
	for name := range req.Header {
		names = append(names, strings.ToLower(name))
	}
	slices.Sort(names)
	var headers strings.Builder
	for _, name := range names {
		value := req.Host
		if name != "host" {
			value = strings.Join(req.Header.Values(name), ",")
		}
		fmt.Fprintf(&headers, "%s:%s\n", name, strings.TrimSpace(value))
	}
	signedHeaders := strings.Join(names, ";")

	canonical := strings.Join([]string{req.Method, req.URL.EscapedPath(), req.URL.RawQuery, headers.String(), signedHeaders, payloadHash}, "\n")
	scope := date + "/" + region + "/s3/aws4_request"
	stringToSign := "AWS4-HMAC-SHA256\n" + amzDate + "\n" + scope + "\n" + hexSHA256([]byte(canonical))

	key := []byte("AWS4" + secret)
	for _, part := range []string{date, region, "s3", "aws4_request"} {
		key = hmacSHA256(key, part)
	}
	req.Header.Set("Authorization", fmt.Sprintf("AWS4-HMAC-SHA256 Credential=%s/%s,SignedHeaders=%s,Signature=%x",
		accessKeyID, scope, signedHeaders, hmacSHA256(key, stringToSign)))
}

func hmacSHA256(key []byte, data string) []byte {
	mac := hmac.New(sha256.New, key)
	mac.Write([]byte(data))
	return mac.Sum(nil)
}

func hexSHA256(data []byte) string {
	sum := sha256.Sum256(data)
	return hex.EncodeToString(sum[:])
}
