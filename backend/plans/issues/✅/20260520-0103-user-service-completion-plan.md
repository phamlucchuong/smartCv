# User Service — Completion Plan

**Branch:** `feat/init-user-candidate-and-recruiter`  
**Date:** 2026-05-23  
**Scope:** Fix bugs, complete the registration flow, add supporting features

---

## Current assessment

### ❌ Critical bugs (production-breaking)

| # | File | Issue |
|---|------|-------|
| B1 | `AuthController.java:72` | Key mismatch: `authService.authenticated()` returns key `"token"` but controller reads `tokens.get("accessToken")` → `accessToken` cookie is always null |
| B2 | `AuthService.java:69` | `authenticated()` does not check `user.isVerified()` → unverified users can log in |
| B3 | `AuthService.java:95` | `roleService.findById("USER")` — no "USER" role in DB (migration only creates "ADMIN") → all registered users end up with no role |
| B4 | `SecurityConfig.java:32` | `/api/auth/verify-registration` is missing from `PUBLIC_POST_ENDPOINT` → OTP verification endpoint requires JWT (unverified users cannot call it) |
| B5 | `UserService.java:70` | `Sort.by(Sort.Direction.DESC, "name")` — User entity has `fullName`, not `name` → query fails or sorts incorrectly |
| B6 | `UserController.java:25` | `@PreAuthorize("... or #userID == ...")` — actual param is `userId` (lowercase d) → SpEL mismatch, self-access is always false |

### ⚠️ Missing critical logic

| # | Issue |
|---|-------|
| L1 | `RegisterRequest` has no `role` field → cannot distinguish candidate vs recruiter registration |
| L2 | DB migration only creates ADMIN role, missing CANDIDATE and RECRUITER roles |
| L3 | `CandidateService.create()` and `RecruiterService.create()` do not assign the matching role to the user after profile creation |
| L4 | After OTP verification, basic profiles for candidate/recruiter are not auto-created |
| L5 | No resend OTP endpoint when OTP expires |
| L6 | No change password, forgot password, or reset password endpoints |
| L7 | `CandidateController` and `RecruiterController` lack `@PreAuthorize` → any logged-in user can update/delete other profiles |
| L8 | `UserController.updateUser` accepts `@PathVariable String userID` but calls `updateUser(userID, request)` → uses ID as email when searching |
| L9 | No `@Valid` on `@RequestBody RegisterRequest` → validation does not run |
| L10 | Page size hardcoded = 2 in `UserService.getAllUsers()` |
| L11 | `ErrorCode` has duplicate codes: `USER_NOT_FOUND` and `UNAUTHENTICATED` both 1004; `PERMISSION_EXITED`, `ROLE_ALREADY_EXISTS`, `ROLE_NOT_FOUND` all 1009 |

---

## Implementation plan

### Phase 1 — Fix critical bugs (highest priority)

#### Step 1.1 — Fix token key in `AuthService.authenticated()`
**File:** `features/auth/AuthService.java`

```java
// Replace:
tokens.put("token", generateToken(user, VALID_DURATION));
// With:
tokens.put("accessToken", generateToken(user, VALID_DURATION));
```

#### Step 1.2 — Check `verified` in `AuthService.authenticated()`
**File:** `features/auth/AuthService.java`

Add after password validation:
```java
if (!user.isVerified()) {
    throw new AppException(ErrorCode.USER_NOT_VERIFIED);
}
```

#### Step 1.3 — Add `/api/auth/verify-registration` to public endpoints
**File:** `configuration/SecurityConfig.java`

```java
final String[] PUBLIC_POST_ENDPOINT = {
    "/api/auth/register",
    "/api/auth/verify-registration",   // add this
    "/api/auth/login",
    "/api/auth/introspect",
    "/api/auth/refresh",
    "/api/users",
};
```

#### Step 1.4 — Fix sort field in `UserService.getAllUsers()`
**File:** `features/user/UserService.java`

```java
// Replace:
Sort.by(Sort.Direction.DESC, "name")
// With:
Sort.by(Sort.Direction.DESC, "createdAt")
```

