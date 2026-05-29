## Phase 3 — Notification service MVP

### Objective

Implement a runnable `notification-service` MVP to support user-facing flows that require messaging (OTP/email) and establish the integration contract with `user-service`.

## Current state (observed)

- `notification-service/cmd/server/main.go` is empty (no server yet).
- No clear API/queue contract exists in repo at the moment.

## Scope options

### Option A — HTTP API (fastest to deliver)

- Implement a small HTTP server with:
  - `POST /health`
  - `POST /notifications/email`
  - `POST /notifications/otp`
- `user-service` calls notification-service via HTTP when needed.

### Option B — Async via message broker (more scalable)

- Use RabbitMQ/Kafka/NATS.
- `user-service` publishes events; notification-service consumes.

Recommendation for next iteration:
- Start with **Option A** for speed, then evolve to async later if needed.

## Deliverables

- A runnable Go server:
  - Config via env (port, smtp settings, provider keys)
  - Structured logging
  - Basic request validation
- Docker support:
  - Add to `docker-compose.dev.yaml` (and optionally prod compose)
- Integration contract:
  - Define request/response JSON schema
  - Define retry / timeout expectations

## Implementation plan (Option A)

### 1. Service skeleton

- Create:
  - `cmd/server/main.go` with entrypoint + graceful shutdown
  - `config/config.go` (already exists) to load env
  - `internal/http` handlers + router

### 2. Endpoints

- `GET /health` → 200 OK
- `POST /notifications/email`
  - payload: `{ "to": "...", "subject": "...", "body": "..." }`
  - response: `{ "messageId": "...", "status": "queued|sent" }`
- `POST /notifications/otp`
  - payload: `{ "to": "...", "channel": "email|sms", "otp": "...", "ttlSeconds": 300 }`

### 3. Provider integration (incremental)

- Phase 3.1: log-only / stub send (so frontend/dev can proceed)
- Phase 3.2: SMTP provider (e.g. Gmail SMTP / SendGrid)
- Phase 3.3: rate limit + template support

### 4. User-service integration points

- Decide which flows need notifications:
  - verify email / forgot password / OTP login
- Add `NotificationClient` in user-service and call it:
  - timeout 1–3s
  - best-effort with retries if needed

## Acceptance criteria

- notification-service runs locally via docker compose and responds on `/health`.
- Request validation and predictable responses exist for email/otp endpoints.
- user-service can call notification-service in at least one flow (even stubbed).

