## Context snapshot

Repo: `/media/lucchuong/SSD1/DOANTOTNGHIEP/backend`

### Services (observed)

- `**user-service` (Spring Boot, Java 21)**
  - MongoDB persistence
  - Redis for JWT blacklist
  - Auth endpoints: register/login/introspect/logout/refresh
  - RBAC scaffolding: roles + permissions + seeded admin via Mongock
  - Security: OAuth2 resource server using a custom `JwtDecoder` that introspects tokens
- `**api-gateway` (Spring Cloud Gateway)**
  - Route `/user/`** → `USER_SERVICE_URI`
  - Has an `AuthenticationFilter` calling user-service introspection
  - **Important**: enforcement is not implemented yet (introspection result does not block traffic)
- `**notification-service` (Go)**
  - Folder and config exist
  - `cmd/server/main.go` is empty → not runnable yet

### Dev tools

- `Makefile` supports `make run user|gateway` and compose helpers.
- `.env.example` exists; `.env` changed locally.
- GitHub Actions workflows exist (not fully reviewed here).

## Current progress (high level)

- **Auth in user-service**: mostly implemented (JWT HS512 + introspect + refresh + logout + redis blacklist).
- **RBAC endpoints**: role/permission controllers exist + initial seed.
- **Gateway**: routing works, but security gate is incomplete.
- **Notification**: not implemented.

## Key issues / gaps to resolve next

- **Gateway security is ineffective**
  - `AuthenticationFilter` uses `subscribe` and always forwards.
  - Public endpoint bypass list is incomplete and hard-coded.
  - Token value is logged (sensitive).
- **User-service correctness risks**
  - `@PreAuthorize` parameter mismatch in `UserController.getUser`.
  - `updateUser` path variable vs service method mismatch (id vs email).
- **JWT duration unit inconsistency**
  - Token generation uses minutes; refresh verification uses seconds.
- **Monorepo build wiring unclear**
  - Root `pom.xml` only includes `user-service` as module; gateway not included.

## Next plan (phases)

### Phase 1 — Gateway auth enforcement

File: `plans/2026-03-18-21-53-phase-1-gateway-auth-enforcement.md`

Focus:

- Enforce introspection result and block unauthorized requests at gateway.
- Define public endpoint allowlist.
- Remove token logging; add timeouts/error handling.

### Phase 2 — User-service auth & RBAC hardening

File: `plans/2026-03-18-21-53-phase-2-user-service-auth-and-rbac-hardening.md`

Focus:

- Fix controller/service mismatches (id vs email).
- Fix authorization expressions.
- Standardize JWT duration units.
- Add minimal tests.

### Phase 3 — Notification service MVP

File: `plans/2026-03-18-21-53-phase-3-notification-service-mvp.md`

Focus:

- Implement runnable Go notification service (start with HTTP API).
- Integrate at least one flow from user-service (stub is acceptable first).

### Phase 4 — Infra, DevX & CI alignment

File: `plans/2026-03-18-21-53-phase-4-infra-devx-and-ci.md`

Focus:

- Document local setup and env vars.
- Ensure docker compose runs the full stack.
- Align CI to run build/tests consistently.

## Suggested execution order

- **Do Phase 1 first** (security baseline).
- **Then Phase 2** (correctness + testability).
- **Then Phase 3** (enable OTP/email features).
- **Finally Phase 4** (make it easy to run and maintain).

