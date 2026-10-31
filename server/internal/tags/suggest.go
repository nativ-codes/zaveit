// Package tags produces Suggested Tags for a Post.
package tags

import (
	"context"
	"slices"
	"strings"

	"zaveit/server/internal/deepseek"
)

const (
	MaxTitleLen = 500
	maxTags     = 3
)

// Keep in sync with mobile/common/constants/tags.ts. Drift is harmless: the app
// treats any tag outside its own list as an Additional Tag.
var mainTags = []string{
	"technology", "science", "art", "music", "sports", "food", "travel",
	"health", "fitness", "education", "business", "finance", "nature",
	"animals", "history", "culture", "politics", "entertainment", "fashion",
	"beauty", "gaming", "books", "movies", "photography", "architecture",
	"design", "cars", "space", "weather", "environment", "other",
}

var systemPrompt = "Generate 3 relevant one-word english tags, for this content. " +
	"Make sure to include at least one tag from the following list: " +
	strings.Join(mainTags, ", ") +
	". Return only comma-separated tags, no other text."

// Suggest asks the model for Suggested Tags for a Post title.
func Suggest(ctx context.Context, ai deepseek.Client, title string) ([]string, error) {
	reply, err := ai.Complete(ctx, systemPrompt, truncate(title, MaxTitleLen))
	if err != nil {
		return nil, err
	}
	return parse(reply), nil
}

// The model is free to ignore the prompt, so its output is normalized here.
func parse(text string) []string {
	tags := make([]string, 0, maxTags)
	for _, tag := range strings.Split(text, ",") {
		tag = strings.ToLower(strings.TrimSpace(tag))
		if tag != "" && !slices.Contains(tags, tag) && len(tags) < maxTags {
			tags = append(tags, tag)
		}
	}
	return tags
}

func truncate(text string, limit int) string {
	runes := []rune(text)
	if len(runes) > limit {
		return string(runes[:limit])
	}
	return text
}
