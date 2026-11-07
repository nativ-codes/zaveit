package firestoretest

import (
	"io"
	"net/http"
	"strings"
	"testing"
)

const docs = "/v1/projects/p/databases/(default)/documents"

func post(t *testing.T, url, body string) (int, string) {
	t.Helper()
	res, err := http.Post(url, "application/json", strings.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	raw, _ := io.ReadAll(res.Body)
	return res.StatusCode, string(raw)
}

func TestCommitIsAllOrNothingAndHonoursPreconditions(t *testing.T) {
	s := New(t)
	s.Put("usernames/taken", map[string]any{"uid": map[string]any{"stringValue": "u1"}})
	name := "projects/p/databases/(default)/documents/usernames/"

	code, body := post(t, s.URL+docs+":commit", `{"writes":[
		{"update":{"name":"`+name+`new","fields":{}}},
		{"update":{"name":"`+name+`taken","fields":{}},"currentDocument":{"exists":false}}]}`)
	if code != http.StatusConflict || !strings.Contains(body, `"status":"ALREADY_EXISTS"`) {
		t.Errorf("got %d %s", code, body)
	}
	if _, ok := s.Doc("usernames/new"); ok {
		t.Error("the write before the failed precondition was applied")
	}

	code, body = post(t, s.URL+docs+":commit", `{"writes":[{"delete":"`+name+`gone","currentDocument":{"exists":true}}]}`)
	if code != http.StatusNotFound || !strings.Contains(body, `"status":"NOT_FOUND"`) {
		t.Errorf("got %d %s", code, body)
	}

	code, _ = post(t, s.URL+docs+":commit", `{"writes":[
		{"delete":"`+name+`taken","currentDocument":{"exists":true}},
		{"update":{"name":"`+name+`taken","fields":{"uid":{"stringValue":"u2"}}},"currentDocument":{"exists":false}}]}`)
	if fields, _ := s.Doc("usernames/taken"); code != http.StatusOK || fields["uid"].(map[string]any)["stringValue"] != "u2" {
		t.Errorf("writes should apply in order, got %d %v", code, fields)
	}
}

func TestRunQueryFiltersOrdersAndLimits(t *testing.T) {
	s := New(t)
	u1 := map[string]any{"userId": map[string]any{"stringValue": "u1"}}
	s.Put("lists/b", u1)
	s.Put("lists/a", map[string]any{"userId": map[string]any{"stringValue": "u2"}})
	s.Put("lists/c", u1)
	s.Put("users/u1/lists/x", u1)

	query := `{"structuredQuery":{"from":[{"collectionId":"lists"}],
		"where":{"fieldFilter":{"field":{"fieldPath":"userId"},"op":"EQUAL","value":{"stringValue":"u1"}}},
		"orderBy":[{"field":{"fieldPath":"__name__"},"direction":"ASCENDING"}],"limit":1}}`
	code, body := post(t, s.URL+docs+":runQuery", query)
	if code != http.StatusOK || !strings.Contains(body, "documents/lists/b") || strings.Contains(body, "lists/c") || strings.Contains(body, "lists/x") {
		t.Errorf("got %d %s", code, body)
	}

	code, body = post(t, s.URL+docs+"/users/u2:runQuery", strings.Replace(query, `"limit":1`, `"limit":10`, 1))
	if code != http.StatusOK || !strings.Contains(body, "readTime") || strings.Contains(body, "document") {
		t.Errorf("an empty result should be one readTime entry, got %d %s", code, body)
	}

	code, _ = post(t, s.URL+docs+":runQuery", `{"structuredQuery":{"from":[{"collectionId":"lists"}],"limit":1}}`)
	if code != http.StatusBadRequest {
		t.Errorf("a query without explicit __name__ order should be refused, got %d", code)
	}
}
