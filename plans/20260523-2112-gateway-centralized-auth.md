# Centralize JWT Authentication at API Gateway

## Scope

Move JWT validation from individual services (user-service, job-service) to the API Gateway.
Downstream services stop authenticating and only perform authorization (role/permission checks)
using identity headers forwarded by the gateway.

---

## Current Assessment

### What exists

| Location | What it does | Problem |
|----------|-------------|---------|
| `api-gateway/AuthenticationFilter` | Calls user-service `/auth/introspect` via HTTP to check token validity, then forwards request unchanged | Makes an HTTP roundtrip per request; does not forward user identity to downstream services |
| `api-gateway/WebClientConfig` | Hardcodes user-service base URL as `http://localhost:8081/user` | Not environment-configurable |
| `api-gateway/application.yaml` | No JWT config, no Redis config, no job-service route | Gateway cannot validate tokens locally |
| `user-service/CustomerJwtDecoder` | Calls `authService.introspect()` on every request — verifies signature + checks Redis blacklist | Duplicate validation with gateway; adds latency |
| `user-service/JwtBlacklistFilter` | Checks Redis blacklist on every incoming request before JWT decoding | Redundant when gateway already checks blacklist |
| `user-service/SecurityConfig` | Full OAuth2 resource server config with custom JWT decoder | Needs to be replaced with header-based pre-authentication |
| `user-service/UserController` | Uses `@AuthenticationPrincipal Jwt jwt` and `authentication.principal.subject` | Tightly coupled to JWT principal type |
| `user-service/CandidateController` | Extracts admin flag via `jwt.getClaimAsString("scope").contains("ROLE_ADMIN")` | Tightly coupled to JWT object |
| `user-service/AuthController.logout` | `@AuthenticationPrincipal Jwt jwt` to get token value for blacklisting | Must change to read raw `Authorization` header |
| `job-service` (planned) | Would need same JWT stack as user-service | Duplication would grow with every new service |

### Root problems

1. **Duplicate authentication**: Gateway + every service each validate the same JWT independently.
2. **Extra latency on every request**: `CustomerJwtDecoder` calls `authService.introspect()` synchronously.
3. **Public endpoint lists are duplicated**: Defined in both `SecurityConfig` of each service AND `AuthenticationFilter` of the gateway.
4. **Growing maintenance cost**: Adding a new service means copying the JWT stack again.
5. **Services are not isolated from auth logic**: Each service must know `JWT_SECRET_KEY` and blacklist format.

---

## Target Architecture

```
Client
  │  Bearer <token>
  ▼
┌─────────────────────────────────────────┐
│  API Gateway (port 8080)                │
│                                         │
│  AuthenticationFilter                   │
│  ┌─────────────────────────────────┐    │
│  │ 1. Match public routes → skip   │    │
│  │ 2. Extract Bearer token         │    │
│  │ 3. Verify JWT signature (HS512) │    │  ← local, no HTTP call
│  │ 4. Check expiry                 │    │
│  │ 5. Check Redis blacklist        │    │  ← direct Redis access
│  │ 6. Extract sub → X-User-Id      │    │
│  │ 7. Extract scope → X-User-Scope │    │
│  │ 8. Forward request + headers    │    │
│  └─────────────────────────────────┘    │
└────────────────┬────────────────────────┘
                 │  X-User-Id: <userId>
                 │  X-User-Scope: ROLE_RECRUITER VIEW_JOB
                 │  X-Gateway-Secret: <internal-secret>
                 ▼
     ┌───────────────────────┐
     │  Downstream Services  │
     │  (user, job, ...)     │
     │                       │
     │  InternalAuthFilter   │
     │  ┌─────────────────┐  │
     │  │ 1. Verify       │  │
     │  │    X-Gateway-   │  │
     │  │    Secret       │  │  ← rejects direct calls bypassing gateway
     │  │ 2. Build        │  │
     │  │    SecurityCtx  │  │
     │  │    from headers │  │
     │  └─────────────────┘  │
     │                       │
     │  @PreAuthorize(...)   │  ← authorization only, no authentication
     └───────────────────────┘
```

