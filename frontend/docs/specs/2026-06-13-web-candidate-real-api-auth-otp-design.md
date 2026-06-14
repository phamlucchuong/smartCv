# Web Candidate — Real API Integration & Auth/OTP Design

**Date:** 2026-06-13
**Scope:** Wire all web-candidate pages to real orval-generated API hooks; implement complete auth flow (signup + OTP modal + login + refresh token)

---

## 1. Current State

- `signin.tsx` and `signup.tsx` are fully stubbed — only write `isAuthenticated` to localStorage, no API calls
- `useCandidateStore` holds large amounts of mock data (user profile, experiences, educations, CVs, notifications, jobs, applications, wishlists)
- All orval-generated hooks exist and are ready in `packages/api/src/generated/`
- `axios-instance.ts` reads `localStorage.getItem('token')` for Bearer header; `withCredentials: true` already set
- Backend error code `3003` = user not verified (field: `verified`, not `active`)
- `RegisterRequest` requires `role: string` — hardcode `"CANDIDATE"` from web-candidate

---

## 2. Auth Flow

### 2.1 Signup (`/signup`)

Form field order:
1. Full name
2. Email
3. Phone number ← above password
4. Password (min 8 chars)
5. Confirm password
6. Radio: OTP channel — EMAIL / SMS (maps to `preferredVerification`)

On submit:
1. Client-side validate: confirm password match, password ≥ 8 chars, phone format
2. Call `useRegisterCandidate` with `{ fullname, email, password, phone, preferredVerification, role: "CANDIDATE" }`
3. Success → show `OtpVerifyModal` with `contact` (email or phone) and `verificationType`
4. OTP verified → close modal → navigate `/signin` with toast: _"Account verified! Please log in."_

### 2.2 OTP Verification — Modal (not a route)

**Component:** `apps/web-candidate/src/components/auth/OtpVerifyModal.tsx`

**Props:**
```ts
{
  open: boolean
  contact: string           // email or phone (masked in UI: n***@gmail.com)
  verificationType: 'EMAIL' | 'SMS'
  onSuccess: () => void
  onClose: () => void
}
```

**UI (centered minimal, shadcn `<Dialog>`):**
- 6 individual digit inputs with auto-focus-next and paste support
- Masked contact display
- Countdown timer 60s → enable "Resend OTP" button
- Error state on wrong OTP

**Hooks used:**
- `useVerifyCandidateRegistration` — submit OTP
- `useResendRegistrationOtp` — resend

**Used in:** both `signup.tsx` and `signin.tsx`

### 2.3 Signin (`/signin`)

On submit:
1. Call `useLoginCandidate` with `{ email, password }`
2. Success → `signIn(accessToken, refreshToken)` → navigate `/`
3. Error code `3003` → save `{ email, password }` in component state → open `OtpVerifyModal`
4. After OTP success → automatically re-call `useLoginCandidate` with saved credentials → navigate `/`

---

## 3. Auth State Management

### 3.1 Cookies

| Cookie | Content | Expiry | Flags |
|--------|---------|--------|-------|
| `smart_cv_token` | accessToken | 1 day | `path=/`, `SameSite=Lax` |
| `smart_cv_refresh` | refreshToken | 7 days | `path=/`, `SameSite=Lax` |

Use `js-cookie` library (add to `packages/api` or `web-candidate`).

### 3.2 Axios Interceptor Update (`packages/api/src/axios-instance.ts`)

**Request interceptor:** read `smart_cv_token` from cookie → set `Authorization: Bearer <token>`

**Response interceptor — refresh flow:**
1. On 401 response, check `smart_cv_refresh` cookie
2. If refresh token exists → call `POST /user/api/auth/refresh`
3. Success → update `smart_cv_token` cookie → retry original request
4. Refresh fails → call `signOut()` → redirect `/signin`
5. Use `isRefreshing` flag + request queue to prevent concurrent refresh races

### 3.3 `useAuthStore` (new Zustand store)

**File:** `apps/web-candidate/src/store/useAuthStore.ts`

```ts
interface AuthState {
  userId: string | null
  email: string | null
  role: string | null
  isAuthenticated: boolean        // derived: smart_cv_token cookie exists
  signIn: (accessToken: string, refreshToken: string) => void
  signOut: () => void
}
```

- `signIn`: set both cookies + decode JWT (using `jwt-decode`) → populate `userId`, `email`, `role`
- `signOut`: remove both cookies + reset state
- `persist: false` — auth state is always re-derived from cookies on mount
- `isAuthenticated` initialised by checking cookie existence at store creation

### 3.4 `useCandidateStore` → `usePreferencesStore`

**File rename:** `useCandidateStore.ts` → `usePreferencesStore.ts`

