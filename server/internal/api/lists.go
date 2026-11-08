package api

import (
	"crypto/pbkdf2"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"slices"
	"strings"
	"time"
	"unicode/utf8"

	"zaveit/server/internal/firestore"
)

// Lists live at users/{uid}/lists/{listPath}. The top-level `lists` collection is something else: it holds all of
// a user's Posts and is not a List.

const (
	// Raise to 10 with subscriptions.
	maxLists = 2
	// OWASP's 2023 figure for PBKDF2-HMAC-SHA256. Cost on the VPS is untested.
	listPasswordIterations = 600_000
)

var (
	listNamePattern = regexp.MustCompile(`^[a-zA-Z0-9 -]{1,50}$`)
	listPathRuns    = regexp.MustCompile(`[ -]+`)
)

// listPath makes the List Path from a List name ("My Books" → "my-books"), false when either is invalid.
// A name is 1 to 50 of a-z, A-Z, 0-9, spaces and hyphens with a letter or digit; the path follows the Username rules.
func listPath(name string) (string, bool) {
	if !listNamePattern.MatchString(name) {
		return "", false
	}
	path := strings.Trim(listPathRuns.ReplaceAllString(strings.ToLower(name), "-"), "-")
	if !validListPath(path) {
		return "", false
	}
	return path, true
}

// validListPassword: 3 to 128 characters (code points, as the app counts), no other rules.
func validListPassword(password string) bool {
	n := utf8.RuneCountInString(password)
	return n >= 3 && n <= 128
}

const listPasswordMessage = "the list password needs 3 to 128 characters"

// validTags: at least one, none empty.
func validTags(tags []string) bool {
	return len(tags) > 0 && !slices.Contains(tags, "")
}

const tagsMessage = "pick at least one tag"

func listDoc(uid, listPath string) string {
	return "users/" + uid + "/lists/" + listPath
}

// newListSalt is a List's random salt, base64 as stored. A new List Password gets a new one; a rename keeps it.
func newListSalt() string {
	salt := make([]byte, 16)
	rand.Read(salt)
	return base64.StdEncoding.EncodeToString(salt)
}

// hashListPassword is the stored PBKDF2-SHA256 hash, base64, of a List Password with that List's salt.
// Compare hashes with crypto/subtle.ConstantTimeCompare.
func hashListPassword(password, salt string) string {
	key, err := pbkdf2.Key(sha256.New, password, []byte(salt), listPasswordIterations, 32)
	if err != nil {
		panic(err) // only for out-of-range parameters, which are constants here
	}
	return base64.StdEncoding.EncodeToString(key)
}

// list is a List as the app sees it, never with the hash or salt.
type list struct {
	ListPath  string   `json:"listPath"`
	Name      string   `json:"name"`
	Tags      []string `json:"tags"`
	Published bool     `json:"published"`
}

func listFrom(doc firestore.Document) list {
	return list{
		ListPath:  doc.Path[strings.LastIndex(doc.Path, "/")+1:],
		Name:      fieldString(doc.Fields, "name"),
		Tags:      fieldStrings(doc.Fields, "tags"),
		Published: fieldBool(doc.Fields, "published"),
	}
}

// userLists reads up to limit of the user's Lists, ordered by List Path.
func userLists(r *http.Request, db *firestore.Client, uid string, limit int) ([]list, error) {
	docs, err := db.Query(r.Context(), "users/"+uid, "lists", nil, limit)
	lists := []list{}
	for _, doc := range docs {
		lists = append(lists, listFrom(doc))
	}
	return lists, err
}

func tagsValue(tags []string) firestore.Value {
	values := make([]firestore.Value, len(tags))
	for i := range tags {
		values[i] = firestore.Value{StringValue: &tags[i]}
	}
	return firestore.Value{ArrayValue: &struct {
		Values []firestore.Value `json:"values,omitempty"`
	}{values}}
}