### Header contract (gateway → services)

| Header | Value | Example |
|--------|-------|---------|
| `X-User-Id` | JWT `sub` claim (MongoDB ObjectId) | `683f2a1c...` |
| `X-User-Scope` | JWT `scope` claim (space-separated) | `ROLE_RECRUITER VIEW_JOB` |
| `X-Gateway-Secret` | Shared internal secret (env var) | `s3cr3t-g4t3w4y` |

The `X-Gateway-Secret` prevents requests that bypass the gateway from injecting fake identity headers.

---

## Implementation Plan

### Phase 1 — API Gateway: validate JWT locally + forward identity

#### 1.1 Add dependencies to `api-gateway/pom.xml`

```xml
<!-- Parse and verify JWT locally -->
<dependency>
    <groupId>com.nimbusds</groupId>
    <artifactId>nimbus-jose-jwt</artifactId>
    <version>9.37.3</version>
</dependency>

<!-- Check blacklist from the same Redis used by user-service -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis-reactive</artifactId>
</dependency>

<!-- Load .env -->
<dependency>
    <groupId>io.github.cdimascio</groupId>
    <artifactId>dotenv-java</artifactId>
    <version>3.0.0</version>
</dependency>
```

#### 1.2 Update `api-gateway/application.yaml`

```yaml
spring:
  config:
    import: optional:file:../.env[.properties]
  cloud:
    gateway:
      routes:
        - id: user-service
          uri: ${USER_SERVICE_URI:http://localhost:8081}
          predicates:
            - Path=/user/**
        - id: job-service
          uri: ${JOB_SERVICE_URI:http://localhost:8082}
          predicates:
            - Path=/job/**
        - id: notification-service
          uri: ${NOTIFICATION_SERVICE_URI:http://localhost:8084}
          predicates:
            - Path=/notification/**
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      password: ${REDIS_PASSWORD:}

app:
  jwt:
    secret-key: ${JWT_SECRET_KEY}
  gateway:
    internal-secret: ${GATEWAY_INTERNAL_SECRET:changeme}
  public-routes:
    - method: POST   path: /user/api/auth/register
    - method: POST   path: /user/api/auth/verify-registration
    - method: POST   path: /user/api/auth/resend-otp
    - method: POST   path: /user/api/auth/forgot-password
    - method: POST   path: /user/api/auth/reset-password
    - method: POST   path: /user/api/auth/login
    - method: POST   path: /user/api/auth/introspect
    - method: POST   path: /user/api/auth/refresh
    - method: GET    path: /user/api/users/verify-email/**
    - method: GET    path: /job/api/jobs
    - method: GET    path: /job/api/jobs/search
    - method: GET    path: /job/api/jobs/{id}
    - method: GET    path: /notification/api/otp/verify
```

> Defining public routes in `application.yaml` eliminates the fragile `path.endsWith(...)` string checks in the filter.

#### 1.3 Create `GatewayJwtUtils.java`

Validates JWT locally (no HTTP call) and extracts claims.

```java
@Component
public class GatewayJwtUtils {

    @Value("${app.jwt.secret-key}")
    private String signerKey;

    // Returns parsed claims, throws JwtValidationException if invalid
    public JWTClaimsSet verify(String token) throws Exception {
        SignedJWT jwt = SignedJWT.parse(token);
        JWSVerifier verifier = new MACVerifier(signerKey.getBytes());
        if (!jwt.verify(verifier)) throw new JwtValidationException("Invalid signature");
        Date expiry = jwt.getJWTClaimsSet().getExpirationTime();
        if (expiry == null || expiry.before(new Date())) throw new JwtValidationException("Token expired");
        return jwt.getJWTClaimsSet();
    }

    public String extractUserId(JWTClaimsSet claims) {
        return claims.getSubject();
    }

    public String extractScope(JWTClaimsSet claims) throws Exception {
        return (String) claims.getClaim("scope");
    }
}
```

