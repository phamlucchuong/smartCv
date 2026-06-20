package server

import (
	"net/http"
	"strings"

	"github.com/labstack/echo/v5"
	"smartCv/notification-service/internal/pkg"
)

// authMiddleware reads the forwarded identity headers set by the API Gateway
// (X-User-Id, X-Role) and stores user_id and audience in the Echo context.
func authMiddleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c *echo.Context) error {
			userID := c.Request().Header.Get("X-User-Id")
			if userID == "" {
				return pkg.JSONError(c, http.StatusUnauthorized, pkg.CodeUnauthorized, "unauthorized")
			}

			role := c.Request().Header.Get("X-Role")
			c.Set("user_id", userID)
			c.Set("audience", audienceFromRole(role))
			return next(c)
		}
	}
}

// audienceFromRole maps the gateway-forwarded X-Role value to an FCM audience string.
// RECRUITER → web-vendor, ADMIN → web-admin, anything else → web-user.
func audienceFromRole(role string) string {
	switch strings.ToUpper(role) {
	case "RECRUITER":
		return "web-vendor"
	case "ADMIN":
		return "web-admin"
	default:
		return "web-user"
	}
}