**Keep only:**
```ts
{
  theme: 'dark' | 'light'
  language: 'EN' | 'VI'
  toggleTheme: () => void
  setTheme: (theme) => void
  toggleLanguage: () => void
  syncLanguageFromI18n: (language) => void
}
```

**Remove:** all mock data fields (`user`, `experiences`, `educations`, `skills`, `cvList`, `notifications`, `appliedJobs`, `wishlistJobs`, `jobSuggestions`, `appliedJobIds`) and all associated actions.

Update all import sites across web-candidate.

### 3.5 Route Guard (`_account.tsx`)

```ts
beforeLoad: () => {
  const token = Cookies.get('smart_cv_token')
  if (!token) throw redirect({ to: '/signin' })
}
```

---

## 4. Page → API Hook Mapping

All protected page hooks use `enabled: !!isAuthenticated` from `useAuthStore`.
Loading → shadcn `<Skeleton>`. Error → inline message. Empty → explicit empty state UI.

| Route | Hook(s) | Notes |
|-------|---------|-------|
| `index.tsx` | `useGetFeaturedJobs`, `useGetTopCompanies`, `useGetStats`, `useGetCategories` | Public, no auth guard |
| `jobs/` | `useGetActiveJobs`, `useSearchJobs` | Public |
| `jobs/$jobId` | `useGetJobById`, `useGetRelatedJobs`, `useGetMyApplicationForJob` | `useGetMyApplicationForJob` only when authenticated |
| `companies.tsx` | `useGetAll2` | Public |
| `companies/$companyId` | `useGetById2`, `useGetCompanyJobs`, `useGetRelatedCompanies` | Public |
| `_account.profile` | `useGetMe2` (read) + update mutation | Protected |
| `_account.cv` | `useListCvs` + upload/delete mutations | Protected |
| `_account.applications` | `useGetMyApplications` | Protected |
| `_account.assessments` | `useGetMyAssessments`, `useGetAttemptState` | Protected |
| `_account.job-suggestions` | `useGetJobSuggestions` | Protected |
| `_account.wishlists` | `useGetMyWishlists` + add/remove mutations, `useContains` | Protected |
| `_account.notifications` | No backend hook yet — show empty state with "No notifications" | Protected |
| `_account.settings` | `useGetSettings` + update mutation | Protected |

---

## 5. Error Handling

### API Error Codes

| Code | Meaning | Frontend Action |
|------|---------|-----------------|
| `3003` | User not verified | Open `OtpVerifyModal` |
| `1002` | Email already exists | Inline error under email field |
| `401` | Token expired | Axios interceptor → refresh → retry |
| Refresh fail | Session expired | `signOut()` + redirect `/signin` + toast |
| Network error | Backend unreachable | Toast: "Service unavailable" |

### Client-side Validation (before API call)

- Confirm password ≠ password → inline error, block submit
- Password < 8 chars → inline error, block submit
- Phone format invalid → inline error, block submit
- OTP not 6 digits → submit button disabled

### Toast Strategy

| Event | Toast |
|-------|-------|
| Signup success | "Check your email/phone for the OTP code" |
| OTP verified | "Account verified! Please log in." |
| Login success | None — navigate immediately |
| Sign out | None — navigate to `/signin` |
| Generic API error | Destructive toast with `error.message` |

---

## 6. Dependencies to Add

| Package | Where | Purpose |
|---------|-------|---------|
| `js-cookie` | `web-candidate` | Read/write cookies |
| `@types/js-cookie` | `web-candidate` | TypeScript types |
| `jwt-decode` | `web-candidate` | Decode JWT to extract userId/email/role |

---

## 7. Files Changed Summary

| File | Change |
|------|--------|
| `apps/web-candidate/src/routes/signup.tsx` | Wire `useRegisterCandidate`, new form fields, open `OtpVerifyModal` on success |
| `apps/web-candidate/src/routes/signin.tsx` | Wire `useLoginCandidate`, handle 3003, open `OtpVerifyModal`, re-login after OTP |
| `apps/web-candidate/src/components/auth/OtpVerifyModal.tsx` | New component |
| `apps/web-candidate/src/store/useAuthStore.ts` | New store |
| `apps/web-candidate/src/store/useCandidateStore.ts` → `usePreferencesStore.ts` | Stripped to theme/language only |
| `apps/web-candidate/src/routes/_account.tsx` | Guard uses cookie |
| `packages/api/src/axios-instance.ts` | Cookie-based token, refresh interceptor |
| All `_account.*` route files | Replace mock with real hooks + skeleton/empty states |
| `apps/web-candidate/src/routes/index.tsx` | Replace mock with real hooks |
| `apps/web-candidate/src/routes/jobs/*` | Replace mock with real hooks |
| `apps/web-candidate/src/routes/companies/*` | Replace mock with real hooks |
