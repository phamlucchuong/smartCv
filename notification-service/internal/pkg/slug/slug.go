package slug

import (
	"fmt"
	"regexp"
	"strings"
	"unicode"

	"golang.org/x/text/runes"
	"golang.org/x/text/transform"
	"golang.org/x/text/unicode/norm"
)

// Vietnamese-specific character replacements that unicode normalization doesn't handle.
var vietnameseReplacer = strings.NewReplacer(
	"đ", "d", "Đ", "d",
)

var (
	nonAlphanumRegex    = regexp.MustCompile(`[^a-z0-9]+`)
	multipleHyphenRegex = regexp.MustCompile(`-{2,}`)
)

// Generate creates a URL-friendly slug from a Vietnamese product name.
// Transliterates diacritics to ASCII, lowercases, replaces non-alphanumeric with hyphens.
func Generate(name string) string {
	s := strings.ToLower(strings.TrimSpace(name))

	// Replace Vietnamese-specific chars before normalization
	s = vietnameseReplacer.Replace(s)

	// NFD decomposition strips combining diacritical marks (e.g., ă → a + combining breve → a)
	t := transform.Chain(norm.NFD, runes.Remove(runes.In(unicode.Mn)), norm.NFC)
	result, _, err := transform.String(t, s)
	if err != nil {
		result = s
	}

	// Replace non-alphanumeric sequences with single hyphen
	result = nonAlphanumRegex.ReplaceAllString(result, "-")
	result = multipleHyphenRegex.ReplaceAllString(result, "-")
	result = strings.Trim(result, "-")

	return result
}

// GenerateUnique creates a unique slug by appending -2, -3, etc. if the base slug already exists.
// existsFn should return true if the given slug is already taken.
// Returns error if unable to find unique slug after 1000 attempts.
func GenerateUnique(name string, existsFn func(string) bool) (string, error) {
	base := Generate(name)
	if base == "" {
		base = "product"
	}

	if !existsFn(base) {
		return base, nil
	}

	for i := 2; i <= 1000; i++ {
		candidate := fmt.Sprintf("%s-%d", base, i)
		if !existsFn(candidate) {
			return candidate, nil
		}
	}

	return "", fmt.Errorf("unable to generate unique slug for %q after 1000 attempts", name)
}
