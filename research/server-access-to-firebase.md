# Server access to Firebase from Go

Researched 2026-11-01 for the password-protected web page for a Published List.

**Question:** how should the Go server read Firestore documents, atomically claim a Username, and verify Firebase ID tokens using a service account: the Firestore REST API with stdlib-only auth, or the official Firebase Admin and Firestore Go SDKs?

## Recommendation

**Use the REST API with the standard library (option a).** The server needs only a few operations, and REST covers all of them with one simple primitive:

- **Read:** `GET .../documents/{path}`.
- **Claim a Username:** one `documents:commit` that writes `usernames/{username}` with `currentDocument: {exists: false}`, and updates the user's document in the same call. No interactive transaction is needed.
- **Verify ID tokens:** extend the existing `internal/appcheck` verifier. This needs the project ID only, not the service account.
- **Credentials:** a dedicated service account's JSON key, mounted as a file at runtime. The host is not on Google Cloud, so there is no metadata server to use instead.

The SDK would remove roughly 250-350 lines of code. In exchange the binary grows about 4.5 times and the server goes from 0 to about 51 third-party modules, which breaks its dependency-free rule. Firestore charges are the same either way.

Google's own guidance leans the other way, so this is a deliberate exception. It calls client libraries "the easiest way" and positions REST mainly for constrained environments and automation ([REST guide][rest]). Reconsider the SDK if the server grows beyond a few collections, needs several read-then-write transactions, or needs real-time listeners.

