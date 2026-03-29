## Phase 2 — User-service auth & RBAC hardening

### Objective

Stabilize `user-service` authentication flows and RBAC endpoints so they behave correctly, are secure, and are testable.

## Scope

- Fix correctness mismatches in controllers/services (path variables vs method params).
- Standardize JWT duration semantics (minutes vs seconds) and refresh/blacklist TTL alignment.
- Ensure authorization expressions are correct (`@PreAuthorize`, `@PostAuthorize`).
- Improve error handling consistency (HTTP codes + `ApiResponse` payload shape).
- Add a minimal unit/integration test suite for auth + blacklist + role/permission basics.

## Findings to address (observed)

### 1) Controller/service mismatches

- `UserController.getUser(@PathVariable String userId)` uses:
  - `@PreAuthorize("hasRole('ADMIN') or #userID == authentication.principal.id")`
  - Variable name mismatch (`userID` vs `userId`) likely breaks expression.
- `UserController.updateUser(@PathVariable String userID, ...)` calls:
  - `userService.updateUser(userID, request)`
  - But `UserService.updateUser(String email, ...)` currently searches by email.

### 2) Token duration semantics

- `generateToken(user, validDuration)` uses `Instant.now().plus(validDuration, ChronoUnit.MINUTES)` while:
  - `verifyToken(..., isRefresh=true)` uses `REFRESHABLE_DURATION` with `ChronoUnit.SECONDS`
  - Naming suggests configuration values may be “duration” but units are inconsistent.

### 3) Blacklist logic

- `logout` computes TTL seconds using `(expiry - now)` and stores in redis.
- `refreshToken` blacklists the old refresh token with TTL based on expiration.

Need to confirm:
- Token expiration claims align with blacklist TTL calculations.

## Deliverables

- Corrected `UserController` and `UserService` method contracts:
  - Update endpoint updates by **id** or by **email**, but consistently from controller → service → repository.
- Fixed authorization expressions and/or moved to method-level security where appropriate.
- Unified JWT duration units:
  - Define whether configs are seconds or minutes.
  - Apply consistently in both generation and verification.
- Tests:
  - Auth: login produces token; introspect validates; logout blacklists; refresh rotates
  - RBAC: ensure ADMIN vs USER access decisions behave as expected for representative endpoints

## Implementation plan

### 1. Fix endpoint semantics

Decide and implement one of:
- **Option A (recommended)**: endpoints use `userId` as canonical identifier
  - `PUT /api/users/{userId}` updates by id
  - Repository method uses `findById...`
- **Option B**: endpoints use email in path
  - rename path to `{email}` and update route naming and validation

### 2. Fix method security expressions

- Replace broken expressions with correct parameter names.
- Prefer consistent claims usage:
  - In JWT, `sub` is user id. Use `jwt.getSubject()` semantics consistently.

### 3. Standardize JWT config units

- Choose units (seconds recommended).
- Update:
  - token generation expiration (`Instant.now().plus(validDuration, ChronoUnit.SECONDS)`)
  - refresh verification windows
- Ensure property naming reflects units (e.g., `_SECONDS`) or document in `.env.example`.

### 4. Improve API error consistency

- Ensure `GlobalExceptionHandler` maps `AppException` and validation errors to consistent payload:
  - `ApiResponse` with `code/message` + appropriate HTTP status

### 5. Test suite

- Add tests for:
  - `AuthService` token lifecycle (mocking time if needed)
  - `JwtBlacklistService` integration with embedded redis (or use testcontainers if available)
  - Controller tests for key endpoints (MockMvc)

## Acceptance criteria

- Update/get endpoints behave consistently (id/email semantics are not mixed).
- Authorization annotations work (verified by tests or manual scenarios).
- JWT durations behave as configured; refresh and blacklist TTL match token expiration.
- At least a smoke-level test suite exists and passes in CI/local.

