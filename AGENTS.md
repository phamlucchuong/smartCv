# Repository Guidelines

## Project Structure

SmartCV is a full-stack monorepo.

```
backend/   — Java/Spring Boot microservices + Go notification service
  api-gateway/           port 8080
  user-service/          port 8081
  job_service/           port 8082
  application_service/   port 8083
  ai_engine_service/     port 8085
  notification-service/  port 8084  (Go)
  docker-compose.yaml
  Makefile

frontend/  — pnpm monorepo, Vite + React 19 + TypeScript
  apps/web-candidate/    port 3000
  apps/web-recruiter/    port 3001
  apps/web-admin/        port 3003
  packages/ui/
  packages/api/
  packages/i18n/
```

See `backend/AGENTS.md` and `frontend/AGENTS.md` for per-stack conventions.

## Build & Test Commands

```bash
# All tests
make test

# Individual backend services
make test-user | test-gateway | test-job | test-application | test-ai | test-noti

# Frontend quality
make fe-lint
make fe-build

# Infrastructure
make compose-up / compose-down
```

## Commit & PR Guidelines

- Conventional Commits: `feat(scope):`, `fix(scope):`, `refactor:`, `docs:`, `chore:`.
- Do **not** add AI tool names to commit messages.
- Scope to one service or package per commit.
- PRs must include: summary, impacted paths (`backend/` vs `frontend/`), test evidence.
- Call out any `.env` / config changes explicitly.

## Security

- Never commit secrets; use `.env` (from `.env.example`).
- Backend: gateway-enforced JWT; never bypass `AuthenticationFilter`.
- Frontend: auth headers live in `frontend/packages/api/src/axios-instance.ts`.
