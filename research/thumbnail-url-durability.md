# Thumbnail URL durability

Question: for each source Zaveit supports, do thumbnail URLs expire, and can a browser load them directly?

Researched 2026-11-01.

- **Documented** means a first-party source says it.
- **Observed** means a request I made that day. Every probe came from one developer Mac with a Chrome User-Agent, `Sec-Fetch-*: cross-site` headers and a cross-site `Referer`. curl stands in for a browser here: it shows what the server sends, but no browser ran. A cloud server's IP may be treated differently.
- **Silent** means the docs don't address it. Nothing is inferred unless marked.

## Short answer

Only YouTube is a safe URL to store. TikTok's URL dies in about two days. Reddit and Instagram give no picture to store at all, Facebook gave none in the one probe that reached it, and X and generic sites worked but nobody promises they stay up. Nothing in the first-party docs I read gives a lifetime for any URL except TikTok's. A grid needs its own copy of the picture for everything except YouTube, plus a placeholder for Posts that never had one.

## Sources actually supported

The task listed Instagram and X as examples, but **neither has a rule in the code**. No file in `mobile/` or `server/` names them, apart from the `twitter:image` meta tag.

| Source | App path | Picture comes from |
| --- | --- | --- |
| TikTok (`tiktok.com`) | `PLATFORM_RULES`, `share-intent.platforms.ts:17` | `covers[0]` from the undocumented `/embed/v2/{id}` page, then oEmbed |
| Reddit (`reddit.com`, `redd.it`) | `share-intent.platforms.ts:24` | oEmbed `thumbnail_url` only |
| YouTube (`youtube.com`, `youtu.be`) | `share-intent.platforms.ts:36` | oEmbed `thumbnail_url` |
| Everything else, including Instagram and X | Generic: `getMetadata`, `share-intent.utils.ts:83-103` | `shareIntent.meta["og:image"]`, then server `/metadata` |

