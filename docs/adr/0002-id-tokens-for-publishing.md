---
status: accepted
---

# Require Firebase ID tokens for publishing

Publishing a List sets a Username and a List Password, and those requests must prove which user is making them. So the publishing endpoints require a Firebase ID token now, even though ADR 0001 only planned optional tokens in its last stage. `/tags` and `/metadata` are unchanged, and the app still works without signing in, because only publishing needs an account. (Superseded: ADR 0004 makes the app sign-in only.)

The server hashes the List Password and claims the Username, and clients can't read or write that data. Handling them in the app with Firestore rules was rejected, because any client able to read a hash could try to crack it offline.
