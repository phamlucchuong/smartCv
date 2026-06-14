# [feature] Make phone and email editable in profile; add format validation and uniqueness checks

## Overview

The phone and email fields in the candidate profile page (`/account/profile`) are permanently read-only. Users cannot update them through the UI. Additionally:

- `UserUpdateRequest` (backend) has no `phone` field at all, so the endpoint cannot accept a phone update.
- `UserService.updateUserById()` has no uniqueness guard — updating to an email already owned by another account is silently accepted (data integrity bug).
- Phone uniqueness is not enforced anywhere.
- The frontend has no client-side format validation for email or phone when editing.

This issue covers the complete end-to-end change: backend DTO, service-layer uniqueness checks, error codes, static OpenAPI spec, generated types, and frontend edit form with validation.

## Reproduction steps

**Read-only fields:**
1. Log in as a candidate and navigate to `/account/profile`.
2. Click **Edit Profile**.
3. Observe that the Email and Phone fields remain as plain text (not editable inputs).

**No phone in update API:**
```bash
curl -X PUT http://localhost:8080/user/api/users/{userId} \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"phone": "0901234567"}'
# → phone field is ignored; it does not exist in UserUpdateRequest
```

**Email uniqueness not enforced on update:**
```bash
curl -X PUT http://localhost:8080/user/api/users/{userId} \
  -d '{"email": "someone_elses@email.com"}'
# → succeeds; two accounts now share the same email
```

## Expected behavior

1. In edit mode on the profile page, email and phone become editable `<Input>` fields.
2. Saving validates:
   - Email: required, valid email format.
   - Phone: required, valid Vietnamese phone format (`/^(0|\+84)(3|5|7|8|9)\d{8}$/`).
3. If the email or phone is already taken by another account, the API returns a clear error and the frontend shows a toast message.
4. On success, the profile page refreshes and shows the updated values.

**OTP re-verification is out of scope for this issue.** Email changes take effect immediately without sending a verification email. A separate issue should add the OTP flow if/when required.

## Current behavior

- Email field: `editable: false` — never rendered as an `<Input>`.
- Phone field: `editable: false` — never rendered as an `<Input>`.
- `UserUpdateRequest` DTO: `{ fullName, email, password }` — no `phone` field.
- `UserService.updateUserById()`: calls `userMapper.toUpdate(user, request)` with no pre-save uniqueness checks for email or phone.
- `UserRepository`: has `existsByEmailAndDeletedFalse(String email)` but no phone equivalent.
- `ErrorCode`: has `EMAIL_EXISTED(3001)` but no `PHONE_EXISTED` entry.

## Impact scope

- [x] user-service
- [ ] api-gateway
- [ ] job_service
- [ ] application_service
- [ ] ai_engine_service
- [ ] notification-service
- [ ] Infrastructure (Docker / RabbitMQ / MongoDB / Elasticsearch)

Frontend (`apps/web-candidate`) is also impacted but is not a backend service.

## Related code

### Backend — user-service

| File | Symbol | Change |
|------|--------|--------|
| `src/main/java/…/dtos/request/UserUpdateRequest.java` | `UserUpdateRequest` | Add `phone` field with `@Pattern` validation |
| `src/main/java/…/features/user/UserRepository.java` | `UserRepository` | Add `existsByPhoneAndDeletedFalse(String phone)` |
| `src/main/java/…/features/user/UserService.java` | `updateUserById()` | Add email + phone uniqueness guards before save |
| `src/main/java/…/enums/ErrorCode.java` | `ErrorCode` | Add `PHONE_EXISTED(3006, "Phone number already exists")` |
| `src/main/java/…/dtos/request/RegisterRequest.java` | `RegisterRequest.phone` | Add `@Pattern` for consistency with update endpoint |
| `src/test/…/service/UserServiceTest.java` | `UserServiceTest` | Add tests: email/phone conflict, same-value no-op |

### Frontend — web-candidate

