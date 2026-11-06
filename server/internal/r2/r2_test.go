package r2

import (
	"context"
	"crypto/md5"
	"encoding/base64"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

const emptyHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"

// The GET Object example from https://docs.aws.amazon.com/AmazonS3/latest/API/sig-v4-header-based-auth.html.
func TestSignMatchesAWSExample(t *testing.T) {
	req, _ := http.NewRequest(http.MethodGet, "https://examplebucket.s3.amazonaws.com/test.txt", nil)
	req.Header.Set("Range", "bytes=0-9")
	sign(req, emptyHash, "AKIAIOSFODNN7EXAMPLE", "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY", "us-east-1",
		time.Date(2013, 5, 24, 0, 0, 0, 0, time.UTC))

	want := "AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request," +
		"SignedHeaders=host;range;x-amz-content-sha256;x-amz-date," +
		"Signature=f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41"
	if got := req.Header.Get("Authorization"); got != want {
		t.Errorf("got  %s\nwant %s", got, want)
	}
}

func TestListAndDelete(t *testing.T) {
	var deleteBody, deleteMD5 string
	fake := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.Method == http.MethodGet && r.URL.Path == "/bucket" && r.URL.Query().Get("prefix") == "zaveit/u/":
			io.WriteString(w, `<ListBucketResult><IsTruncated>true</IsTruncated><NextContinuationToken>next/=</NextContinuationToken>
				<Contents><Key>zaveit/u/a.webp</Key><LastModified>2026-11-06T10:00:00.000Z</LastModified></Contents></ListBucketResult>`)
		case r.Method == http.MethodPost && r.URL.Path == "/bucket" && r.URL.RawQuery == "delete=":
			body, _ := io.ReadAll(r.Body)
			deleteBody, deleteMD5 = string(body), r.Header.Get("Content-MD5")
			io.WriteString(w, `<DeleteResult><Error><Key>zaveit/u/a.webp</Key><Code>InternalError</Code></Error></DeleteResult>`)
		default:
			http.Error(w, r.Method+" "+r.URL.String(), http.StatusBadRequest)
		}
	}))
	defer fake.Close()
	client := Client{Endpoint: fake.URL, Bucket: "bucket", AccessKeyID: "id", SecretAccessKey: "secret"}

	objects, next, err := client.List(context.Background(), "zaveit/u/", "")
	if err != nil || next != "next/=" || len(objects) != 1 || objects[0].Key != "zaveit/u/a.webp" ||
		!objects[0].LastModified.Equal(time.Date(2026, 11, 6, 10, 0, 0, 0, time.UTC)) {
		t.Errorf("got %+v %q %v", objects, next, err)
	}

	err = client.Delete(context.Background(), []string{"zaveit/u/a.webp"})
	if err == nil || !strings.Contains(err.Error(), "InternalError") {
		t.Errorf("a per-key error should fail the delete, got %v", err)
	}
	sum := md5.Sum([]byte(deleteBody))
	if !strings.Contains(deleteBody, "<Key>zaveit/u/a.webp</Key>") || deleteMD5 != base64.StdEncoding.EncodeToString(sum[:]) {
		t.Errorf("got body %s md5 %s", deleteBody, deleteMD5)
	}
}