- The server reads `og:image`, then `twitter:image` (`sources.go:363-371`).
- `og:image` in `shareIntent.meta` is limited: the [expo-share-intent README](https://github.com/achorein/expo-share-intent) lists `meta.xxx` tags as iOS only. So on Android, generic links get a picture only through the server.
- Facebook appears only in the server's platform list, as `titleOnly` (`sources.go:80`). That list only relaxes `/health/sources`. In the app it is a generic link.
- `PostImage` calls `getMetadata({ webUrl })` with no `meta` (`post-image.tsx:107`). A reload therefore always goes to the server for generic links, even if the original save used iOS `meta`.

## Findings by source

| Source | URL expires? | Browser can load it? | Picture available today? |
| --- | --- | --- | --- |
| YouTube | No expiry in URL. Lifetime **silent** | Yes, observed | Yes |
| TikTok | **Yes**, about 47 hours observed | Yes until expiry, observed | Yes, via an undocumented page |
| Reddit | Moot | Not tested | **No**, oEmbed has no thumbnail |
| Instagram | Moot for this code. Lifetime **silent** | Not tested on a post image | **No**, removed by Meta and absent from the page |
| X | No expiry in URL. Lifetime **silent** | Yes, observed on one avatar | Yes, but the one tested post gave an avatar |
| Facebook | Moot | Not tested | **No**, page returned 400 |
| Generic `og:image` | Depends on site. **Silent** | Yes on 3 of 3 sites tested | Depends on site |

### YouTube

- oEmbed returns a plain `https://i.ytimg.com/vi/{id}/hqdefault.jpg`, with no signature or query string (observed).
- Docs: the [thumbnails reference](https://developers.google.com/youtube/v3/docs/thumbnails) calls it only "The image's URL". It gives no lifetime or stability promise.
- Hotlinking (observed): 200 with `Cross-Origin-Resource-Policy: cross-origin` and `Access-Control-Allow-Origin: *`, with or without a Referer.
- A made-up video ID returns 404, so the URL's life presumably follows the video's. That is an inference, not a documented rule.
- Policy matters more than mechanics here. The [Developer Policies](https://developers.google.com/youtube/terms/developer-policies) bar storing copies of "YouTube audiovisual content" without approval (III.E.1). Data fetched without user credentials may be stored for at most 30 calendar days, then deleted or refreshed (III.E.4.d).
- The policy does not say whether a thumbnail counts as audiovisual content, and does not define the term. It also requires any page showing YouTube thumbnails to make YouTube's source clear. I did not establish whether the public oEmbed endpoint counts as "YouTube API Services". Hotlinking avoids the storage question either way.

### TikTok

- The picture URL is signed. Observed shape: `p16-common-sign.tiktokcdn-eu.com/...?x-expires=1793718000&x-signature=...`.
- Three videos fetched at 2026-11-01 15:35 UTC all expired at 2026-11-03 15:00 UTC, about 47 hours later. The shared round time suggests a fixed bucket, so the remaining life at save time probably varies. This is one moment's sample.
- Changing `x-expires` or removing the query gives 403 on all three (observed), so the expiry can't be extended by editing the URL.
- I did not watch a live URL pass its expiry. The docs' 2022 sample URLs return 403 today, but those samples may be redacted, so that is weak evidence. To confirm directly, re-request a saved URL after the `x-expires` time.
- Docs cover a different route. [`cover_image_url`](https://developers.tiktok.com/doc/tiktok-api-v2-video-object) in the official API "has a TTL of 6 hours", and the [Display API guide](https://developers.tiktok.com/doc/display-api-get-started) says it "will expire after some time". The `/embed/v2/` page the code scrapes is undocumented, so it could change without notice.
- oEmbed is not a real fallback for pictures. Both videos tested returned no `thumbnail_url` and no `title`. The [embed docs](https://developers.tiktok.com/doc/embed-videos/) sample shows neither field.
- Before expiry a browser can load it: 200 with `Access-Control-Allow-Origin: *`, with or without a Referer (observed).

### Reddit

- The real oEmbed response has no `thumbnail_url`. Its keys are `author_name, height, html, provider_name, provider_url, title, type` (observed on one post). This matches the server's `titleOnly` flag.
- A Reddit title wins, so the app stops there and marks the image failed. No code path gets a picture for Reddit.
- `sources_test.go:98` fakes a `thumbnail_url` that the live endpoint did not return.
- The post page had no `og:image` either, and `top.json` returned 403 to this probe. So I could not test Reddit's image hosts for expiry or hotlinking.
- Docs: I searched the [Data API Terms](https://redditinc.com/policies/data-api-terms) and [Developer Terms](https://redditinc.com/policies/developer-terms) for "cache", "thumbnail" and "hotlink". There are two caching hits: one requires deleting cached content when Data API access ends, and the other bars caching for AI training. Neither word about thumbnails or hotlinking appears, and image URL lifetime is not addressed. This was a word search, not a legal reading. `reddit.com/wiki/api` could not be fetched.

### Instagram

- [Meta's changelog](https://developers.facebook.com/docs/graph-api/changelog/non-versioned-changes/nvc-2025) removed `thumbnail_url` and author fields from Instagram post and Facebook post and video oEmbed on 2025-11-03. The [oEmbed reference](https://developers.facebook.com/docs/graph-api/reference/oembed-video) confirms it.
- The [Instagram oEmbed doc](https://developers.facebook.com/docs/instagram-platform/oembed) limits the endpoint to embedding and forbids other uses of its metadata. It is no route to a thumbnail even though tokens are no longer required.
- Observed: `instagram.com` post and profile pages returned 200 with **no `og:image`** to the Chrome User-Agent the server also uses. One post ID tried was not confirmed real, so this is a small sample. A page that reached a phone's iOS share sheet could differ.
- Docs: the [IG Media reference](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/) (a logged-in API this code doesn't use) says nothing about URL expiry or hotlinking. A [developer forum thread](https://developers.facebook.com/community/threads/889163498159993/) reports expiring links with no staff answer, so it is a lead, not a fact.
- I never obtained a real post image URL, so I can't say whether Instagram's post images expire or block hotlinking.

### X

- The [oEmbed docs](https://docs.x.com/x-for-websites/oembed-api) list no `thumbnail_url`. The code doesn't use that endpoint anyway.
- Observed: a text-only post (`x.com/jack/status/20`) gave `og:image` set to the **author's avatar**, `pbs.twimg.com/profile_images/...`. A post with a photo was not tested, so I don't know what `og:image` holds for those. An avatar URL could change when the user changes their picture (inference).
- Hotlinking (observed on that avatar): 200, `Cross-Origin-Resource-Policy: cross-origin`, `Access-Control-Allow-Origin: *`, no signature.
- Docs: the [data dictionary](https://docs.x.com/x-api/enterprise-gnip-2.0/fundamentals/data-dictionary) line "You cannot directly embed these images in a web page" is about **direct-message media**, not public posts. For public media, lifetime and hotlinking are silent.

### Facebook

The tested `facebook.com` post returned 400 to the probe, so no picture was seen. Meta's [sharing docs](https://developers.facebook.com/docs/sharing/webmasters/images) concern how Facebook reads other sites' images, not how long its own image URLs last. Lifetime and hotlinking are not established.

### Generic `og:image`

- Specs are silent. [Open Graph](https://ogp.me/) defines `og:image` only as "An image URL" and says nothing on lifetime, caching or hotlinking. [oEmbed](https://oembed.com/) defines `thumbnail_url` the same way, and `cache_age` is only a suggestion.
- Each site decides. A site can block `<img>` loads from other origins with [`Cross-Origin-Resource-Policy`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Resource-Policy). By default, browsers send the site's origin as the [`Referer`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referrer-Policy), and a server can refuse based on it. `<img referrerpolicy="no-referrer">` removes that header, which beats simple Referer checks but not CORP.
- Observed: Wikipedia (`thumb.wikimedia.org`), GitHub (`opengraph.githubassets.com`) and hotnews.ro all gave 200 to a cross-site request. Three sites say nothing about the wider web.
- The `/metadata` result is only a URL. Nothing records later whether it still works.

## What this means for the three options

| Source | 1. Store URL at save | 2. Server fetches and caches | 3. App uploads picture |
| --- | --- | --- | --- |
| YouTube | Works | Works, with policy doubt | Works, with policy doubt |
| TikTok | **Dies in about 2 days** | Works if TikTok allows the server's IP | Works |
| Reddit | Nothing to store | Nothing to fetch | Nothing to upload |
| Instagram | Nothing to store | Nothing to fetch (observed) | Only if iOS `meta` had it at save |
| X | Works until the URL changes | Likely works, cloud IP untested | Works |
| Generic | Mostly works, can break any time | Mostly, some sites block servers | Best coverage |

**Option 1: store the URL.** The smallest change, but Firestore fills with URLs that are dead by the time they matter. Fine for YouTube only.

**Option 2: server fetches and caches.**
- `sources.Metadata` and its private-address guard already exist, so the fetch is cheap to add. It still needs storage and limits on picture size and type.
- Links that go straight from phone to platform today would start passing through our server, which is a privacy change. `metadata.go` is careful not to log links for this reason.
- `sources.go` already notes that a block on the server "says nothing about phones". The server is the weaker position, and it adds nothing for Reddit or Instagram.

**Option 3: app uploads.**
- It reuses what the phone already has: `${id}.jpg` is saved at share time (`share-intent.tsx:113`), so existing Posts can be backfilled from the phone. Option 2 could backfill too, by re-reading each link, if the link still gives a picture to the server.
- It needs storage and upload rules, and nothing appears on the web until a phone has been online.
- **Watch out:** `saveImageFromUrl` (`common/utils/files.ts`) ignores `downloadAsync`'s result. The [Expo docs](https://docs.expo.dev/versions/latest/sdk/filesystem-legacy/) report an HTTP `status` there and don't say a non-2xx response rejects. So a local `.jpg` might be a saved error page. Check that it is really an image before uploading.

**Suggested direction:** option 3 for everything, except YouTube, where the web page hotlinks `i.ytimg.com` and keeps no copy. That avoids the 30-day question and the only cost is a stored or derived URL. Keep option 2 in reserve for Posts created without a phone, which don't exist today. Whatever is chosen, the grid needs a placeholder, because Reddit and Instagram Posts usually have no picture.

## Not established

- Whether any URL here other than TikTok's stops working on a schedule.
- Whether Instagram post images, Reddit image hosts or Facebook images expire or block hotlinking. None were reached.
- How any of these treat a cloud server's IP, which decides how well option 2 works.
- What `og:image` X gives for posts with photos.
- Legal position on copying third-party pictures. The policy notes above are not legal advice.
