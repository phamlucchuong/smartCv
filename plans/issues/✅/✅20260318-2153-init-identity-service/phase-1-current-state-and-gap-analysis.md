## Goal

Provide a clear snapshot of current backend progress (services, auth, data stores, dev tooling) and identify the main gaps/blockers to unlock the next feature iterations.

## Current structure (observed)

- **Root Maven**: `pom.xml` is a parent POM but currently only includes `user-service` as a module (gateway is not included).
- **Services**
  - **`user-service` (Spring Boot 3.4.4 / Java 21)**:
    - MongoDB persistence (`spring-boot-starter-data-mongodb`)
    - Redis cache (`spring-boot-starter-data-redis`) used for JWT blacklist
    - Spring Security + OAuth2 Resource Server
    - Mongock migrations (initial role/permission + seeded admin user)
    - Auth endpoints: register/login/introspect/logout/refresh
    - Basic CRUD-ish endpoints for users, roles, permissions
  - **`api-gateway` (Spring Cloud Gateway)**:
    - Route `/user/**` to `USER_SERVICE_URI`
    - Has a `GlobalFilter` (`AuthenticationFilter`) and an `IdentityClient` calling `POST /auth/introspect`
  - **`notification-service` (Go)**:
    - `cmd/server/main.go` exists but is currently empty (no runnable server yet)
- **Dev tooling**
  - `Makefile` provides `make run user|gateway` and docker compose helpers
  - `docker-compose.dev.yaml` exists (not reviewed in this phase)
  - GitHub Actions workflows exist for gateway and user service (not reviewed in this phase)

## Key progress areas

- **Authentication in `user-service` is mostly in place**
  - Token generation (HS512), introspection, refresh, logout + blacklist.
  - Resource server uses a custom `JwtDecoder` that calls `AuthService.introspect()`.
- **RBAC scaffolding exists**
  - `Role` and `Permission` endpoints exist.
  - A Mongock change unit seeds admin + permissions.

## Primary gaps / risks

### 1) Gateway authentication is incomplete / unsafe

`AuthenticationFilter` currently:
- Only bypasses one hard-coded path (`.../user/api/auth/login`).
- Extracts token and calls introspect using `subscribe`, but does **not** enforce the result (request continues regardless of validity).
- Logs token (sensitive), which should not be logged in production.

Impact:
- Protected APIs are effectively reachable through gateway even with invalid/expired tokens.

### 2) Inconsistent token expiry semantics

In `AuthService.generateToken(...)`:
- `validDuration` is added using `ChronoUnit.MINUTES`.
But configuration keys imply **durations** (e.g. `JWT_VALID_DURATION`) likely intended as seconds/minutes — needs standardization.

Impact:
- Tokens may expire far earlier/later than intended; refresh/blacklist TTL behavior may be inconsistent.

### 3) User endpoints contain correctness issues

- `@PreAuthorize("hasRole('ADMIN') or #userID == authentication.principal.id")` in `UserController.getUser(...)` uses `#userID` but method param is `userId` (case mismatch).
  - This likely breaks authorization expression.
- `UserService.updateUser(String email, ...)` suggests update by email, but controller passes `{userID}` path variable.
  - Potentially updates by email but path is id (mismatch).

Impact:
- Security rules may not work as expected; update endpoint behavior may be incorrect.

### 4) Monorepo build / module wiring incomplete

- Root parent `pom.xml` doesn’t include gateway as a module.
- There are multiple microservices folders (application/job) but unclear if actively used.

Impact:
- CI/build consistency and developer onboarding friction.

### 5) Notification service not implemented yet

`notification-service/cmd/server/main.go` is empty, so there’s no runnable service or contract.

Impact:
- Any features requiring notifications (email/OTP/push) cannot be delivered.

## Suggested next milestones (high-level)

- **Milestone A (Security baseline)**: Fix gateway enforcement + standardize auth flows + remove token logging.
- **Milestone B (User service correctness)**: Fix controller/service mismatches; stabilize authorization expressions; add tests for critical auth/permission flows.
- **Milestone C (Notifications)**: Implement notification-service MVP and integrate with user-service (OTP/email).
- **Milestone D (Infra & CI)**: Stabilize compose, environment templates, and CI pipeline expectations.