#### 1.4 Create `BlacklistCheckService.java`

Reactive Redis check (gateway is WebFlux-based).

```java
@Service
public class BlacklistCheckService {

    private final ReactiveRedisTemplate<String, String> redisTemplate;

    // Returns true if token is blacklisted
    public Mono<Boolean> isBlacklisted(String token) {
        return redisTemplate.hasKey(token);
    }
}
```

> Uses the same Redis instance and the same key format as user-service (`JwtBlacklistService` stores the raw token string as the key).

#### 1.5 Create `PublicRoutesMatcher.java`

Reads the `app.public-routes` list from config and matches against the incoming request.

```java
@Component
public class PublicRoutesMatcher {
    // Loaded from app.public-routes in application.yaml
    private final List<PublicRoute> publicRoutes;

    public boolean isPublic(ServerWebExchange exchange) {
        String path = exchange.getRequest().getPath().value();
        HttpMethod method = exchange.getRequest().getMethod();
        return publicRoutes.stream().anyMatch(r -> r.matches(method, path));
    }

    record PublicRoute(String method, String path) {
        boolean matches(HttpMethod m, String p) {
            return m.name().equalsIgnoreCase(method)
                && new AntPathMatcher().match(path, p);
        }
    }
}
```

#### 1.6 Rewrite `AuthenticationFilter.java`

```java
@Component
@RequiredArgsConstructor
public class AuthenticationFilter implements GlobalFilter, Ordered {
    final GatewayJwtUtils jwtUtils;
    final BlacklistCheckService blacklistCheck;
    final PublicRoutesMatcher publicRoutesMatcher;

    @Value("${app.gateway.internal-secret}")
    String internalSecret;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {

        if (publicRoutesMatcher.isPublic(exchange)) {
            // Public route: forward without X-User-* headers
            return chain.filter(addInternalSecret(exchange));
        }

        List<String> authHeaders = exchange.getRequest().getHeaders().get(HttpHeaders.AUTHORIZATION);
        if (CollectionUtils.isEmpty(authHeaders)) {
            return reject(exchange.getResponse(), HttpStatus.UNAUTHORIZED, "Missing Authorization header");
        }

        String token = authHeaders.getFirst().replace("Bearer ", "").strip();

        try {
            JWTClaimsSet claims = jwtUtils.verify(token);
            String userId = jwtUtils.extractUserId(claims);
            String scope  = jwtUtils.extractScope(claims);

            return blacklistCheck.isBlacklisted(token).flatMap(blacklisted -> {
                if (blacklisted) {
                    return reject(exchange.getResponse(), HttpStatus.UNAUTHORIZED, "Token revoked");
                }
                // Forward identity headers to downstream
                ServerWebExchange mutated = exchange.mutate().request(r -> r
                    .header("X-User-Id",       userId)
                    .header("X-User-Scope",    scope != null ? scope : "")
                    .header("X-Gateway-Secret", internalSecret)
                ).build();
                return chain.filter(mutated);
            });

        } catch (Exception e) {
            log.warn("JWT validation failed: {}", e.getMessage());
            return reject(exchange.getResponse(), HttpStatus.UNAUTHORIZED, "Invalid token");
        }
    }

    @Override public int getOrder() { return -1; }

    private ServerWebExchange addInternalSecret(ServerWebExchange exchange) {
        return exchange.mutate().request(r -> r.header("X-Gateway-Secret", internalSecret)).build();
    }

    private Mono<Void> reject(ServerHttpResponse response, HttpStatus status, String message) {
        response.setStatusCode(status);
        byte[] bytes = message.getBytes(StandardCharsets.UTF_8);
        return response.writeWith(Mono.just(response.bufferFactory().wrap(bytes)));
    }
}
```

#### 1.7 Remove `IdentityClient`, `IdentityService`, `WebClientConfig`

These three files exist solely to call user-service introspect for authentication. With local JWT validation they are no longer needed. Delete all three.

