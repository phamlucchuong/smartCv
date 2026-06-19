package server

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestAudienceFromRole(t *testing.T) {
	tests := []struct {
		role     string
		expected string
	}{
		{"RECRUITER", "web-vendor"},
		{"recruiter", "web-vendor"},
		{"Recruiter", "web-vendor"},
		{"ADMIN", "web-admin"},
		{"admin", "web-admin"},
		{"CANDIDATE", "web-user"},
		{"candidate", "web-user"},
		{"", "web-user"},
		{"UNKNOWN", "web-user"},
	}
	for _, tt := range tests {
		t.Run(tt.role, func(t *testing.T) {
			assert.Equal(t, tt.expected, audienceFromRole(tt.role))
		})
	}
}

// TestAudienceFromRole_CaseInsensitive is an explicit contract: role header values
// may arrive in any case from the gateway.
func TestAudienceFromRole_CaseInsensitive(t *testing.T) {
	roles := []string{"RECRUITER", "recruiter", "Recruiter", "rEcRuItEr"}
	for _, r := range roles {
		assert.Equal(t, "web-vendor", audienceFromRole(strings.ToUpper(r)),
			"should match web-vendor for any casing of RECRUITER")
	}
}