#### Step 1.5 — Fix `@PreAuthorize` in `UserController.getUser()`
**File:** `features/user/UserController.java`

```java
// Replace:
@PreAuthorize("hasRole('ADMIN') or #userID == authentication.principal.id")
public ApiResponse<UserResponse> getUser(@PathVariable String userId)
// With:
@PreAuthorize("hasRole('ADMIN') or #userId == authentication.principal.subject")
public ApiResponse<UserResponse> getUser(@PathVariable String userId)
```

#### Step 1.6 — Fix `UserController.updateUser()` using email
**File:** `features/user/UserController.java` + `features/user/UserService.java`

```java
// UserService: add updateUserById
public UserResponse updateUserById(String id, UserUpdateRequest request) {
    User user = userRepository.findByIdAndDeletedFalse(id)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    userMapper.toUpdate(user, request);
    if (request.getPassword() != null && !request.getPassword().isBlank()) {
        user.setPassword(passwordEncoder.encode(request.getPassword()));
    }
    user.setUpdatedAt(LocalDateTime.now());
    return userMapper.toUserResponse(userRepository.save(user));
}
```

#### Step 1.7 — Add `@Valid` to controller
**File:** `features/auth/AuthController.java`

```java
public ApiResponse<UserResponse> register(@Valid @RequestBody RegisterRequest request)
```

#### Step 1.8 — Fix duplicate ErrorCode values
**File:** `enums/ErrorCode.java`

```java
USER_NOT_FOUND(1004, "User not found"),
UNAUTHENTICATED(1005, "Unauthenticated"),        // was 1004
PERMISSION_EXISTED(1006, "Permission existed"),   // was 1009
ROLE_ALREADY_EXISTS(1007, "Role already exists"), // was 1009
ROLE_NOT_FOUND(1008, "Role not found"),           // was 1009
```

---

### Phase 2 — Redesign the registration flow (high priority)

#### Step 2.1 — Add `role` field to `RegisterRequest`
**File:** `dtos/request/RegisterRequest.java`

```java
@NotNull(message = "ROLE_REQUIRED")
String role; // "CANDIDATE" or "RECRUITER"
```

#### Step 2.2 — DB migration: create CANDIDATE and RECRUITER roles
**New file:** `configuration/changelog/V1_002__Init_candidate_recruiter_roles.java`

```java
@ChangeUnit(id = "V1_002__Init_candidate_recruiter_roles", order = "002", author = "chuongpl")
public class V1_002__Init_candidate_recruiter_roles {
    @Execution
    public void initData(MongoTemplate mongoTemplate) {
        Role candidateRole = Role.builder()
                .name("CANDIDATE")
                .description("Job seeker")
                .permissions(Set.of())
                .build();
        Role recruiterRole = Role.builder()
                .name("RECRUITER")
                .description("Company recruiter")
                .permissions(Set.of())
                .build();
        mongoTemplate.save(candidateRole);
        mongoTemplate.save(recruiterRole);
    }

    @RollbackExecution
    public void rollback() {}
}
```

#### Step 2.3 — Update `AuthService.register()` to use role from request
**File:** `features/auth/AuthService.java`

```java
public UserResponse register(RegisterRequest request) {
    if (!userService.verifyEmail(request.getEmail()))
        throw new AppException(ErrorCode.EMAIL_EXISTED);

    String roleName = request.getRole().toUpperCase();
    if (!roleName.equals("CANDIDATE") && !roleName.equals("RECRUITER"))
        throw new AppException(ErrorCode.ROLE_NOT_FOUND);

    User user = userMapper.toUser(request);
    user.setPassword(passwordEncoder.encode(request.getPassword()));
    user.setVerified(false);

    HashSet<Role> roles = new HashSet<>();
    roleService.findById(roleName).ifPresent(roles::add);
    user.setRoles(roles);
    user.setCreatedAt(LocalDateTime.now());

    User savedUser = userService.saveUser(user);

    String target = "SMS".equalsIgnoreCase(request.getPreferredVerification())
            ? request.getPhone() : request.getEmail();
    notificationClient.sendOTP(target, request.getPreferredVerification());

    return userMapper.toUserResponse(savedUser);
}
```

