package api

import (
	"cmp"
	"crypto/hmac"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"slices"
	"strconv"
	"strings"
	"time"

	"zaveit/server/internal/firestore"
)

// Visitor endpoints: public, no App Check. Every failure gives the same 401, so a Visitor can't tell a wrong
// password from a Username or List that doesn't exist or is offline.

const visitorTokenLife = 24 * time.Hour

var errLocked = errors.New("locked")

func writeLocked(w http.ResponseWriter) {
	writeError(w, http.StatusUnauthorized, "wrong password or link")
}

// visitorToken names a List and the salt it had when unlocked, so a new List Password cuts it off.
type visitorToken struct {
	Username string `json:"u"`
	ListPath string `json:"p"`
	Salt     string `json:"s"`
	Expires  int64  `json:"e"`
}

func signToken(secret []byte, t visitorToken) string {
	payload, _ := json.Marshal(t)
	mac := hmac.New(sha256.New, secret)
	mac.Write(payload)
	return base64.RawURLEncoding.EncodeToString(payload) + "." + base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

func readToken(secret []byte, token string, now time.Time) (visitorToken, bool) {
	var t visitorToken
	payloadPart, sigPart, _ := strings.Cut(token, ".")
	payload, err1 := base64.RawURLEncoding.DecodeString(payloadPart)
	sig, err2 := base64.RawURLEncoding.DecodeString(sigPart)
	mac := hmac.New(sha256.New, secret)
	mac.Write(payload)
	if err1 != nil || err2 != nil || !hmac.Equal(sig, mac.Sum(nil)) || json.Unmarshal(payload, &t) != nil {
		return t, false
	}
	return t, now.Unix() < t.Expires
}

// publishedList reads the List behind a link: Username → uid → List. errLocked when either is missing or the List is offline.
func publishedList(r *http.Request, db *firestore.Client, username, path string) (uid string, doc firestore.Document, err error) {
	if !validUsername(username) || !validListPath(path) {
		return "", doc, errLocked
	}
	owner, err := db.Get(r.Context(), "usernames/"+username)
	uid = fieldString(owner.Fields, "uid")
	if err == nil || errors.Is(err, firestore.ErrNotFound) {
		// An unknown Username reads a List that can't exist, so it costs the same two reads as an unknown List Path.
		doc, err = db.Get(r.Context(), listDoc(cmp.Or(uid, "-"), path))
	}
	if errors.Is(err, firestore.ErrNotFound) || (err == nil && (uid == "" || !fieldBool(doc.Fields, "published"))) {
		err = errLocked
	}
	return uid, doc, err
}

func fieldString(fields map[string]firestore.Value, name string) string {
	if v := fields[name].StringValue; v != nil {
		return *v
	}
	return ""
}

func fieldBool(fields map[string]firestore.Value, name string) bool {
	v := fields[name].BooleanValue
	return v != nil && *v
}

func fieldStrings(fields map[string]firestore.Value, name string) []string {
	out := []string{}
	if v := fields[name].ArrayValue; v != nil {
		for _, item := range v.Values {
			if item.StringValue != nil {
				out = append(out, *item.StringValue)
			}
		}
	}
	return out
}

// unlockList checks the List Password and returns a token for 24 hours. Guesses are limited per IP and per List,
// counted before hashing and for links that lead nowhere too. Bare /{username} links come here with no List Path.
func unlockList(db *firestore.Client, secret []byte) http.HandlerFunc {
	perIP := newRateLimiter(10, 15*time.Minute)
	perList := newKeyLimiter(20, time.Hour)
	return func(w http.ResponseWriter, r *http.Request) {
		username, path := strings.ToLower(r.PathValue("username")), strings.ToLower(r.PathValue("listPath"))
		now := time.Now()
		// Per List only once the IP is allowed, so one IP can't fill the per-List counter with made-up links.
		if !perIP.allow(clientKey(r), now) || !perList.allow(username+"/"+path, now) {
			writeError(w, http.StatusTooManyRequests, "too many requests")
			return
		}
		var body struct{ Password string }
		if json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<10)).Decode(&body) != nil {
			writeError(w, http.StatusBadRequest, "invalid body")
			return
		}

		_, doc, err := publishedList(r, db, username, path)
		if err != nil && !errors.Is(err, errLocked) {
			log.Printf("list unlock failed: %v", err)
			writeError(w, http.StatusBadGateway, "could not open list")
			return
		}
		salt := fieldString(doc.Fields, "salt")
		if err != nil {
			salt = "dummy salt so timing matches" // a missing or offline List still costs one hash
		}
		hash := hashListPassword(body.Password, salt)
		if err != nil || subtle.ConstantTimeCompare([]byte(hash), []byte(fieldString(doc.Fields, "passwordHash"))) != 1 {
			writeLocked(w)
			return
		}
		token := signToken(secret, visitorToken{username, path, salt, now.Add(visitorTokenLife).Unix()})
		writeJSON(w, http.StatusOK, map[string]string{"token": token})
	}
}

