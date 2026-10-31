package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"zaveit/server/internal/api"
	"zaveit/server/internal/appcheck"
	"zaveit/server/internal/deepseek"
)

func getenv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func main() {
	apiKey := os.Getenv("DEEPSEEK_API_KEY")
	if apiKey == "" {
		log.Fatal("DEEPSEEK_API_KEY is required")
	}

	projectNumber := os.Getenv("FIREBASE_PROJECT_NUMBER")
	if projectNumber == "" {
		log.Fatal("FIREBASE_PROJECT_NUMBER is required")
	}

	ai := deepseek.Client{
		BaseURL: getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com"),
		Model:   getenv("DEEPSEEK_MODEL", "deepseek-chat"),
		APIKey:  apiKey,
	}

	check := api.SourcesCheck{Token: os.Getenv("SOURCES_CHECK_TOKEN")}
	verifier := appcheck.New(projectNumber)

	server := &http.Server{
		Addr:              ":" + getenv("PORT", "8080"),
		Handler:           api.NewRouter(ai, os.Getenv("LOG_TAG_DETAILS") == "true", check, verifier.Verify),
		ReadHeaderTimeout: 5 * time.Second,
	}

	log.Printf("listening on %s", server.Addr)
	log.Fatal(server.ListenAndServe())
}
