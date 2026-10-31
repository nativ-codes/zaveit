package sources

import (
	"os"
	"reflect"
	"regexp"
	"slices"
	"strings"
	"testing"
)

const appRulesPath = "../../../mobile/screens/share-intent/share-intent.platforms.ts"

type syncedRule struct {
	Domains []string
	OEmbed  string
	Resolve bool
}

var (
	appRuleBlock = regexp.MustCompile(`(?s)platform: SocialPlatform\.\w+,(.*?)tools:`)
	appDomains   = regexp.MustCompile(`domains: \[([^\]]*)\]`)
	appOEmbed    = regexp.MustCompile(`oembedEndpoint: "([^"]*)"`)
	quoted       = regexp.MustCompile(`"([^"]+)"`)
)

func parseAppRules(t *testing.T) []syncedRule {
	t.Helper()
	source, err := os.ReadFile(appRulesPath)
	if err != nil {
		t.Fatal(err)
	}

	var rules []syncedRule
	for _, block := range appRuleBlock.FindAllStringSubmatch(string(source), -1) {
		domains := appDomains.FindStringSubmatch(block[1])
		oembed := appOEmbed.FindStringSubmatch(block[1])
		if domains == nil || oembed == nil {
			t.Fatalf("cannot parse app rule: %s", block[1])
		}

		rule := syncedRule{OEmbed: oembed[1], Resolve: strings.Contains(block[1], "resolveRedirects: true")}
		for _, domain := range quoted.FindAllStringSubmatch(domains[1], -1) {
			rule.Domains = append(rule.Domains, domain[1])
		}
		rules = append(rules, rule)
	}
	return rules
}

// Platforms with no oEmbed exist only here, to relax the picture check.
func TestPlatformRulesMatchTheApp(t *testing.T) {
	var server []syncedRule
	for _, p := range platforms {
		if p.oembed != "" {
			server = append(server, syncedRule{p.domains, p.oembed, p.resolve})
		}
	}

	app := parseAppRules(t)
	if len(app) == 0 {
		t.Fatal("found no app rules, so the parser is out of date")
	}

	byFirstDomain := func(a, b syncedRule) int { return strings.Compare(a.Domains[0], b.Domains[0]) }
	slices.SortFunc(app, byFirstDomain)
	slices.SortFunc(server, byFirstDomain)

	if !reflect.DeepEqual(app, server) {
		t.Errorf("platform rules differ\napp:    %+v\nserver: %+v", app, server)
	}
}
