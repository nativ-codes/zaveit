---
status: accepted
---

# Thumbnails upload through the Go server, not straight to R2

The phone sends each Thumbnail to the Go server (`POST /v1/thumbnails`), and the server puts it in R2. The server needs the Firebase ID token and App Check, picks the key `zaveit/<uid>/<random>.webp` itself, caps the body at 200 KB, sniffs the WebP header, and returns the public URL. The phone then writes that URL onto the Post. Only the server holds the R2 token. The phone never gets R2 credentials or a URL it can upload to.

## Considered Options

- **Presigned PUT from the server, phone uploads to R2 directly.** It looks like the obvious S3 pattern and would save the VPS from relaying the bytes. We rejected it for four reasons. The server never sees the file, so it can't check the type, and the bucket could be used as free hosting. The size cap only holds if Content-Length is signed into the URL. It needs a second, query-string SigV4 code path. And each upload takes two round trips. At about 50 KB per Thumbnail, the relay costs the VPS almost nothing.