---

### Phase 2 — User Service: replace JWT auth with header-based pre-auth

#### 2.1 Create `InternalAuthFilter.java`

Reads the forwarded headers and builds a `SecurityContext` so that `@PreAuthorize` continues to work.

```java
@Component
@RequiredArgsConstructor
public class InternalAuthFilter extends OncePerRequestFilter {

    @Value("${app.gateway.internal-secret}")
    private String expectedSecret;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        String secret = request.getHeader("X-Gateway-Secret");
        if (!expectedSecret.equals(secret)) {
            // Request did not come through the gateway — reject
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Direct access not allowed");
            return;
        }

        String userId = request.getHeader("X-User-Id");
        String scope  = request.getHeader("X-User-Scope");

        if (userId != null && !userId.isBlank()) {
            List<GrantedAuthority> authorities = Collections.emptyList();
            if (scope != null && !scope.isBlank()) {
                authorities = Arrays.stream(scope.split(" "))
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toList());
            }
            // Principal = userId (String) → authentication.name and @AuthenticationPrincipal String userId
            UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(userId, null, authorities);
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        chain.doFilter(request, response);
    }
}
```

> After this filter: `authentication.name` = userId, `authentication.authorities` = parsed scope.

#### 2.2 Rewrite `SecurityConfig.java`

Remove OAuth2 resource server, add `InternalAuthFilter`.

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    InternalAuthFilter internalAuthFilter;

    @Value("${FE_DOMAIN:http://localhost:4127}")
    String FE_DOMAIN;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(internalAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(SWAGGER_ENDPOINTS).permitAll()
                // Public POST endpoints (gateway already bypassed auth for these)
                .requestMatchers(HttpMethod.POST,
                    "/api/auth/register", "/api/auth/verify-registration",
                    "/api/auth/resend-otp", "/api/auth/forgot-password",
                    "/api/auth/reset-password", "/api/auth/login",
                    "/api/auth/introspect", "/api/auth/refresh").permitAll()
                .requestMatchers(HttpMethod.GET,
                    "/api/users/verify-email/**").permitAll()
                .anyRequest().authenticated()
            );
        return http.build();
    }

    // CORS bean stays the same
}
```

> **Removed**: `oauth2ResourceServer`, `CustomerJwtDecoder` injection, `JwtBlacklistFilter` in chain.

#### 2.3 Delete `CustomerJwtDecoder.java`

No longer used. The gateway handles JWT validation. Delete the file.

#### 2.4 Delete `JwtBlacklistFilter.java`

Blacklist check now happens at the gateway level. Delete the file.

> `JwtBlacklistService.java` is **kept** — it is still called by `AuthService.logout()` to write tokens to the blacklist. Only the per-request read check moves to the gateway.

#### 2.5 Update `AuthController.logout()`

`@AuthenticationPrincipal Jwt jwt` no longer works (no JWT principal). Read the raw token from the `Authorization` header instead.

```java
// Before
@PostMapping("/logout")
public ApiResponse<Void> logout(@AuthenticationPrincipal Jwt jwt) throws ... {
    String token = jwt.getTokenValue();
    authService.logout(token);
    ...
}

// After
@PostMapping("/logout")
public ApiResponse<Void> logout(
        @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader) throws ... {
    String token = authHeader.replace("Bearer ", "").strip();
    authService.logout(token);
    ...
}
```

#### 2.6 Update `UserController` — replace `Jwt` principal with `String`

All usages of `@AuthenticationPrincipal Jwt jwt` and `jwt.getSubject()` change to `@AuthenticationPrincipal String userId`.

```java
// Before
@GetMapping("/me")
@PostAuthorize("returnObject.data.id == authentication.principal.subject")
public ApiResponse<UserResponse> getMe(@AuthenticationPrincipal Jwt jwt) {
    return ... userService.getUserById(jwt.getSubject()) ...;
}

