## Phase 4 — Infra, DevX & CI alignment

### Objective

Make local development and CI predictable for a multi-service repo: consistent env, consistent compose, and CI checks that reflect how the project is run.

## Observed items

- `.env` is modified and `.env.example` exists (good), but dev guidance is not documented.
- GitHub workflows exist for gateway and user-service.
- Root parent POM includes only `user-service` as a module; gateway is separate.
- `Makefile` provides common run/compose commands (good baseline).

## Deliverables

- **Documentation**
  - A clear “Local setup” doc: prerequisites, ports, env vars, startup order.
- **Environment**
  - Ensure `.env.example` includes all required vars:
    - Mongo: `DB_USERNAME/DB_PASSWORD/DB_PORT/DB_NAME`
    - Redis: `REDIS_HOST/REDIS_PORT/REDIS_PASSWORD`
    - JWT: `JWT_SIGNER_KEY`, duration vars (with documented units)
    - FE: `FE_DOMAIN`
    - Gateway: `USER_SERVICE_URI` (and identity base URL if separate)
- **Docker compose**
  - `docker-compose.dev.yaml` runs:
    - Mongo + Redis + user-service + api-gateway (+ notification-service when ready)
  - Healthchecks and dependency ordering (best effort).
- **CI**
  - Ensure workflows:
    - Build (mvn test / mvn verify) for Java services
    - Lint/test for Go when notification-service is enabled
    - Cache dependencies to speed builds
  - Decide: skipTests currently true in user-service pom; either keep but reflect in CI explicitly or remove for CI runs.

## Implementation plan

### 1. Normalize module strategy

Pick one:
- **Option A**: keep independent Maven projects per service (simpler; common in microservices)
  - Remove/ignore root parent POM or turn it into an aggregator including gateway.
- **Option B**: full multi-module Maven build
  - Add `api-gateway` module to root and align plugin/config versions.

### 2. Local dev workflow

- Document recommended commands:
  - `make compose-up-dev`
  - `make run user`
  - `make run gateway`
- Ensure default ports don’t conflict and match compose.

### 3. CI expectations

- CI should run tests (at least unit tests) on PRs.
- Add a “smoke build” job that ensures services compile.

## Acceptance criteria

- A new developer can start all services locally using documented steps in < 10 minutes.
- CI catches compilation/test failures reliably.