| File | Symbol | Change |
|------|--------|--------|
| `packages/api/openapi/web-candidate.openapi.yaml` | `UserUpdateRequest` schema | Add `phone: { type: string }` property |
| `packages/api/src/generated/model/userUpdateRequest.ts` | `UserUpdateRequest` | Add `phone?: string` (edit directly — static spec is not in orval.config.ts) |
| `apps/web-candidate/src/routes/_account.profile.tsx` | `draft` state | Add `email` and `phone` fields |
| `apps/web-candidate/src/routes/_account.profile.tsx` | `basicInfoFields` | Change email and phone to `editable: true` |
| `apps/web-candidate/src/routes/_account.profile.tsx` | `handleSave()` | Include `email` and `phone` in `updateUser` call; add client-side validation |

## Detailed specification

### 1. Backend: `UserUpdateRequest.java`

Add `phone` with a pattern constraint. Keep email and password as-is (already have `@Email` / `@Size`). Do **not** add `@NotBlank` — this is a partial-update endpoint; null means "don't change this field."

```java
@Pattern(regexp = "^(0|\\+84)(3|5|7|8|9)\\d{8}$", message = "PHONE_INVALID")
String phone;
```

### 2. Backend: `UserRepository.java`

```java
boolean existsByPhoneAndDeletedFalse(String phone);
```

### 3. Backend: `ErrorCode.java`

```java
PHONE_EXISTED(3006, "Phone number already exists"),
```

### 4. Backend: `UserService.updateUserById()`

Add uniqueness guards **before** calling `userMapper.toUpdate()`:

```java
public UserResponse updateUserById(String id, UserUpdateRequest request) {
    User user = userRepository.findByIdAndDeletedFalse(id)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

    // Guard: email uniqueness (skip check if new email equals current email)
    if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
        if (userRepository.existsByEmailAndDeletedFalse(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }
    }

    // Guard: phone uniqueness
    if (request.getPhone() != null && !request.getPhone().equals(user.getPhone())) {
        if (userRepository.existsByPhoneAndDeletedFalse(request.getPhone())) {
            throw new AppException(ErrorCode.PHONE_EXISTED);
        }
    }

    userMapper.toUpdate(user, request);
    if (request.getPassword() != null && !request.getPassword().isBlank()) {
        user.setPassword(passwordEncoder.encode(request.getPassword()));
    }
    user.setUpdatedAt(LocalDateTime.now());
    return userMapper.toUserResponse(userRepository.save(user));
}
```

Note: The uniqueness check for email skips when `request.getEmail().equals(user.getEmail())` to avoid rejecting a user who "saves" their existing email without changing it.

### 5. TypeScript type update — two files, no `pnpm generate:api`

The `generated/users/users.ts` and its model files were generated from `web-candidate.openapi.yaml` which is **no longer in `orval.config.ts`** (removed in a prior refactor). These files are effectively manually maintained.

**Update `web-candidate.openapi.yaml`** in the `UserUpdateRequest` schema for documentation:
```yaml
phone:
  type: string
```

**Directly update `packages/api/src/generated/model/userUpdateRequest.ts`** (do not run `pnpm generate:api` — it does not process this spec):
```typescript
export interface UserUpdateRequest {
  fullName?: string;
  email?: string;
  password?: string;
  phone?: string;  // add this line
}
```

### 6. Backend: `RegisterRequest.java`

For consistency, add `@Pattern` to the `phone` field (currently has no validation):
```java
@Pattern(regexp = "^(0|\\+84)(3|5|7|8|9)\\d{8}$", message = "PHONE_INVALID")
String phone;
```

### 7. Frontend: `_account.profile.tsx`

**Draft state** — add email and phone:
```typescript
const [draft, setDraft] = React.useState({ name: '', email: '', phone: '', location: '', title: '', bio: '' })
```

**`handleEditClick()`** — initialize from profile:
```typescript
setDraft({
  name:     profile?.fullName ?? '',
  email:    profile?.email ?? '',
  phone:    profile?.phone ?? '',
  location: profile?.address ?? '',
  title:    profile?.title ?? '',
  bio:      profile?.bio ?? '',
})
```

**`basicInfoFields`** — make email and phone editable and fix the type:
```typescript
// key type simplifies to keyof typeof draft once email/phone are in draft
const basicInfoFields: Array<{ label: string; key: keyof typeof draft; editable: boolean }> = [
  { label: 'Full Name', key: 'name',     editable: true  },
  { label: 'Email',     key: 'email',    editable: true  },
  { label: 'Phone',     key: 'phone',    editable: true  },
  { label: 'Location',  key: 'location', editable: true  },
  { label: 'Title',     key: 'title',    editable: true  },
]
```

