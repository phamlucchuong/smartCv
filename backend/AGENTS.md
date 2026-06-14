# Repository Guidelines

## Project Structure & Module Organization
This repository is a microservices backend for SmartCV.
- Java/Spring services: `api-gateway/`, `user-service/`, `job_service/`, `application_service/`, `ai_engine_service/`.
- Go service: `notification-service/` (`cmd/server`, `internal/*`, `migrations/*`).
- Shared ops/docs: `docker-compose.yaml`, `.env.example`, `Makefile`, `docs/`, `scripts/bootstrap.sh`.
- Tests are colocated with code:
  - Java: `src/test/java/...`
  - Go: `*_test.go` (for example `notification-service/internal/otp/service_test.go`).

## Build, Test, and Development Commands
Run from repository root unless noted.
- `make test`: run all service tests (Java + Go).
- `make test-user|test-gateway|test-job|test-application|test-noti`: run tests for a single service.
- `make run-user|run-gateway|run-job|run-application|run-noti`: start one service locally.
- `make compose-up` / `make compose-down`: start/stop local infrastructure with Docker Compose.
- `bash scripts/bootstrap.sh`: bootstrap environment and dependencies quickly.

## Coding Style & Naming Conventions
- Java: follow Spring conventions, 4-space indentation, `PascalCase` classes, `camelCase` methods/fields, package paths under `vn.chuongpl.<service>`.
- Go: use standard Go formatting (`go fmt`/`gofmt`), keep packages in `internal/*` cohesive by domain (`otp`, `email`, `notification`).
- Keep DTO/request/response naming explicit (`*Request`, `*Response`, `ApiResponse`, `PageResponse`).
- Configuration belongs in `src/main/resources/application.yaml` (Java) or `internal/config` (Go).

## Testing Guidelines
- Primary frameworks: JUnit (Spring Boot tests) and Go `testing` package.
- CI runs `./mvnw test` per Java service and `go test ./... -v` for notification service.
- Test naming:
  - Java: `*Test.java` under matching package paths.
  - Go: `*_test.go` with focused unit tests by package.
- Add tests for new business logic, auth paths, and message/integration boundaries.

## Commit & Pull Request Guidelines
- Follow conventional-style prefixes seen in history: `feat(...)`, `fix(...)`, `refactor(...)`, `docs:`, `chore:`.
- Keep commits scoped to one service or concern.
- PRs should include:
  - clear summary and impacted services,
  - linked issue/plan file when applicable,
  - test evidence (command + result),
  - config/env changes called out explicitly.

## Plan Tracking
- When you finish executing a plan or a plan phase, update `plans/plan.md` with the latest progress, status changes, and any new gaps or completed items.
- Keep the update concise and in English so the summary stays aligned with the rest of the plan docs.

## Security & Configuration Tips
- Never commit secrets; use `.env` (copy from `.env.example`).
- Validate service-to-service URLs and ports before running integration flows.
- Prefer internal auth filters and gateway-enforced JWT flow for protected endpoints.
