# Thumbnail file on the phone: resize + WebP, validity check, server sniffing

Researched 2026-11-05 against the installed versions: `expo` 55.0.17, `expo-file-system` 55.0.17, `expo-image` 55.0.9, React Native 0.83.6 (`mobile/package.json`, `mobile/node_modules/*/package.json`), and Go 1.27.2 (`server/go.mod` says `go 1.27`).

## Short answer

- **Nothing installed today can resize or encode an image.** `expo-image` 55.0.9 displays images and makes blurhash/thumbhash strings, but it has no save/encode API (no `saveAsync` in `node_modules/expo-image/src`). `expo-file-system` only moves bytes.
- **`expo-image-manipulator` can do it on both iOS and Android.** It is in the SDK 55 bundle (`node_modules/expo/bundledNativeModules.json`: `"expo-image-manipulator": "~55.0.15"`). The latest 55.x on npm is 55.0.21 (`npm view expo-image-manipulator dist-tags`: `sdk-55: 55.0.21`). Install it with `npx expo install expo-image-manipulator`. It is a native module, so the dev client has to be rebuilt (`expo prebuild` / `expo run:*`).
- **Size:** keep the aspect ratio (fit, don't crop), resize to about **600 px wide**, and save as WebP with **`compress: 0.7`–`0.8`**. Never use `compress: 1` on Android: that makes a *lossless* WebP, about 5–10x bigger (see below).
- **Is the file a picture?** `downloadAsync` saves the body *whatever* the HTTP status is, on both platforms. So check `result.status` (2xx) first, then rely on the manipulator: it rejects when it can't decode the file, and that is the real proof. A 12-byte magic-byte read is a cheap extra check if you want one before decoding.
- **Go:** yes. `net/http.DetectContentType` returns `image/webp` for WebP, including lossy (`VP8 `), lossless (`VP8L`) and extended (`VP8X`) files.

## 1. Resize + WebP with `expo-image-manipulator` (SDK 55)

### API shape (current, not deprecated)

From the SDK 55 docs (https://docs.expo.dev/versions/v55.0.0/sdk/imagemanipulator/) and the 55.0.21 package source (`src/ImageRef.ts`, `src/ImageManipulator.types.ts`):

```ts
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

const ref = await ImageManipulator.manipulate(localUri) // or the useImageManipulator(uri) hook
  .resize({ width: 600 })            // one side only -> "the other will be calculated automatically to preserve image ratio"
  .renderAsync();                     // Promise<ImageRef>; ref.width / ref.height available
const out = await ref.saveAsync({ format: SaveFormat.WEBP, compress: 0.75 });
// out: { uri, width, height, base64? } -- saved "in the cache directory"
```

- `ImageManipulator.manipulateAsync(uri, actions, saveOptions)` is **deprecated** ("replaced by the new, contextual and object-oriented API").
- `SaveFormat` = `JPEG` | `PNG` | `WEBP`. The default is JPEG. `compress` runs 0..1, where 1 means best quality.
- `saveAsync` writes to the **cache** directory under a random name. To keep the file, move or copy it into `documentDirectory` yourself (cache can be purged by the OS).
- Platforms: Android, iOS, tvOS, Web.

### How WebP is actually encoded, per platform (package source, 55.0.21)

| Platform | Encoder | Source |
|---|---|---|
| iOS | `SDImageWebPCoder.shared.encodedData(with:format: .webP, options: [.encodeCompressionQuality: compression])` (libwebp via the `SDWebImageWebPCoder` pod, a declared podspec dependency) | `ios/ImageManipulatorUtils.swift:79-80`, `ios/ExpoImageManipulator.podspec:22` |
| Android | `bitmap.compress(Bitmap.CompressFormat.WEBP, (compress * 100).toInt(), out)` | `android/.../ImageManipulatorArguments.kt:78`, `ImageManipulatorModule.kt:120-127` |

**Android gotcha:** the module uses the old `Bitmap.CompressFormat.WEBP` (deprecated in API 30). Android's docs for it say: "As of Q, a value of `100` results in a file in the lossless WEBP format. Otherwise the file will be in the lossy WEBP format." (https://developer.android.com/reference/android/graphics/Bitmap.CompressFormat#WEBP). So `compress: 1` gives lossless output on Android 10+ but lossy output on iOS. Use `compress < 1` so both platforms behave the same.

The docs page gives no WebP caveats per platform. The source shows WebP encoding is fully implemented on both.

## 2. Dimensions, quality, crop vs fit

### Crop or fit: fit (keep the aspect ratio)

The same local `<postId>.jpg` is shown by `PostImage` in four boxes with very different shapes, always with `contentFit="cover"` (`mobile/common/containers/post-image/post-image.tsx:165`):

| Component | Box (pt) |
|---|---|
| `preview-post-tile` | 88 x 88 |
| `preview-post` | 128 wide x row height |
| `preview-post-card` | full width x 96 (very wide) |
| `post-details` | full width x 400 |

A pre-cropped square would look wrong in the wide card and in post-details. `contentFit="cover"` already crops each box correctly at display time, so **resize with `{ width: N }` only and don't crop**. The width matters more than the height, because the widest box is full screen width. Post-details is about 390–430 pt wide, which is about 1170–1290 px at 3x. A ~600 px wide image is a sensible compromise there: a bit soft on the details screen, sharp in every list cell. If "300x300-ish" is a hard rule, `{ width: 300 }` works for the list cells but will look blurry in post-details.

### Measured sizes (libwebp via Pillow 13, the same codec family both platforms use; rough guide only)

Throwaway script, not committed. Two sources: a smooth photo (macOS "Sonoma" wallpaper) and a synthetic high-detail noise texture, which is a worst case far busier than a real web thumbnail. `q100L` = lossless (what Android produces at `compress: 1`).

```
source       mode  size     q60   q70   q80   q90   q100L
smooth photo fit   300x300   2KB   3KB   4KB   6KB   46KB
smooth photo fit   600x600   6KB   6KB   8KB  14KB  161KB
noise (worst) fit  300x225  14KB  16KB  20KB  27KB   49KB
noise (worst) crop 300x300  23KB  26KB  31KB  41KB   69KB
noise (worst) fit  400x300  31KB  34KB  40KB  53KB   93KB
noise (worst) fit  600x450  81KB  88KB 103KB 135KB  223KB
```

Takeaways:
- At 300 px wide, any lossy quality up to 0.9 stays under 50 KB, even in the worst case.
- At 600 px wide, normal photos are far under 50 KB at 0.8. Only pathological textures go over, and 0.6–0.7 roughly halves them.
- Lossless (`compress: 1` on Android) busts the budget at any size. Avoid it.
- Suggested default: `resize({ width: 600 })`, `compress: 0.75`. If 50 KB must be a *hard* cap, check the output size (`getInfoAsync(out.uri).size`) and re-save once at a lower compress or smaller width.

Not verified on a device: the iOS/Android encoders' quality-to-size curves will differ a little from Pillow's.

## 3. Is the saved `<postId>.jpg` a real picture?

### `downloadAsync` does not fail on HTTP errors

`saveImageFromUrl` (`mobile/common/utils/files.ts`) awaits `FileSystem.downloadAsync(url, localUri)` and ignores the result. The native code writes the response body to disk and *resolves* for any status:

- **iOS:** `EXSessionDownloadTaskDelegate.m` `didFinishDownloadingToURL` moves the temp file to `localUrl`, then resolves with `parseServerResponse`, which is `{status: statusCode, headers, mimeType}` (`ios/Legacy/EXSessionTasks/EXSessionTaskDelegate.m:26-33`). It only rejects on transport errors or file-move errors.
- **Android:** `FileSystemLegacyModule.kt:608-623` `onResponse` writes `response.body` to the file, then resolves with `uri`, `status = response.code`, `headers`. It does **not** set `mimeType` (the TS type allows `string | null`). It only rejects in `onFailure` (network I/O).

So a 404/500 HTML page, or a CDN "access denied" page, lands as `<postId>.jpg` and `saveImageFromUrl` returns it as a success.

### Ways to tell, from cheapest to strongest

1. **`result.status`** from `downloadAsync` (`FileSystemHttpResult.status`, `FileSystemDownloadResult` in `src/legacy/FileSystem.types.ts:56-74`). Treat anything outside 200–299 as a failure and delete the file. This catches error pages, but not a 200 that serves HTML (soft-404s, login walls). Header checks (`content-type`) are weaker: Android gives no `mimeType`, header-name case varies, and servers lie.
2. **Magic bytes.** The legacy `readAsStringAsync(uri, { encoding: 'base64', position: 0, length: 12 })` is implemented natively on both platforms (Android `FileSystemLegacyModule.kt:187-190`, iOS `FileSystemHelpers.swift:22-24`). Decode it and compare with: JPEG `FF D8 FF`, PNG `89 50 4E 47 0D 0A 1A 0A`, GIF `GIF87a`/`GIF89a`, WebP `RIFF????WEBP`. Note that HEIC/AVIF (`....ftyp`) and SVG (text) would fail a narrow allow-list. This needs no new dependency, but it is a hand-written check.
3. **Let the manipulator decode it (strongest, and free if you resize anyway).** `renderAsync()` rejects when the file isn't a decodable image:
   - iOS: for a local file it does `UIImage(data:)`, and on `nil` it throws `FileSystemReadPermissionException` ("File '…' is not readable"). The message is misleading, but it is a rejection (`ios/ImageManipulatorUtils.swift:37-40`).
   - Android: it loads via `expo-image-loader` (Glide). `onFailure` turns into `ImageLoadingFailedException("Could not load the image: …")` (`ImageManipulatorModule.kt:40-50`, `ImageManipulatorExceptions.kt`).
   Don't match on the error message. Treat any rejection as "not an image" and delete the file.

Recommended: (1) check the status, then (3) decode and re-encode. The WebP that comes out is valid by construction. Magic bytes (2) are only worth adding for files you keep *without* re-encoding.

## 4. Go server: does `http.DetectContentType` know WebP?

Yes. `net/http.DetectContentType` delegates to `net/http/internal` (Go 1.27.2: `src/net/http/sniff.go:16`). Its signature table has a masked signature for `RIFF\x00\x00\x00\x00WEBPVP` with `ct: "image/webp"` (`src/net/http/internal/sniff.go:120-124`), and `sniff_test.go:43` tests it. It reads at most the first 512 bytes (`go doc net/http.DetectContentType`) and returns `application/octet-stream` when it can't match.

Checked locally with a throwaway program on go1.27.2:

```
webp-lossy     image/webp     (RIFF....WEBPVP8 )
webp-lossless  image/webp     (RIFF....WEBPVP8L)
webp-extended  image/webp     (RIFF....WEBPVP8X)
jpeg           image/jpeg
html           text/html; charset=utf-8
```

Sniffing only proves the *header* looks like WebP. A truncated or corrupt body still passes. For a full decode check the server would need `golang.org/x/image/webp` (not in the standard library; not checked here).

## Not verified

- Nothing was run on a device or simulator. Sizes come from Pillow/libwebp on macOS, not from SDWebImageWebPCoder or Android's `Bitmap.compress`.
- Didn't test whether the Android Glide loader (`expo-image-loader`) rejects HTML in every case, or whether it could "decode" odd content. That conclusion is from reading the source.
- Didn't check how `expo-image-manipulator` handles SVG/AVIF/animated GIF thumbnails.
- Didn't check app-store/binary-size impact of the extra `SDWebImageWebPCoder` pod (it may already be pulled in by `expo-image`).
