# R2 limits, cost of Thumbnails, and the smallest Go client

Researched 2026-11-05. Context: bucket `zaveit-r2`, read publicly via custom domain `img.nativ.codes`; only the Go server (`server/`, zero third-party dependencies in `server/go.mod`, plain `net/http` everywhere in `server/internal`) holds an R2 S3 token.

## TL;DR

- At 1k, 10k and 100k Posts with 50 KB Thumbnails, R2 costs **$0/month**: storage (0.05 / 0.5 / 5 GB) and requests sit inside the free tier (10 GB-month, 1M Class A, 10M Class B, free egress).
- **Recommendation: hand-written SigV4 on the standard library** (~150 lines incl. a test against an AWS signing vector). It keeps `server/go.mod` dependency-free. aws-sdk-go-v2 adds 12 modules and ~2.9 MB of binary; minio-go adds 19 modules and ~4.1 MB.
- `Content-Type` and `Cache-Control` can be set on PutObject. Cloudflare's cache in front of the custom domain respects `Cache-Control: public, max-age>0`, but **caches by file extension only**: keys must end in `.jpg`/`.webp`/`.png` (or add a Cache Rule), or every read goes to R2.
- DeleteObjects is supported: up to 1,000 keys per call (S3 spec; R2's Workers binding states the same 1,000 cap). Delete-by-prefix = ListObjectsV2 (`prefix=zaveit/<userId>/`, max 1,000 per page) then DeleteObjects per page.

## 1. Free tier and prices (Standard storage)

Source: <https://developers.cloudflare.com/r2/pricing/>

| Item | Free per month | Price above free |
|---|---|---|
| Storage | 10 GB-month | $0.015 / GB-month |
| Class A (writes, lists) | 1 million | $4.50 / million |
| Class B (reads) | 10 million | $0.36 / million |
| Egress | free | free |

- Class A includes `PutObject`, `ListObjects`, `CopyObject`, multipart ops. Class B includes `GetObject`, `HeadObject`.
- "Free operations include `DeleteObject`, `DeleteBucket` and `AbortMultipartUpload`." `DeleteObjects` (bulk) is **not listed in any class** on the page (see Unverified).
- "A GB-month is calculated by averaging the *peak* storage per day over a billing period (30 days)." "Cloudflare rounds up your usage to the next billing unit" (1.1 GB-month bills as 2).
- The free tier is per account, not per bucket (implied by the page; other buckets on the account share it).

## 2. Cost for Thumbnails at ~50 KB each

Assumptions: 1 PutObject per Post (plus ~20% re-uploads), each Thumbnail read 30 times a month, and **worst case: every read misses the Cloudflare cache** and hits R2 as a GetObject (Class B). Real Class B will be lower once the cache is warm.

| Posts | Storage | Class A (puts) | Class B (reads, worst case) | Monthly cost |
|---|---|---|---|---|
| 1,000 | 0.05 GB | ~1.2k | 30k | $0 |
| 10,000 | 0.5 GB | ~12k | 300k | $0 |
| 100,000 | 5 GB | ~120k (one-off backfill: 100k) | 3M | $0 |

When does it stop being free? Storage passes 10 GB at ~200k Thumbnails. Class B passes 10M at ~333k uncached reads per month at 100k Posts (100 reads per Thumbnail). Even then, the paid amounts are tiny: 5 GB above free = $0.075/month; 10M extra reads = $3.60.

## 3. Upload headers and how the custom domain serves them

- R2 PutObject supports system metadata `Content-Type` and `Cache-Control` (S3 API compatibility table, "System Metadata": ✅ Content-Type, ✅ Cache-Control). Source: <https://developers.cloudflare.com/r2/api/s3/api/>
- Custom domains put the bucket behind Cloudflare Cache: "Domain access through a custom domain allows you to use Cloudflare Cache to accelerate access to your R2 bucket." Smart Tiered Cache is recommended. r2.dev is rate-limited and not for production. Source: <https://developers.cloudflare.com/r2/buckets/public-buckets/>
- Cloudflare caches a response when "The `Cache-Control` header is set to `public` and `max-age` is greater than 0", and not when it is `private`, `no-store`, `no-cache` or `max-age=0`. Origin Cache Control is on by default for Free/Pro/Business plans. Source: <https://developers.cloudflare.com/cache/concepts/default-cache-behavior/>
- **Gotcha:** "Cloudflare only caches based on file extension and not by MIME type." JPG, JPEG, PNG and WEBP are in the default list. A key like `zaveit/<userId>/<postId>` with no extension is **not** cached by default, whatever `Content-Type` says. Use `zaveit/<userId>/<postId>.webp` (or `.jpg`), or add a Cache Rule. Same source.
- Suggested upload headers: `Content-Type: image/webp` (or `image/jpeg`), `Cache-Control: public, max-age=31536000, immutable`. Only use `immutable` if a changed Thumbnail gets a new key (e.g. a content hash or version in the name). Otherwise use a shorter max-age, because overwriting a key does not purge the edge cache.

## 4. DeleteObjects and listing limits

- R2 marks `DeleteObjects` ✅ supported. Unsupported: `x-amz-mfa`, `x-amz-bypass-governance-retention`, `x-amz-request-payer`, `x-amz-expected-bucket-owner`. Source: <https://developers.cloudflare.com/r2/api/s3/api/>
- S3 spec: "The request can contain a list of up to 1,000 keys"; `POST /?delete` with XML body `<Delete><Object><Key>…</Key></Object>…<Quiet>true</Quiet></Delete>`; "The Content-MD5 request header is required for all Multi-Object Delete requests" (AWS general-purpose buckets). Quiet mode returns only errors. A missing key counts as deleted. Source: <https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteObjects.html>
- R2's own Workers API: delete "Up to 1000 keys may be deleted per call"; list limit "Defaults to `1000`, with a maximum of `1000`." Source: <https://developers.cloudflare.com/r2/api/workers/workers-api-reference/>
- `ListObjectsV2` is supported with `prefix`, `continuation-token`, `max-keys`, `delimiter`, `start-after`. Source: S3 API page above.
- Other limits (<https://developers.cloudflare.com/r2/platform/limits/>): key 1,024 bytes; metadata 8,192 bytes; single PUT up to 5 GiB; **concurrent writes to the same key: 1 per second (429 above)**; objects and bytes per bucket unlimited; 100 custom domains per bucket.
- Region is `auto` (empty and `us-east-1` alias to it). Endpoint: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`. Sources: S3 API page; <https://developers.cloudflare.com/r2/api/tokens/>
- Token: Access Key ID = token `id`; Secret = "The SHA-256 hash of the API token `value`". An **Object Read & Write** token can be scoped to `zaveit-r2` only, and it can "read, write, and list objects". Source: tokens page above.

## 5. Go client options

Measured on go1.27.2 (darwin/arm64), in a throwaway module that only builds a client. The baseline stdlib binary with `net/http` + `crypto/hmac` + `encoding/xml` is 5.33 MB.

| Option | Modules added to go.mod | Binary | Rough code for put + delete + delete-prefix |
|---|---|---|---|
| Stdlib + hand-written SigV4 | 0 | 5.33 MB (baseline) | ~120-150 lines (signer ~60, put/delete ~25, list+bulk-delete loop with XML structs ~50) plus one test |
| aws-sdk-go-v2 (`service/s3` v1.114.7, `credentials` v1.20.14, core v1.47.6) | 3 direct + 9 indirect (smithy-go, checksum, s3shared, v4a, eventstream…) | 8.24 MB (+2.9 MB) | ~40 lines (client setup, `PutObject`, `DeleteObject`, `ListObjectsV2Paginator` + `DeleteObjects`) |
| minio-go v7.4.1 | 1 direct + 18 indirect (x/net, x/crypto, x/sys, x/text, klauspost/compress, cpuid, xxh3, msgp, ini, yaml…) | 9.43 MB (+4.1 MB) | ~25 lines (`PutObject` with `ContentType`/`CacheControl` options, `RemoveObject`, `ListObjects` channel into `RemoveObjects`) |

Notes:

- Cloudflare's official aws-sdk-go-v2 example: `config.WithRegion("auto")`, `credentials.NewStaticCredentialsProvider(id, secret, "")`, `o.BaseEndpoint = "https://<account>.r2.cloudflarestorage.com"`. Source: <https://developers.cloudflare.com/r2/examples/aws/aws-sdk-go/>
- Hand-written SigV4 needs: canonical request (method, URI-encoded path `/zaveit-r2/<key>`, sorted query, signed headers `host;x-amz-content-sha256;x-amz-date` plus `content-md5`/`content-type` when sent), string-to-sign `AWS4-HMAC-SHA256`, scope `<date>/auto/s3/aws4_request`, key derivation by chained HMAC-SHA256. Bodies here are ≤ ~100 KB, so hash the full payload rather than relying on `UNSIGNED-PAYLOAD`. For DeleteObjects, send `Content-MD5` (base64 MD5 of the XML body) because the S3 spec requires it. SigV4 spec: <https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_sigv-create-signed-request.html>
- The trade-off: the SDKs handle signing edge cases (key URI-encoding, retries, 429 back-off) for you. The stdlib path keeps the repo's zero-dependency convention and matches how `appcheck` and `deepseek` already call HTTP APIs. It needs one signing test against a known vector to be trustworthy.

## Unverified

- **DeleteObjects billing class**: not on the pricing page (only singular `DeleteObject` is listed as free). It may be Class A or free.
- **DeleteObjects 1,000-key cap on R2's S3 API specifically**: R2's S3 page doesn't state a cap; 1,000 comes from the AWS spec and R2's Workers binding.
- **Content-MD5 on R2 DeleteObjects**: AWS requires it; R2 docs are silent. Sending it is safe either way.
- **Custom domain echoes stored `Content-Type`/`Cache-Control`**: no Cloudflare doc says so explicitly. It follows from S3 GetObject semantics and the cache docs. Verify with `curl -I https://img.nativ.codes/<key>` after the first upload.
- **Cache hits don't bill Class B**: implied by the cache sitting in front of R2, but not stated on the pricing page.
- **aws-sdk-go-v2 checksum defaults on R2**: secondary sources (a GitLab MR, aws-sdk-go-v2 issue #2808) report `SignatureDoesNotMatch` with s3 ≥ v1.73 defaults on third-party endpoints, fixed by `RequestChecksumCalculation: aws.RequestChecksumCalculationWhenRequired`. Cloudflare's example page doesn't mention it. Not tested here.
- Line counts for the stdlib option are estimates; no implementation was written or run against R2.
