package api

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"regexp"
	"strings"

	"zaveit/server/internal/firestore"
)

var usernamePattern = regexp.MustCompile(`^[a-z0-9]+(-[a-z0-9]+)*$`)

// Reserved Usernames count as taken; see the Username rules ticket.
var reservedUsernames = map[string]bool{
	"api": true, "v1": true, "health": true, "assets": true, "static": true, "app": true, "www": true,
	"admin": true, "support": true, "help": true, "about": true, "privacy": true, "terms": true, "legal": true,
	"login": true, "signup": true, "settings": true, "zaveit": true, "nativ": true, "nativcodes": true,
}

// validSlug is the format shared by Usernames and List Paths: 3 to 30 of a-z, 0-9 and single hyphens, no hyphen at
// either end.
func validSlug(s string) bool {
	return len(s) >= 3 && len(s) <= 30 && usernamePattern.MatchString(s)
}

// validUsername checks the format only; reserved names are checked separately.
func validUsername(name string) bool { return validSlug(name) }

// validListPath checks a List Path's format.
func validListPath(path string) bool { return validSlug(path) }

// usernameOf returns the signed-in user's Username, or "" when they have none.
func usernameOf(r *http.Request, db *firestore.Client, uid string) (string, error) {
	docs, err := db.Query(r.Context(), "", "usernames", &firestore.Where{Field: "uid", Value: firestore.Value{StringValue: &uid}}, 1)
	if err != nil || len(docs) == 0 {
		return "", err
	}
	return strings.TrimPrefix(docs[0].Path, "usernames/"), nil
}

// checkUsername is the availability check, the one accepted way to enumerate Usernames. Wrap it in requireUser.
func checkUsername(db *firestore.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		name := strings.ToLower(r.PathValue("username"))
		if !validUsername(name) {
			writeError(w, http.StatusBadRequest, "invalid username")
			return
		}
		available := !reservedUsernames[name]
		if available {
			_, err := db.Get(r.Context(), "usernames/"+name)
			if err != nil && !errors.Is(err, firestore.ErrNotFound) {
				log.Printf("username check failed: %v", err)
				writeError(w, http.StatusBadGateway, "could not check username")
				return
			}
			available = err != nil
		}
		writeJSON(w, http.StatusOK, map[string]bool{"available": available})
	}
}

// claimUsername creates usernames/{username} → {uid} for a user who has none. Wrap it in requireUser.
func claimUsername(db *firestore.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body struct{ Username string }
		if json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<10)).Decode(&body) != nil {
			writeError(w, http.StatusBadRequest, "invalid body")
			return
		}
		name := strings.ToLower(body.Username)
		if !validUsername(name) || reservedUsernames[name] {
			writeError(w, http.StatusBadRequest, "invalid username")
			return
		}
		uid := userID(r)
		// shortcut: one user claiming two names at the same moment could get both; the app sends one claim, add a
		// users/{uid} marker document to the commit if that ever matters.
		existing, err := usernameOf(r, db, uid)
		if err == nil && existing != "" {
			writeError(w, http.StatusConflict, "you already have a username")
			return
		}
		if err == nil {
			exists := false
			err = db.Commit(r.Context(), []firestore.Write{{
				Path: "usernames/" + name, Fields: map[string]firestore.Value{"uid": {StringValue: &uid}}, Exists: &exists,
			}})
		}
		switch {
		case errors.Is(err, firestore.ErrPrecondition):
			writeError(w, http.StatusConflict, "username is taken")
		case err != nil:
			log.Printf("username claim failed: %v", err)
			writeError(w, http.StatusBadGateway, "could not claim username")
		default:
			writeJSON(w, http.StatusCreated, map[string]string{"username": name})
		}
	}
}

// getLists returns the signed-in user's Username (null when none) and their Lists. Wrap it in requireUser.
func getLists(db *firestore.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		name, err := usernameOf(r, db, userID(r))
		if err != nil {
			log.Printf("lists read failed: %v", err)
			writeError(w, http.StatusBadGateway, "could not read lists")
			return
		}
		var username *string
		lists := []list{}
		if name != "" {
			username = &name
			// Well above maxLists: racing creates, or Lists made under an older higher limit, must still show.
			lists, err = userLists(r, db, userID(r), 100)
		}
		if err != nil {
			log.Printf("lists read failed: %v", err)
			writeError(w, http.StatusBadGateway, "could not read lists")
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"username": username, "lists": lists})
	}
}

// deleteUsername takes every List offline and frees the Username in one commit, before the app deletes the account.
// Wrap it in requireUser.
func deleteUsername(db *firestore.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		uid := userID(r)
		name, err := usernameOf(r, db, uid)
		var docs []firestore.Document
		if err == nil {
			// Far above maxLists, well under Firestore's 500 writes per commit.
			docs, err = db.Query(r.Context(), "users/"+uid, "lists", nil, 100)
		}
		var writes []firestore.Write
		for _, doc := range docs {
			writes = append(writes, firestore.Write{Path: doc.Path, Delete: true})
		}
		if name != "" {
			writes = append(writes, firestore.Write{Path: "usernames/" + name, Delete: true})
		}
		if err == nil && len(writes) > 0 {
			err = db.Commit(r.Context(), writes)
		}
		if err != nil {
			log.Printf("username delete failed: %v", err)
			writeError(w, http.StatusBadGateway, "could not delete username")
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}
}
