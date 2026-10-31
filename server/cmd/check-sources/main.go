// Command check-sources runs the links.txt check and prints only the links that
// didn't pass. It exits 1 if any link failed, the same condition as a 503 from
// GET /health/sources.
package main

import (
	"context"
	"fmt"
	"os"

	"zaveit/server/internal/sources"
)

func main() {
	report := sources.Check(context.Background(), sources.Links())

	passed := 0
	for _, link := range report.Links {
		if link.Status == sources.StatusOK {
			passed++
			continue
		}
		fmt.Printf("%-7s %s\n        %s\n", link.Status, link.URL, link.Error)
	}
	fmt.Printf("%d/%d links passed, status: %s\n", passed, len(report.Links), report.Status)

	if report.Status == sources.StatusFailed {
		os.Exit(1)
	}
}