**Check before relying on this:** the failure status of a lost claim was not observed by running it (see [Not verified](#not-verified)).

## Comparison

| | (a) REST + stdlib | (b) Admin + Firestore SDKs |
|---|---|---|
| New code | About 250-350 lines plus tests (estimate below) | About 20 lines of setup and calls |
| Third-party modules linked | 0 | About 51 (472 packages) [measured] |
| Binary size | 7.2 MB today, plus a few KB | 32.1 MB for a bare sample, before server code [measured] |
| Atomic claim | `commit` with `exists: false` | `DocumentRef.Create`, which sends the same precondition |
| Read-then-write transaction | Manual: begin, read, commit, retry on `ABORTED`, about 40 more lines | `RunTransaction`, 5 attempts by default |
| Value mapping | Hand-written typed JSON (`stringValue` and so on) | Automatic struct mapping |
| ID token check | Reuse `appcheck` code; every check is ours to get right | `VerifyIDToken`, maintained by Google |
| Revocation check | Extra call, not built here | `VerifyIDTokenAndCheckRevoked` |
| Credentials | Read and parse the JSON key ourselves | Application Default Credentials |
| Dockerfile | No change | Must also copy `go.sum`; it copies only `go.mod` today |
| Firestore cost | Same | Same |

### How the sizes were measured

- **Size and dependency figures:** built with `CGO_ENABLED=0 -trimpath -ldflags=-s` on darwin/arm64 and Go 1.27.2. The sample used `firebase.google.com/go/v4` v4.22.0, which pulled in `cloud.google.com/go/firestore` v1.22.0. It calls `VerifyIDToken`, `Create` and `RunTransaction`. Counts come from `go list -deps`.
- **Stdlib estimate:** a compiled throwaway prototype came to 186 lines of code. It loads the key, exchanges and caches the token, and does the document get and the claim commit. ID token verification is on top: about 40-60 lines if it shares `appcheck`'s key handling, or about 150 if duplicated. `appcheck.go` is 186 lines in total. Decoding lists, maps and timestamps would add more.

## Reading documents

Both options work, and service-account access skips Security Rules. Google-issued OAuth requests "ignore your security rules" and are controlled by IAM instead ([REST guide][rest]). So the server is the only access check for a Published List, and a wrong-password path must not fetch or return anything it shouldn't.

REST details ([discovery document][discovery], revision 20261021):

- `GET https://firestore.googleapis.com/v1/projects/{id}/databases/(default)/documents/{path}`
- Accepted scopes are `auth/datastore` and `auth/cloud-platform`. Use `auth/datastore`, as the [REST guide][rest] requires.
- Fields come back as typed JSON, for example `{"title": {"stringValue": "..."}}`. This is the main ongoing cost of REST.

## The atomic Username claim

**Use a precondition, not a transaction.** The `Precondition` type's `exists: false` means "the target document must not exist", and a `Write` fails if its precondition is not met. A `commit`'s writes are "always executed atomically and in order", and `transaction` is optional ([discovery document][discovery]).

```json
POST /v1/projects/{id}/databases/(default)/documents:commit
{
  "writes": [
    {
      "update": {"name": ".../documents/usernames/andrei", "fields": {"uid": {"stringValue": "UID"}}},
      "currentDocument": {"exists": false}
    },
    {
      "update": {"name": ".../documents/users/UID", "fields": {"username": {"stringValue": "andrei"}}},
      "updateMask": {"fieldPaths": ["username"]}
    }
  ]
}
```

This is what the SDK does. `DocumentRef.Create` builds a write with `exists(false)` (`docref.go`, firestore v1.22.0). So the SDK adds nothing to the claim itself.

**Telling "taken" from a real failure:**

- The SDK's integration test expects `codes.AlreadyExists` for `Create` on an existing document (`integration_test.go:385`).
- `ALREADY_EXISTS` and `ABORTED` both map to HTTP 409 ([`google.rpc.Code`][rpc]). The HTTP status alone is therefore not enough. Read `error.status` from the response body: `ALREADY_EXISTS` means taken, and `ABORTED` means retry.
- A wrong `updateTime` precondition returns `FAILED_PRECONDITION` (HTTP 400) in the same test file.

**Changing a Username** needs to know the old name, but it still doesn't need an interactive transaction. Read `users/{uid}`, then commit three writes: create the new name with `exists: false`, delete the old name, and update `users/{uid}` with `currentDocument: {updateTime: <value read>}`. The last precondition rejects a concurrent change.

**If an interactive transaction is ever needed,** REST supports it. Call `documents:beginTransaction`, read with `?transaction=`, then `documents:commit` with `transaction`, or `documents:rollback` to abandon it ([discovery document][discovery]). The server must write its own retry loop, because client libraries are what retry on contention ([contention docs][contention]). Standard edition defaults to pessimistic locks for server clients ([contention docs][contention]). The Go client gives up after 5 attempts (`transaction.go`), a reasonable number to copy.

**Input safety:** the Username comes from the client and becomes part of a document path, so validate it against a strict character set before building the path. Take `uid` only from the verified token, never from the request body.

## Verifying ID tokens

No service account is needed. Verification uses public keys and the project ID, so it could ship before the Firestore work. This is also stage 3 of [ADR 0001](../docs/adr/0001-tags-endpoint-auth-roadmap.md).

Required checks ([verify ID tokens][verify]):

| Item | Requirement |
|---|---|
| `alg` | `RS256` |
| `kid` | Matches a current Google public key |
| `exp` | In the future |
| `iat`, `auth_time` | In the past |
| `aud` | The Firebase project ID |
| `iss` | `https://securetoken.google.com/<projectId>` |
| `sub` | Non-empty; this is the `uid` |

Differences from the existing `appcheck` verifier:

- **Different claims:** App Check uses the project number and an array `aud`. ID tokens use the project ID and a string `aud`.
- **Key source:** Firebase documents an X.509 endpoint (`.../robot/v1/metadata/x509/securetoken@system.gserviceaccount.com`). The [OIDC discovery document][oidc] publishes a JWKS endpoint (`.../service_accounts/v1/jwk/securetoken@system.gserviceaccount.com`). I confirmed both respond. The JWKS one returns the same shape `appcheck.fetchKeys` already parses, so it needs no new parser.
- **Key lifetime:** Firebase says to use the `max-age` from `Cache-Control` ([verify ID tokens][verify]). `appcheck` hardcodes 6 hours. The live X.509 response showed `max-age=20046`, about 5.6 hours. Honour the header for ID tokens.
- **Clock skew:** the Admin SDK allows 300 seconds on `iat` and `exp`, and caps `sub` at 128 characters (`token_verifier.go`). `appcheck` allows no skew. Copy the SDK's behaviour, or a slightly fast client clock will cause occasional rejections.

**Revocation:** neither `VerifyIDToken` nor a hand-written check detects revoked tokens. Checking requires an RPC on every call ([`auth` package][auth]). Skip it for now. If it matters later for sensitive actions, it is one extra REST call.

## Container credentials

The server runs as a `CGO_ENABLED=0` binary on `distroless/static:nonroot`, deployed with Docker Compose and an `env_file` (`server/Dockerfile`, `server/compose.prod.yaml`). Nothing there indicates a Google host.

Application Default Credentials looks at `GOOGLE_APPLICATION_CREDENTIALS`, then gcloud's local file, then the metadata server ([ADC][adc]). The third step doesn't exist off Google Cloud, so **both options end up with the same key file**. The SDK's ADC support saves only the parsing code here.

**The key:**

- Create a dedicated service account for this server with `roles/datastore.user` ([IAM][iam]), rather than using the broader default Firebase Admin account. The role gives read and write access to the whole database.
- Mount the key as a read-only file at runtime. Keep it out of the image and out of git ([key best practices][keys]). The Dockerfile copies named paths only, so it won't be picked up by accident.
- Make sure the file is readable by the container's non-root user. The nonroot image runs as UID 65532, so a host file owned by another user with mode 600 will fail at startup.
- Rotate it routinely and give each deployment its own key ([key best practices][keys]).
- Google calls keys "a security risk" and recommends [Workload Identity Federation][keys] for external workloads. That needs an identity provider the host can present credentials from, so it is probably overkill for one self-hosted box.

**Getting an access token in REST:** there are two supported ways ([service account OAuth][oauth]).

1. **Exchange:** sign an RS256 JWT with `iss`, `scope`, `aud=https://oauth2.googleapis.com/token`, `iat` and `exp` (at most 1 hour), then POST it to the token endpoint with `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer`. Cache the result until shortly before expiry.
2. **Self-signed JWT:** send the JWT directly as the bearer token with `aud=https://firestore.googleapis.com/` and `kid` set to `private_key_id`. Google's page uses Firestore as its example. There is no token endpoint call, which removes about 40 lines and one network dependency.

Prefer option 2, and test it once against the real project. Fall back to option 1 if it is rejected.

## Costs at small scale

**Firestore billing doesn't change between options.** The [pricing page][pricing] charges per document and doesn't distinguish client types. Rule-evaluation reads apply to mobile and web clients only.

| Standard edition, us-central1 | Free per day | Price per 100,000 |
|---|---|---|
| Reads | 50,000 | $0.03 |
| Writes | 20,000 | $0.09 |
| Deletes | 20,000 | $0.01 |

Also free: 1 GiB of storage and 10 GiB of egress a month. The Spark plan includes these quotas ([Firebase pricing][firebase-pricing]). Prices are from the [Google Cloud pricing page][gcp-pricing], and other locations differ.

What this means here:

- **Reads per page view drive the bill.** At 1,000 views a day, a page that reads one list document plus 50 Posts uses 51,000 reads, which is over the free quota. One denormalised document per Published List uses 1,000. The 1,000 reads a day over quota cost about $0.01 a month, so this is a free-tier concern rather than a budget one. On the Spark plan, though, the quota is a hard limit.
- **A claim is two writes,** so 20,000 writes a day is out of reach at this scale.
- **Egress counts** because requests from outside Google Cloud incur internet egress charges ([pricing page][pricing]). Keep documents small; the 10 GiB allowance should cover it.
- **Binary size** has no meaningful hosting cost, though the SDK does add image size and build time.

## Not verified

- **The lost-claim response over REST was not observed.** I tried to run the Firestore emulator, but running the downloaded jar was denied in this session. `ALREADY_EXISTS` is inferred from the Go client's gRPC test plus the standard HTTP mapping. Before shipping, run a race test against the emulator: many concurrent claims, exactly one winner, and no `users` document written for the losers. The test is simple to rebuild from the JSON above.
- **Nothing ran against a real project.** The prototype compiled and passed `go vet`, but it never made a call. The self-signed JWT path is untested.
- **Billing for failed commits:** I didn't find whether a commit rejected by its precondition is charged.
- **Whether the JWKS and X.509 endpoints always expose the same `kid`s:** I didn't compare them.
- **nam5 prices and this project's Firestore location:** I didn't confirm either.
- **SDK memory use and startup time:** not measured.
- **The UID 65532 and file-permission advice** comes from general knowledge of distroless images, not from a source fetched here.
- **Newer SDK releases exist.** `go get @latest` resolved v4.22.0, while the `dev` branch's `go.mod` already requires newer dependencies. Counts will drift a little but not change the conclusion.

## Sources

Fetched 2026-11-01. Source files were read from the Go module cache at the versions listed above.

- [Firestore REST guide][rest]
- [Firestore REST discovery document][discovery], used because the reference pages returned only navigation text to the fetcher
- [Verify ID tokens][verify]
- [Service account OAuth 2.0][oauth]
- [Application Default Credentials][adc]
- [Service account key best practices][keys]
- [Firestore IAM][iam]
- [Transaction data contention][contention]
- [Firestore pricing (Firebase)][pricing]
- [Firestore pricing (Google Cloud)][gcp-pricing]
- [Firebase pricing plans][firebase-pricing]
- [Firebase `auth` Go package][auth]
- [`cloud.google.com/go/firestore` Go package][firestore-go]
- [`firebase-admin-go` token verifier][verifier]
- [`google.rpc.Code`][rpc]
- [securetoken OIDC discovery][oidc], checked with a sample project ID

[rest]: https://firebase.google.com/docs/firestore/use-rest-api
[discovery]: https://firestore.googleapis.com/$discovery/rest?version=v1
[verify]: https://firebase.google.com/docs/auth/admin/verify-id-tokens
[oauth]: https://developers.google.com/identity/protocols/oauth2/service-account
[adc]: https://docs.cloud.google.com/docs/authentication/application-default-credentials
[keys]: https://docs.cloud.google.com/iam/docs/best-practices-for-managing-service-account-keys
[iam]: https://docs.cloud.google.com/firestore/native/docs/security/iam
[contention]: https://firebase.google.com/docs/firestore/transaction-data-contention
[pricing]: https://firebase.google.com/docs/firestore/pricing
[gcp-pricing]: https://cloud.google.com/firestore/pricing
[firebase-pricing]: https://firebase.google.com/pricing
[auth]: https://pkg.go.dev/firebase.google.com/go/v4/auth
[firestore-go]: https://pkg.go.dev/cloud.google.com/go/firestore
[verifier]: https://github.com/firebase/firebase-admin-go/blob/dev/auth/token_verifier.go
[rpc]: https://github.com/googleapis/googleapis/blob/master/google/rpc/code.proto
[oidc]: https://securetoken.google.com/firebase-test/.well-known/openid-configuration
