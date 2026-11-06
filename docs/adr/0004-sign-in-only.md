---
status: accepted
---

# The app requires an account

Zaveit used to offer "Continue without account", with Posts and their pictures kept only on the phone. It now requires Google or Apple sign-in, so every Post is in Firestore with its Thumbnail in R2 and appears on the user's other devices and on Published Lists. This supersedes the line in ADR 0002 that says the app still works without signing in.

Keeping signed-out use would need a second picture path on the phone (local files, scraping when a picture is shown) next to R2, plus the backfill on the phone that was already rejected. The cost is that some people won't sign up and will stop using the app, and they are unlikely to come back if signed-out use returns later. Upgraded signed-out users keep their Posts on the phone until they sign in, and then `syncPosts` uploads them.