**Remove the `key !== 'email' && key !== 'phone'` guard** in the render condition (line 402 of the current file). It becomes simply:
```typescript
{editMode && editable ? (
  <Input value={draft[key as keyof typeof draft]} onChange={...} />
) : (
  <span>{displayValues[key]}</span>
)}
```

**Client-side validation in `handleSave()`** — validate before API call:
```typescript
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^(0|\+84)(3|5|7|8|9)\d{8}$/

if (!draft.email || !EMAIL_RE.test(draft.email)) {
  toast.error(currentLang === 'vi' ? 'Email không hợp lệ' : 'Invalid email address')
  return
}
if (!draft.phone || !PHONE_RE.test(draft.phone)) {
  toast.error(currentLang === 'vi' ? 'Số điện thoại không hợp lệ (VD: 0901234567)' : 'Invalid phone number (e.g. 0901234567)')
  return
}
```

**`updateUser` call** — include email and phone:
```typescript
updateUser({
  userId: profile.userId,
  data: { fullName: draft.name, email: draft.email, phone: draft.phone },
})
```

**Error handling** — map API error codes to toast messages. The Axios interceptor in `axios-instance.ts` only handles 401s specially; all other HTTP errors pass through as rejected Axios errors with `err.response.data.code` set by the backend's `ApiResponse` wrapper:
```typescript
} catch (err: unknown) {
  const apiCode = (err as any)?.response?.data?.code
  if (apiCode === 3001) {
    toast.error('Email is already taken')
  } else if (apiCode === 3006) {
    toast.error('Phone number is already taken')
  } else {
    await queryClient.invalidateQueries({ queryKey: getGetMe2QueryKey() })
    toast.error('Update failed')
  }
}
```

## Notes

- **Relation to `20260614_1500_profile-email-wiped-on-update.md`** (resolved): that issue added `@BeanMapping(nullValuePropertyMappingStrategy = IGNORE)` to `UserMapper.toUpdate()`. Once `phone` is added to `UserUpdateRequest`, MapStruct will automatically include an `if (request.getPhone() != null) { user.setPhone(...) }` guard — no mapper change is needed.
- **`UserResponse` does not include `phone`**: this is intentional; after a successful profile save, the frontend re-reads phone via `queryClient.invalidateQueries(getGetMe2QueryKey())` → `useGetMe2` → `CandidateResponse.phone` (mapped by `CandidateMapper` from `user.phone`). No change to `UserResponse` is required.
- **Phone regex**: `^(0|\+84)(3|5|7|8|9)\d{8}$` covers Vietnamese mobile numbers (10 digits starting with 03x, 05x, 07x, 08x, 09x) and the `+84` prefix. Adjust if international formats need to be supported.
- **Race condition in uniqueness checks**: the read-then-write pattern (`existsBy…` then `save`) is not atomic. Concurrent requests could both pass the check before either saves. This is acceptable for the project's current scale. A MongoDB unique index on `email` and `phone` fields would eliminate this at the database level, but that migration is out of scope for this issue.
- **OTP for email change**: email changes take effect immediately without verification. The uniqueness guard prevents account takeover. Full OTP flow is a future issue.
- **Static spec generation**: `web-candidate.openapi.yaml` is no longer referenced in `orval.config.ts`. Files in `src/generated/model/`, `src/generated/auth/`, and `src/generated/users/` were generated from this spec previously and are now effectively hand-maintained. Edit them directly; do NOT run `pnpm generate:api` expecting them to be regenerated.
- **Required test cases** for `UserServiceTest`:
  - `updateUserById_shouldThrowEmailExistedWhenEmailTakenByAnotherUser()`
  - `updateUserById_shouldNotThrowWhenEmailUnchanged()` (same email as current → skip check)
  - `updateUserById_shouldThrowPhoneExistedWhenPhoneTakenByAnotherUser()`
  - `updateUserById_shouldNotThrowWhenPhoneUnchanged()`
  - `updateUserById_shouldSkipUniquenessCheckWhenFieldIsNull()` (null = partial update, no check needed)
