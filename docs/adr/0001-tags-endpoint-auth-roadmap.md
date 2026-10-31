---
status: accepted
---

# Add `/tags` authentication in stages

Only the Zaveit app should be able to call `/tags`, because anyone else calling it spends our AI budget. The target is two layers: Firebase App Check, which proves the request comes from the real app, and Firebase ID tokens, which identify signed-in users. We are deliberately starting with neither, so the endpoint can be validated before we take on the extra work. An unauthenticated `/tags` is intentional for now and is not an oversight, which is why it stays off the public internet until stage 2.

## Stages

Each stage starts once the one before it has been validated.

1. **No authentication.** Runs only on a local machine or LAN, to prove that the server, prompt and app integration work end to end. No public URL and no store release.
2. **Firebase App Check.** Reject requests that don't come from the real app, with a per-IP rate limit. This is the first stage that may be deployed publicly.
3. **Optional Firebase ID token.** Requests from signed-in users add a token, which enables per-user rate limits. Requests without one are still accepted.

## Considered Options

- Requiring a Firebase ID token was rejected, because the app works without signing in and signed-out users would lose Suggested Tags.
- Firebase Anonymous Auth was rejected, because anonymous users would look logged in to the app's auth state.
- A static API key shipped in the app was rejected, because it repeats the problem of secrets being extractable from the app.