// After
@GetMapping("/me")
@PostAuthorize("returnObject.data.id == authentication.name")
public ApiResponse<UserResponse> getMe(@AuthenticationPrincipal String userId) {
    return ... userService.getUserById(userId) ...;
}
```

```java
// Before
@PreAuthorize("hasRole('ADMIN') or #userId == authentication.principal.subject")

// After
@PreAuthorize("hasRole('ADMIN') or #userId == authentication.name")
```

```java
// Before
@PutMapping("/me/password")
public ApiResponse<Void> changePassword(@AuthenticationPrincipal Jwt jwt, ...) {
    userService.changePassword(jwt.getSubject(), request);
}

// After
@PutMapping("/me/password")
public ApiResponse<Void> changePassword(@AuthenticationPrincipal String userId, ...) {
    userService.changePassword(userId, request);
}
```

#### 2.7 Update `CandidateController` and `RecruiterController`

Replace `@AuthenticationPrincipal Jwt jwt` and `jwt.getClaimAsString("scope")` usage.

```java
// Before
public ApiResponse<CandidateResponse> update(..., @AuthenticationPrincipal Jwt jwt) {
    boolean isAdmin = jwt.getClaimAsString("scope") != null
                   && jwt.getClaimAsString("scope").contains("ROLE_ADMIN");
    return ... candidateService.update(id, request, jwt.getSubject(), isAdmin) ...;
}

// After
public ApiResponse<CandidateResponse> update(...,
        @AuthenticationPrincipal String userId,
        Authentication authentication) {
    boolean isAdmin = authentication.getAuthorities().stream()
        .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    return ... candidateService.update(id, request, userId, isAdmin) ...;
}
```

#### 2.8 Remove `spring-boot-starter-oauth2-resource-server` from user-service `pom.xml`

This dependency is no longer needed. `spring-boot-starter-security` alone is sufficient.

Also remove the `nimbus-jose-jwt` explicit dependency if it was only added for `CustomerJwtDecoder` (it was — remove it).

> Keep: `spring-boot-starter-security` (still needed for `@PreAuthorize`, filter chain).

#### 2.9 Add `GATEWAY_INTERNAL_SECRET` to user-service `application.yaml`

```yaml
app:
  gateway:
    internal-secret: ${GATEWAY_INTERNAL_SECRET:changeme}
```

---

### Phase 3 — Job Service: use header-based auth from the start

When implementing job-service security (per `job-service-completion-plan.md`), do **not** add OAuth2 resource server. Instead:

1. Copy `InternalAuthFilter.java` to job-service (same implementation).
2. Add a minimal `SecurityConfig.java` with `InternalAuthFilter` + `@EnableMethodSecurity`.
3. Add `GATEWAY_INTERNAL_SECRET` to job-service `application.yaml`.
4. Use `@AuthenticationPrincipal String userId` and `authentication.name` in controllers.
5. Remove `nimbus-jose-jwt`, `spring-boot-starter-oauth2-resource-server` from job-service plan — not needed.

---

### Phase 4 — Security hardening

#### 4.1 Network isolation

In Docker Compose, place all services on an internal network. Only the gateway's port is exposed to the host. Services are not reachable directly from outside.

```yaml
# docker-compose.yml
networks:
  internal:
    driver: bridge

services:
  api-gateway:
    ports:
      - "8080:8080"
    networks: [internal]
  user-service:
    # No port mapping — only accessible within internal network
    networks: [internal]
  job-service:
    networks: [internal]