// visitorPost is what a Visitor sees of a Post.
type visitorPost struct {
	URL          string   `json:"url"`
	Title        string   `json:"title"`
	Author       string   `json:"author"`
	Tags         []string `json:"tags"`
	ThumbnailURL string   `json:"thumbnailUrl,omitempty"`
	Timestamp    int64    `json:"timestamp"`
}

// getPublishedList returns the List name and its Posts (any of its Tags), newest first, for a valid token.
func getPublishedList(db *firestore.Client, secret []byte) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		username, path := strings.ToLower(r.PathValue("username")), strings.ToLower(r.PathValue("listPath"))
		raw, _ := strings.CutPrefix(r.Header.Get("Authorization"), "Bearer ")
		token, ok := readToken(secret, raw, time.Now())
		if !ok || token.Username != username || token.ListPath != path {
			writeLocked(w)
			return
		}
		// shortcut: no cache, 3 Firestore reads per view; add a 60-second in-memory cache keyed on Username + List Path
		// if reads approach the free quota.
		uid, doc, err := publishedList(r, db, username, path)
		if errors.Is(err, errLocked) || (err == nil && fieldString(doc.Fields, "salt") != token.Salt) {
			writeLocked(w)
			return
		}
		var postDocs []firestore.Document
		if err == nil {
			// Not a List: the top-level `lists` collection holds all of a user's Posts, one document per user.
			// The lowest id wins over duplicates.
			postDocs, err = db.Query(r.Context(), "", "lists", &firestore.Where{Field: "userId", Value: firestore.Value{StringValue: &uid}}, 1)
		}
		if err != nil {
			log.Printf("published list read failed: %v", err)
			writeError(w, http.StatusBadGateway, "could not open list")
			return
		}

		tags := fieldStrings(doc.Fields, "tags")
		posts := []visitorPost{}
		if len(postDocs) > 0 && postDocs[0].Fields["posts"].ArrayValue != nil {
			for _, item := range postDocs[0].Fields["posts"].ArrayValue.Values {
				if item.MapValue == nil {
					continue
				}
				f := item.MapValue.Fields
				p := visitorPost{fieldString(f, "url"), fieldString(f, "title"), fieldString(f, "author"), fieldStrings(f, "tags"), fieldString(f, "thumbnailUrl"), timestampOf(f["timestamp"])}
				if slices.ContainsFunc(p.Tags, func(tag string) bool { return slices.Contains(tags, tag) }) {
					posts = append(posts, p)
				}
			}
		}
		slices.SortStableFunc(posts, func(a, b visitorPost) int { return cmp.Compare(b.Timestamp, a.Timestamp) })
		writeJSON(w, http.StatusOK, map[string]any{"name": fieldString(doc.Fields, "name"), "posts": posts})
	}
}

// timestampOf reads the app's Date.now() milliseconds, which the Firestore SDK stores as an integer or a double.
func timestampOf(v firestore.Value) int64 {
	if v.IntegerValue != nil {
		n, _ := strconv.ParseInt(*v.IntegerValue, 10, 64)
		return n
	}
	if v.DoubleValue != nil {
		return int64(*v.DoubleValue)
	}
	return 0
}
