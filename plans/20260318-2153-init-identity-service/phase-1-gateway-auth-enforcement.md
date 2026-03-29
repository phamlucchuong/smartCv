## Phase 1 — Gateway auth enforcement

### Objective

Make `api-gateway` correctly enforce authentication/authorization decisions before forwarding traffic to downstream services.

### Scope

- Enforce bearer token checks for protected routes.
- Bypass a defined allowlist of public endpoints (auth/register/login/introspect/refresh + swagger).
- Ensure introspection failures **block** the request.
- Remove sensitive token logging.
- Add basic integration tests or at minimum a local manual test plan.

### Non-goals

- Full gateway-based authorization (roles/permissions) if downstream services already handle it.
- Rewriting the entire gateway security model; focus on correctness and safety first.

## Current implementation issues (observed)

- `AuthenticationFilter` calls `identityService.introspect(token).subscribe(...)` and then still continues with `chain.filter(exchange)`.
- Invalid token does not block requests.
- Public endpoint bypass logic is hard-coded and incomplete.
- Token is logged.

## Deliverables

- Updated `AuthenticationFilter` to:
  - Extract token reliably
  - Call introspection in the reactive chain (no `subscribe` side-effect)
  - Short-circuit with 401 when introspection says unauthenticated / throws / times out
  - Use a public endpoint allowlist (paths + methods)
- `api-gateway` config:
  - `IdentityClient` base URL and timeout settings
  - `USER_SERVICE_URI` correctness (note: current default uses `https://localhost:8081` while user-service default is http)
- A short “how to test” checklist

## Implementation plan

### 1. Public endpoints model

- Create a small allowlist:
  - `POST /user/api/auth/register`
  - `POST /user/api/auth/login`
  - `POST /user/api/auth/introspect`
  - `POST /user/api/auth/refresh`
  - Swagger endpoints if served through gateway (optional)

Notes:
- In gateway, the actual path includes `/user/...` because route predicate is `/user/**`.

### 2. Token extraction & validation behavior

- If no `Authorization: Bearer <token>`:
  - For protected endpoints: return 401
  - For allowlisted endpoints: forward
- If token present:
  - Call `identityService.introspect(token)`
  - If `authenticated=false`: return 401
  - Otherwise: forward

### 3. Reactive correctness

- Replace `subscribe(...)` with chaining:
  - `return identityService.introspect(token).flatMap(resp -> { ... })`
- Add basic error handling:
  - `onErrorResume(e -> unauthenticated(...))`
- Add a small timeout (e.g. 1–2 seconds) to avoid gateway hanging when user-service is down.

### 4. Config hardening

- Ensure `USER_SERVICE_URI` default uses `http://localhost:8081` (unless TLS is configured).
- Configure WebClient base URL for identity introspection (if using Spring HTTP interface):
  - Confirm there is a `WebClientConfig` wiring the client with base URL.

### 5. Test plan

- **Manual**
  - Call `POST /user/api/auth/login` via gateway (should work without token)
  - Call protected endpoint via gateway without token (401)
  - Call protected endpoint with invalid token (401)
  - Call protected endpoint with valid token (200)
  - Simulate user-service down (gateway should return 401 or 503 quickly, not hang)

## Acceptance criteria

- Protected endpoints are blocked at gateway without a valid token.
- Public endpoints are accessible without token.
- No token value is logged.
- Introspection call is part of request chain (no side effects via `subscribe`).

## Risks / decisions

- **Decision**: gateway enforces authn only; downstream services enforce authorization via Spring Security (method annotations, etc.).
- **Risk**: double validation (gateway + user-service resource server) may add latency. Acceptable for now; can optimize later.

