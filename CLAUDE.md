# CLAUDE.md

SmartCV monorepo. Backend (Java/Go microservices) lives under `backend/`; frontend (pnpm workspace, React) lives under `frontend/`.

## Repository layout

```
backend/   — Spring Boot services, API Gateway, Notification Service (Go), Docker Compose
frontend/  — pnpm monorepo: web-candidate, web-recruiter, web-admin + shared packages
```

For service-specific commands, patterns, and architecture details see:
- `backend/CLAUDE.md`
- `frontend/CLAUDE.md`

## Quick start

```bash
# Infrastructure (MongoDB, Redis, RabbitMQ, Elasticsearch)
make compose-up

# Backend services
make run-user          # port 8081
make run-gateway       # port 8080
make run-job           # port 8082
make run-noti          # port 8084

# Frontend (from repo root)
make fe-dev            # all apps in parallel
make fe-dev-candidate  # web-candidate only (port 3000)

# Run all tests
make test
```

## Commit rules

- Write commit messages in English.
- Do **not** add "Claude" or any AI tool name to commit messages.
- Use Conventional Commits: `feat(scope):`, `fix(scope):`, `refactor:`, `docs:`, `chore:`.
- Keep each commit scoped to one service or package.

## Plan files

- Always write plan content in English.
- File naming pattern: `YYYYMMDD-HHmm-<short-scope>.md`
- Place under `backend/plans/` (backend concerns) or `frontend/docs/` (frontend concerns).
