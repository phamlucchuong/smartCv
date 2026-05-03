# Copilot instructions for `notification-service`

## Build, test, and lint commands

Run from `notification-service/`:

```bash
# Run all tests (also catches compile issues across packages)
go test ./...

# Run a single test function
go test ./internal/notification -run '^TestName$' -count=1

# Build all packages
go build ./...

# Lint-style static checks used in this repo (no dedicated golangci config is present)
go vet ./...

# Run the service
go run ./cmd/server
```

Current baseline in this repository state: `go test ./...`, `go build ./...`, and `go vet ./...` fail due unresolved references in `cmd/server/main.go` and `internal/notification/handler.go`.

## High-level architecture

- Entry point is `cmd/server/main.go`: load config, initialize logger, connect Postgres (GORM) and Redis, then start Echo server.
- `internal/server` owns HTTP server wiring (`Server`, validator setup, and routes). Current `setupRoutes()` only exposes `/health`.
- Domain packages follow handler/service/repository layering:
  - `internal/notification`: persistent notifications + FCM token management + Firebase (Messaging/Auth/Firestore) integrations.
  - `internal/email`: SMTP sender implementation with embedded HTML templates in `internal/platform/email/templates/`.
  - `internal/sms`: currently placeholder package.
- Persistence uses GORM models/repositories in domain packages and Postgres connection setup in `internal/platform/db`.
- Shared HTTP response envelope and API error codes live in `internal/pkg/response.go`.
- SQL migrations are expected via `golang-migrate` (see db comment in `internal/platform/db/gorm.go`) with files under `migrations/`.

## Key conventions

- Handlers use Echo v5 pointer context signatures (`func(c *echo.Context) error`) consistently.
- API responses should use `internal/pkg` helpers (`JSONOK`, `JSONCreated`, `JSONList`, `JSONError`) instead of ad-hoc JSON.
- Notification read/history queries are always scoped by both `user_id` and `recipient_role` (role-aware inbox behavior).
- Audience/role mapping is part of notification behavior:
  - audience values like `web-user`, `web-vendor`, `web-admin`
  - persisted recipient roles like `USER`, `VENDOR`, `ADMIN`
- FCM token persistence is upserted on `(token, audience)` uniqueness (`SaveFCMToken` with `OnConflict`) so one token can be reassigned by user/audience updates.
- UUID parsing/validation is done at service boundaries before repository calls (repositories generally take typed UUIDs, not raw strings).
- Configuration is loaded through Viper from env + `././.env`; keep new config fields in `internal/config/config.go` with `mapstructure` tags and defaults.