#### Step 2.4 — Auto-create profile after OTP verification
**File:** `features/auth/AuthService.java`

After `user.setVerified(true)`, based on user roles:
```java
// Auto-create basic profile
user.getRoles().forEach(role -> {
    if ("CANDIDATE".equals(role.getName())) {
        candidateService.createBasicProfile(user.getId());
    } else if ("RECRUITER".equals(role.getName())) {
        recruiterService.createBasicProfile(user.getId());
    }
});
```

#### Step 2.5 — Add `createBasicProfile()` to CandidateService and RecruiterService
**File:** `features/candidate/CandidateService.java`

```java
public void createBasicProfile(String userId) {
    if (candidateRepository.findByUserId(userId).isPresent()) return;
    Candidate candidate = Candidate.builder()
            .userId(userId)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
    candidateRepository.save(candidate);
}
```

**File:** `features/recruiter/RecruiterService.java`

```java
public void createBasicProfile(String userId) {
    if (recruiterRepository.findByUserId(userId).isPresent()) return;
    Recruiter recruiter = Recruiter.builder()
            .userId(userId)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
    recruiterRepository.save(recruiter);
}
```

---

### Phase 3 — Security hardening (medium priority)

#### Step 3.1 — Add `@PreAuthorize` to `CandidateController`
**File:** `features/candidate/CandidateController.java`

```java
@PostMapping
@PreAuthorize("hasRole('CANDIDATE')")
public ApiResponse<CandidateResponse> create(...)

@PutMapping("/{id}")
@PreAuthorize("hasRole('CANDIDATE') or hasRole('ADMIN')")
public ApiResponse<CandidateResponse> update(...)

@DeleteMapping("/{id}")
@PreAuthorize("hasRole('ADMIN')")
public ApiResponse<Void> delete(...)

@GetMapping
@PreAuthorize("hasRole('ADMIN') or hasRole('RECRUITER')")
public ApiResponse<List<CandidateResponse>> getAll(...)
```

#### Step 3.2 — Add `@PreAuthorize` to `RecruiterController`
**File:** `features/recruiter/RecruiterController.java`

```java
@PostMapping
@PreAuthorize("hasRole('RECRUITER')")
public ApiResponse<RecruiterResponse> create(...)

@PutMapping("/{id}")
@PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
public ApiResponse<RecruiterResponse> update(...)

@DeleteMapping("/{id}")
@PreAuthorize("hasRole('ADMIN')")
public ApiResponse<Void> delete(...)
```

#### Step 3.3 — Add self-check in candidate/recruiter update
Before update, ensure the profile userId matches the JWT subject so users cannot modify others' profiles.

---

### Phase 4 — Supporting features (medium priority)

#### Step 4.1 — Resend OTP endpoint
**New DTO file:** `dtos/request/ResendOtpRequest.java`
```java
public class ResendOtpRequest {
    @NotBlank String contact;   // email or phone
    @NotBlank String preferredVerification; // EMAIL or SMS
}
```

**AuthService:**
```java
public void resendOtp(ResendOtpRequest request) {
    // Find user by contact, ensure not verified
    // Send new OTP via RabbitMQ
}
```

**AuthController:**
```java
@PostMapping("/resend-otp")   // public endpoint
public ApiResponse<Void> resendOtp(@Valid @RequestBody ResendOtpRequest request)
```

#### Step 4.2 — Change password endpoint
**New DTO file:** `dtos/request/ChangePasswordRequest.java`
```java
public class ChangePasswordRequest {
    @NotBlank String currentPassword;
    @Size(min = 8) String newPassword;
}
```

**UserService:**
```java
public void changePassword(String userId, ChangePasswordRequest request) {
    User user = userRepository.findByIdAndDeletedFalse(userId)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword()))
        throw new AppException(ErrorCode.AUTHENTICATION_FAILED);
    user.setPassword(passwordEncoder.encode(request.getNewPassword()));
    user.setUpdatedAt(LocalDateTime.now());
    userRepository.save(user);
}
```

**UserController:**
```java
@PutMapping("/me/password")
public ApiResponse<Void> changePassword(@AuthenticationPrincipal Jwt jwt,
                                         @Valid @RequestBody ChangePasswordRequest request)
```

