// Package deepseek talks to the DeepSeek API.
package deepseek

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

var httpClient = &http.Client{Timeout: 10 * time.Second}

type Client struct {
	BaseURL, Model, APIKey string
}

type message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// Complete sends a prompt to the model and returns its reply, which is empty if
// the model gave no answer.
func (c Client) Complete(ctx context.Context, system, user string) (string, error) {
	body, err := json.Marshal(map[string]any{
		"model":       c.Model,
		"stream":      false,
		"temperature": 1,
		"messages": []message{
			{Role: "system", Content: system},
			{Role: "user", Content: user},
		},
	})
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.BaseURL+"/chat/completions", bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.APIKey)

	res, err := httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return "", fmt.Errorf("deepseek returned %s", res.Status)
	}

	var completion struct {
		Choices []struct {
			Message message `json:"message"`
		} `json:"choices"`
	}
	if err := json.NewDecoder(res.Body).Decode(&completion); err != nil {
		return "", err
	}
	if len(completion.Choices) == 0 {
		return "", nil
	}

	return completion.Choices[0].Message.Content, nil
}
