package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"zaveit/server/internal/api"
	"zaveit/server/internal/appcheck"
	"zaveit/server/internal/deepseek"
	"zaveit/server/internal/firestore"
	"zaveit/server/internal/idtoken"
	"zaveit/server/internal/r2"
)

func getenv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func mustGetenv(key string) string {
	value := os.Getenv(key)
	if value == "" {
		log.Fatal(key + " is required")
	}
	return value
}

func main() {
	ai := deepseek.Client{
		BaseURL: getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com"),
		Model:   getenv("DEEPSEEK_MODEL", "deepseek-chat"),
		APIKey:  mustGetenv("DEEPSEEK_API_KEY"),
	}

	check := api.SourcesCheck{Token: os.Getenv("SOURCES_CHECK_TOKEN")}
	verifier := appcheck.New(mustGetenv("FIREBASE_PROJECT_NUMBER"))
	users := idtoken.New(mustGetenv("FIREBASE_PROJECT_ID"))
	store := r2.Client{
		Endpoint:        mustGetenv("S3_URL"),
		Bucket:          getenv("S3_BUCKET", "zaveit-r2"),
		AccessKeyID:     mustGetenv("S3_ACCESS_KEY_ID"),
		SecretAccessKey: mustGetenv("S3_SECRET_ACCESS_KEY"),
	}

	db, err := firestore.New(mustGetenv("FIREBASE_SERVICE_ACCOUNT_KEY_FILE"))
	if err != nil {
		log.Fatal(err)
	}

	server := &http.Server{
		Addr:              ":" + getenv("PORT", "8080"),
		Handler:           api.NewRouter(ai, os.Getenv("LOG_TAG_DETAILS") == "true", check, verifier.Verify, users.Verify, store, db, mustGetenv("VISITOR_TOKEN_SECRET")),
		ReadHeaderTimeout: 5 * time.Second,
	}

	log.Printf("listening on %s", server.Addr)
	log.Fatal(server.ListenAndServe())
}