```

#### 4.2 `X-Gateway-Secret` rotation

Store `GATEWAY_INTERNAL_SECRET` in `.env`, use a strong random value (32+ chars). Rotate periodically.

#### 4.3 Swagger access in downstream services

With the `InternalAuthFilter`, direct browser access to Swagger UI on downstream services will fail because there is no `X-Gateway-Secret`. Two options:

- **Option A (recommended for dev)**: Allow Swagger endpoints in `SecurityConfig.permitAll()` and skip `InternalAuthFilter` for those paths.
- **Option B (for prod)**: Route Swagger through the gateway as well (add `/user/swagger-ui/**` to gateway routes).

---

## File-level change summary

### API Gateway

| File | Action | Notes |
|------|--------|-------|
| `pom.xml` | Edit | Add nimbus-jose-jwt, spring-data-redis-reactive, dotenv-java |
| `application.yaml` | Edit | Add JWT config, Redis config, job-service route, public-routes list |
| `AuthenticationFilter.java` | Rewrite | Local JWT verify + blacklist check + forward headers |
| `GatewayJwtUtils.java` | Create | Nimbus-based local JWT parser |
| `BlacklistCheckService.java` | Create | Reactive Redis blacklist check |
| `PublicRoutesMatcher.java` | Create | Config-driven public route matching |
| `IdentityClient.java` | Delete | No longer called for auth |
| `IdentityService.java` | Delete | No longer needed |
| `WebClientConfig.java` | Delete | Only existed to create IdentityClient |

### User Service

| File | Action | Notes |
|------|--------|-------|
| `pom.xml` | Edit | Remove oauth2-resource-server, nimbus-jose-jwt |
| `application.yaml` | Edit | Add `app.gateway.internal-secret` |
| `InternalAuthFilter.java` | Create | Reads X-User-Id + X-User-Scope → SecurityContext |
| `SecurityConfig.java` | Rewrite | Remove OAuth2 RS; add InternalAuthFilter |
| `CustomerJwtDecoder.java` | Delete | Gateway validates JWT now |
| `JwtBlacklistFilter.java` | Delete | Gateway checks blacklist now |
| `AuthController.java` | Edit | `logout`: `@AuthenticationPrincipal Jwt` → `@RequestHeader` |
| `UserController.java` | Edit | `Jwt jwt` → `String userId`; SpEL `.subject` → `.name` |
| `CandidateController.java` | Edit | `Jwt jwt` → `String userId + Authentication` |
| `RecruiterController.java` | Edit | Same as CandidateController |

### Job Service

| File | Action | Notes |
|------|--------|-------|
| `pom.xml` | Do NOT add | oauth2-resource-server, nimbus-jose-jwt |
| `InternalAuthFilter.java` | Create | Copy from user-service |
| `SecurityConfig.java` | Create | Minimal: InternalAuthFilter + @EnableMethodSecurity |
| `application.yaml` | Edit | Add `app.gateway.internal-secret` |

---

## Execution order

```
Phase 1  API Gateway changes          ~2h    (no service disruption until deployed together)
Phase 2  User Service changes         ~2h
Phase 3  Job Service changes          ~30min (done during initial build, not a migration)
Phase 4  Docker Compose network       ~30min
         Total                        ~5h
```

**Deploy strategy**: Implement Phase 1 and Phase 2 together and deploy atomically. The gateway and user-service must be updated in the same deployment; deploying only one half will break the system.

---

## Key trade-offs and notes

1. **Why local JWT validation (not introspect call)**: Eliminates the per-request HTTP call to user-service. With introspect, user-service is a SPOF for every request in the system.

2. **Why Redis shared between gateway and user-service**: Both read and write to the same blacklist store. The key is the raw JWT string; the value is a sentinel string with a TTL equal to the token's remaining lifetime. The gateway reads; the user-service writes (on logout).

3. **Why keep `JwtBlacklistService` in user-service**: `AuthService.logout()` still calls it to write to Redis. Only the *read* path moves to the gateway.

4. **`authentication.principal.subject` → `authentication.name`**: With `UsernamePasswordAuthenticationToken(userId, ...)`, `getName()` returns `userId`. SpEL expression `authentication.name` is the correct replacement for `authentication.principal.subject`.

5. **`@AuthenticationPrincipal` type change**: Previously `@AuthenticationPrincipal Jwt jwt` resolved the `Jwt` object from the `JwtAuthenticationToken`. After the change, `@AuthenticationPrincipal String userId` resolves the principal of the `UsernamePasswordAuthenticationToken`, which is the userId string.