#### Step 4.3 — Forgot password + reset password
Flow:
1. `POST /api/auth/forgot-password` — receive email/phone, publish reset OTP to RabbitMQ with type `RESET_PASSWORD`
2. `POST /api/auth/reset-password` — receive contact + OTP + newPassword, verify OTP, update password

**OTPMessage** needs an `otpType` field (VERIFY_ACCOUNT | RESET_PASSWORD).

#### Step 4.4 — Admin role management
**UserController:**
```java
// Assign new roles to user
@PatchMapping("/{userId}/roles")
@PreAuthorize("hasRole('ADMIN')")
public ApiResponse<UserResponse> updateUserRoles(@PathVariable String userId,
                                                  @RequestBody UpdateRolesRequest request)
```

**UpdateRolesRequest:**
```java
public class UpdateRolesRequest {
    List<String> roles; // ["ADMIN", "CANDIDATE"]
}
```

#### Step 4.5 — Pagination for candidate/recruiter list
**CandidateService.getAll():**
```java
public PageResponse<CandidateResponse> getAll(int page, int size) {
    Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));
    Page<Candidate> candidates = candidateRepository.findAll(pageable);
    // map to response...
}
```

Same approach for RecruiterService.

#### Step 4.6 — Page size from properties
**application.properties / .env:**
```
USER_DEFAULT_PAGE_SIZE=10
```

Replace hardcoded `int limit = 2` with `@Value("${USER_DEFAULT_PAGE_SIZE:10}")`.

---

### Phase 5 — Additional improvements (low priority)

#### Step 5.1 — Add roles to `UserResponse`
Add a `roles` field to `UserResponse` so the FE can determine user roles.

#### Step 5.2 — Validation messages
Create `ValidationMessages.properties` with standard English messages instead of hardcoded strings like "USER_NAME_INVALID".

#### Step 5.3 — Soft delete for Candidate/Recruiter
Add a `deleted` flag to `Candidate` and `Recruiter`, and use soft delete instead of `deleteById`.

#### Step 5.4 — Unit tests
- Test `AuthService.register()` with CANDIDATE/RECRUITER roles
- Test `AuthService.authenticated()` — verified vs unverified user
- Test `CandidateService.create()` with duplicate userId

---

## Implementation order (recommended)

```
Phase 1 (B1→B8)  →  Phase 2 (2.1→2.5)  →  Phase 3 (3.1→3.3)  →  Phase 4 (4.1→4.6)  →  Phase 5
   ~2h                    ~2h                     ~1h                     ~4h                ~3h
```

**Estimated total:** ~12 hours

---

## Flow after completion

```
[Register CANDIDATE/RECRUITER]
POST /api/auth/register  {role: "CANDIDATE", ...}
  → Validate email does not exist
  → Create User with role = CANDIDATE/RECRUITER, verified = false
  → Publish OTPMessage to RabbitMQ → Notification Service sends OTP
  → Return UserResponse

[Verify OTP]
POST /api/auth/verify-registration  {contact, verificationType, code}
  → Call Notification Service to verify OTP
  → Set user.verified = true
  → Auto-create Candidate/Recruiter basic profile
  → Return AuthResponse {token, refreshToken}

[Login]
POST /api/auth/login  {email, password}
  → Validate password
  → Check user.verified == true (if false → 403 USER_NOT_VERIFIED)
  → Set cookie accessToken + refreshToken
  → Return 200

[Resend OTP]
POST /api/auth/resend-otp  {contact, preferredVerification}
  → Find user by contact
  → Ensure user is not verified
  → Publish new OTP to RabbitMQ

[Forgot password]
POST /api/auth/forgot-password  {contact}
  → Publish RESET_PASSWORD OTP
POST /api/auth/reset-password  {contact, code, newPassword}
  → Verify OTP
  → Update password

[Change password (logged in)]
PUT /api/users/me/password  {currentPassword, newPassword}
  → Verify currentPassword
  → Update password

[Admin role management]
PATCH /api/users/{userId}/roles  {roles: ["CANDIDATE"]}
  → Assign/update roles for user
```