// createList makes a List for a user with a Username, at the List Path made from its name. Wrap it in requireUser.
func createList(db *firestore.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Name      string
			Tags      []string
			Password  string
			Published bool
		}
		if json.NewDecoder(http.MaxBytesReader(w, r.Body, 16<<10)).Decode(&body) != nil {
			writeError(w, http.StatusBadRequest, "invalid body")
			return
		}
		name := strings.TrimSpace(body.Name)
		path, ok := listPath(name)
		if !ok {
			writeError(w, http.StatusBadRequest, "invalid list name")
			return
		}
		if !validTags(body.Tags) {
			writeError(w, http.StatusBadRequest, tagsMessage)
			return
		}
		if !validListPassword(body.Password) {
			writeError(w, http.StatusBadRequest, listPasswordMessage)
			return
		}

		uid := userID(r)
		username, err := usernameOf(r, db, uid)
		if err == nil && username == "" {
			writeError(w, http.StatusForbidden, "claim a username first")
			return
		}
		var existing []list
		if err == nil {
			existing, err = userLists(r, db, uid, maxLists)
		}
		// shortcut: two creates at the same moment can both pass this count and make maxLists+1 Lists; accepted, add a
		// counter document to the commit if that ever matters.
		if err == nil && len(existing) >= maxLists {
			writeError(w, http.StatusForbidden, fmt.Sprintf("you already have %d lists", maxLists))
			return
		}

		salt := newListSalt()
		hash := hashListPassword(body.Password, salt)
		now := time.Now().UTC().Format(time.RFC3339Nano)
		fields := map[string]firestore.Value{
			"name":         {StringValue: &name},
			"tags":         tagsValue(body.Tags),
			"published":    {BooleanValue: &body.Published},
			"passwordHash": {StringValue: &hash},
			"salt":         {StringValue: &salt},
			"createdAt":    {TimestampValue: &now},
			"updatedAt":    {TimestampValue: &now},
		}
		if err == nil {
			exists := false
			err = db.Commit(r.Context(), []firestore.Write{{Path: listDoc(uid, path), Fields: fields, Exists: &exists}})
		}
		switch {
		case errors.Is(err, firestore.ErrPrecondition):
			writeError(w, http.StatusConflict, "you already have a list with this link")
		case err != nil:
			log.Printf("list create failed: %v", err)
			writeError(w, http.StatusBadGateway, "could not create list")
		default:
			writeJSON(w, http.StatusCreated, list{ListPath: path, Name: name, Tags: body.Tags, Published: body.Published})
		}
	}
}

// updateList changes only the fields sent: name, tags, published, password. A name whose List Path differs moves the
// List in one commit (old path freed at once, 409 on a clash) keeping its salt; only a new password gets a new salt.
func updateList(db *firestore.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Name      *string
			Tags      *[]string
			Published *bool
			Password  *string
		}
		if json.NewDecoder(http.MaxBytesReader(w, r.Body, 16<<10)).Decode(&body) != nil {
			writeError(w, http.StatusBadRequest, "invalid body")
			return
		}
		if !validListPath(r.PathValue("listPath")) {
			writeError(w, http.StatusNotFound, "no such list")
			return
		}
		oldPath := listDoc(userID(r), r.PathValue("listPath"))
		doc, err := db.Get(r.Context(), oldPath)
		if errors.Is(err, firestore.ErrNotFound) {
			writeError(w, http.StatusNotFound, "no such list")
			return
		}
		if err != nil {
			log.Printf("list read failed: %v", err)
			writeError(w, http.StatusBadGateway, "could not update list")
			return
		}

		fields := doc.Fields
		newPath := oldPath
		if body.Name != nil {
			name := strings.TrimSpace(*body.Name)
			path, ok := listPath(name)
			if !ok {
				writeError(w, http.StatusBadRequest, "invalid list name")
				return
			}
			fields["name"] = firestore.Value{StringValue: &name}
			newPath = listDoc(userID(r), path)
		}
		if body.Tags != nil {
			if !validTags(*body.Tags) {
				writeError(w, http.StatusBadRequest, tagsMessage)
				return
			}
			fields["tags"] = tagsValue(*body.Tags)
		}
		if body.Published != nil {
			fields["published"] = firestore.Value{BooleanValue: body.Published}
		}
		if body.Password != nil {
			if !validListPassword(*body.Password) {
				writeError(w, http.StatusBadRequest, listPasswordMessage)
				return
			}
			salt := newListSalt()
			hash := hashListPassword(*body.Password, salt)
			fields["salt"] = firestore.Value{StringValue: &salt}
			fields["passwordHash"] = firestore.Value{StringValue: &hash}
		}
		now := time.Now().UTC().Format(time.RFC3339Nano)
		fields["updatedAt"] = firestore.Value{TimestampValue: &now}

		yes, no := true, false
		writes := []firestore.Write{{Path: newPath, Fields: fields, Exists: &yes}}
		if newPath != oldPath {
			writes = []firestore.Write{{Path: oldPath, Delete: true, Exists: &yes}, {Path: newPath, Fields: fields, Exists: &no}}
		}
		err = db.Commit(r.Context(), writes)
		switch {
		case errors.Is(err, firestore.ErrPrecondition):
			writeError(w, http.StatusConflict, "you already have a list with this link")
		case err != nil:
			log.Printf("list update failed: %v", err)
			writeError(w, http.StatusBadGateway, "could not update list")
		default:
			writeJSON(w, http.StatusOK, listFrom(firestore.Document{Path: newPath, Fields: fields}))
		}
	}
}

// deleteList removes the List, freeing its List Path at once. A List already gone is 404.
func deleteList(db *firestore.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !validListPath(r.PathValue("listPath")) {
			writeError(w, http.StatusNotFound, "no such list")
			return
		}
		yes := true
		err := db.Commit(r.Context(), []firestore.Write{{Path: listDoc(userID(r), r.PathValue("listPath")), Delete: true, Exists: &yes}})
		switch {
		case errors.Is(err, firestore.ErrPrecondition):
			writeError(w, http.StatusNotFound, "no such list")
		case err != nil:
			log.Printf("list delete failed: %v", err)
			writeError(w, http.StatusBadGateway, "could not delete list")
		default:
			w.WriteHeader(http.StatusNoContent)
		}
	}
}
