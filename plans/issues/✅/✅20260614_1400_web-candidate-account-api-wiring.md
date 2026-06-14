# [Feature] Wire Real API Hooks for Web Candidate Account Pages

## Overview

The account section of `web-candidate` (`_account.profile`, `_account.cv`, `_account.settings`) already imports the generated hooks from `@smart-cv/api` for **read** operations, but all **write** operations (mutations) are currently stubbed with `toast.info('... coming soon')`. The backend endpoints already exist and the generated mutation hooks are already published in the API package. This issue tracks replacing every stub with a real hook call.

Related prior report: `backend/plans/issues/20260609_web_candidate_missing_api_report.md` (Section 4.4, 4.5 — settings and CV management wiring).

---

## Reproduction steps

1. Open `http://localhost:5173` and sign in as a candidate.
2. Navigate to `/profile` → click **Edit Profile** → modify any field → click **Save**.
   - Observe: `toast.info('Profile update coming soon')` fires; no API call is made.
3. Navigate to `/cv` → drag-drop a PDF → observe no upload occurs.
4. Click **Set Default** on a CV → `toast.info('Set default coming soon')`.
5. Navigate to `/settings` → toggle any **Notification** or **Privacy** switch → `toast.info('Settings update coming soon')`.
6. Try **Change Password** → `toast.info('Password update coming soon')`.
7. Try **Delete Account** → `signOut()` is called locally only; no server-side deletion occurs.

---

## Expected behavior

Each user action in the account section should call the corresponding API endpoint, show a success toast on completion, show an error toast on failure, and invalidate/refetch affected queries so the UI reflects the updated state.

---

## Current behavior

All mutation paths show placeholder `toast.info('... coming soon')` messages and exit early without calling any API. The only real API calls today are reads: `useGetMe2`, `useListCvs`, `useGetSettings`.

---

## Detailed scope — what to wire up

### 3.1 Profile page (`src/routes/_account.profile.tsx`)

| User action | Current behavior | Target hook | Notes |
|---|---|---|---|
| Save basic info (name, phone, address, title, bio) | `toast.info(...)` | `useUpdate1({id: profile.id, data: CandidateRequest})` | `profile.id` is the candidate document ID from `useGetMe2` response |
| Add experience | `toast.info(...)` | `useUpdate1` with `data.experiences = [...existing, newItem]` | Must build new experiences array from current `profile.experiences` + form state |
| Edit experience | `toast.info(...)` | `useUpdate1` with `data.experiences = existing.map(replace at idx)` | |
| Delete experience | `toast.info(...)` | `useUpdate1` with `data.experiences = existing.filter(remove at idx)` | |
| Add education | `toast.info(...)` | `useUpdate1` with `data.educations = [...existing, newItem]` | |
| Edit education | `toast.info(...)` | `useUpdate1` with `data.educations = existing.map(replace at idx)` | |
| Delete education | `toast.info(...)` | `useUpdate1` with `data.educations = existing.filter(remove at idx)` | |
| Add skill | `toast.info(...)` | `useUpdate1` with `data.skills = [...existing, newSkill]` | Deduplicate before submit |
| Remove skill (× button) | `toast.info(...)` | `useUpdate1` with `data.skills = existing.filter(s => s !== skill)` | |
| CV file upload (in profile "Skills & CV" card) | `toast.info(...)` | `useUploadCv` — **see §3.4 below** | Must use FormData, not JSON |

After any `useUpdate1` call: invalidate `useGetMe2` query key so the sidebar and display values refresh.

### 3.2 CV Manager page (`src/routes/_account.cv.tsx`)

| User action | Current behavior | Target hook | Notes |
|---|---|---|---|
| Upload CV (drag-drop or file picker) | `toast.info(...)` | `useUploadCv` — **see §3.4** | After success: invalidate `useListCvs` |
| Set default CV (⭐ button) | `toast.info(...)` | `useSetDefaultCv({cvId: cv.id})` | After success: invalidate `useListCvs` |
| Delete CV (trash button) | `toast.info(...)` | `useDeleteCv({cvId: cv.id})` | Guard: button is already `disabled` when `cv.default === true` — keep that guard; after success invalidate `useListCvs` |
| Re-analyze CV (refresh button) | `toast.info(...)` | `useReanalyzeCv({cvId: cv.id})` | After success: show "Re-analysis triggered" toast; invalidate `useListCvs` to pick up status change |

### 3.3 Settings page (`src/routes/_account.settings.tsx`)

| User action | Current behavior | Target hook | Notes |
|---|---|---|---|
| Change Password | `toast.info(...)` | `useChangeMyPassword({data: {currentPassword, newPassword}})` | Hook is from `users.ts`; endpoint `PUT /user/api/users/me/password`; on **success**: clear all three inputs (current, new, confirm); on **error**: clear only new + confirm, keep current so the user can retry |
| Toggle job recommendation emails | `toast.info(...)` | `useUpdateNotifications` — see merge pattern below | Must send the full `NotificationPreferences` object |
| Toggle application update emails | `toast.info(...)` | `useUpdateNotifications` — see merge pattern below | Same |
| Toggle push notifications | `toast.info(...)` | `useUpdateNotifications` — see merge pattern below | Same |
| Toggle marketing emails | `toast.info(...)` | `useUpdateNotifications` — see merge pattern below | Same |
| Toggle Show CV to Recruiters | `toast.info(...)` | `useUpdatePrivacy` — see merge pattern below | Must send full `PrivacySettings` |
| Toggle Show Contact Info | `toast.info(...)` | `useUpdatePrivacy` — see merge pattern below | Same |
| Activity Status toggle | `toast.info(...)` | **Remove this toggle entirely** — no backend field exists in `PrivacySettings` | See §3.3.1 below |
| Delete Account (confirm dialog) | `signOut()` only | `useDeleteMyAccount()` then `signOut()` on success | Current code calls `signOut()` synchronously without server-side deactivation |

After `useUpdateNotifications` or `useUpdatePrivacy`: invalidate `useGetSettings` query key.

**Notification and Privacy toggle merge pattern** — the backend replaces the entire preferences object on each PUT, so always merge the toggled field into the full current object before sending. Read current values from the `useGetSettings` response:

```typescript
const currentNotifs = settingsPayload?.notifications ?? {}
updateNotifications({
  data: {
    emailApplicationUpdates: currentNotifs.emailApplicationUpdates ?? false,
    emailJobSuggestions: currentNotifs.emailJobSuggestions ?? false,
    pushNotifications: currentNotifs.pushNotifications ?? false,
    marketingEmails: currentNotifs.marketingEmails ?? false,
    [changedField]: newValue,   // override the toggled field
  }
})
```

Apply the same merge pattern for `useUpdatePrivacy` using `settingsPayload?.privacy`.

After either `useUpdateNotifications` or `useUpdatePrivacy` succeeds → invalidate the `useGetSettings` query key so the toggles reflect the server's confirmed state.

**§3.3.1 — Activity Status field** — The current `SettingsPage` renders a third privacy toggle ("Activity Status") hardcoded to `false`. `PrivacySettings` has no corresponding backend field. **Remove this toggle** from the UI. Do not add a new backend field for it in this issue.

**Update Email** — no dedicated endpoint for changing the candidate's email exists yet (the `changePassword` endpoint covers password only). This field should remain disabled / hidden until a server-side email-change flow is added.

---

### 3.4 CV Upload — multipart/form-data mismatch (blocker)

The **generated** `useUploadCv` hook sets `Content-Type: application/json` and serializes `UploadCvBody = { file: Blob }` as JSON (which produces `{}`). The backend `CandidateController` expects:

```
POST /api/candidates/cv/upload
Content-Type: multipart/form-data
@RequestParam("file") MultipartFile file
```

The generated hook **cannot** call this endpoint correctly as-is.

**Required fix (one of two options):**

**Option A** — Custom upload wrapper (recommended, lowest risk):
Create a helper `uploadCvFile(file: File): Promise<ApiResponseCvUploadResponse>` that builds a `FormData`, attaches the file under the key `"file"`, and calls `customInstance` directly with `Content-Type: multipart/form-data`. This bypasses the broken generated hook and does not require regenerating the API package.

```typescript
// packages/api/src/cv-upload.ts (new file)
import { customInstance } from './axios-instance';
import type { ApiResponseCvUploadResponse } from './generated/user/model';

export function uploadCvFile(file: File) {
  const form = new FormData();
  form.append('file', file);
  return customInstance<ApiResponseCvUploadResponse>({
    url: '/api/candidates/cv/upload',
    method: 'POST',
    headers: { 'Content-Type': 'multipart/form-data' },
    data: form,
  });
}
```

**Option B** — Fix the OpenAPI spec and regenerate:
Update the `/api/candidates/cv/upload` endpoint in `openapi/live/user-service.json` to use `requestBody` with `multipart/form-data`, then run `pnpm run generate` to regenerate the hook correctly.

---

## Impact scope

- [ ] api-gateway
- [ ] user-service
- [x] frontend: `apps/web-candidate`
- [x] frontend: `packages/api` (CV upload multipart fix)
- [ ] job_service
- [ ] application_service
- [ ] ai_engine_service
- [ ] notification-service
- [ ] Infrastructure (Docker / RabbitMQ / MongoDB / Elasticsearch)

---

## Related code

### Frontend files to modify
| File | Changes |
|---|---|
| `frontend/apps/web-candidate/src/routes/_account.profile.tsx` | Replace all `toast.info('... coming soon')` with `useUpdate1` and `useUploadCv` calls |
| `frontend/apps/web-candidate/src/routes/_account.cv.tsx` | Replace upload/default/delete/reanalyze stubs with real hooks |
| `frontend/apps/web-candidate/src/routes/_account.settings.tsx` | Replace password/notification/privacy/delete stubs with real hooks |
| `frontend/packages/api/src/cv-upload.ts` (new) | Custom multipart upload helper (if Option A is chosen) |
| `frontend/packages/api/src/index.ts` | Export `uploadCvFile` if Option A is chosen |

### Key hooks (already in `@smart-cv/api`)
| Hook | File | Mutation signature |
|---|---|---|
| `useUpdate1` | `generated/user/candidate-controller/candidate-controller.ts:180` | `{id: string; data: CandidateRequest}` |
| `useUploadCv` | `generated/user/candidate-controller/candidate-controller.ts:608` | `{data: UploadCvBody}` — broken for multipart, use wrapper |
| `useSetDefaultCv` | `generated/user/candidate-controller/candidate-controller.ts:663` | `{cvId: string}` |
| `useDeleteCv` | `generated/user/candidate-controller/candidate-controller.ts:1289` | `{cvId: string}` |
| `useReanalyzeCv` | `generated/user/candidate-controller/candidate-controller.ts:550` | `{cvId: string}` |
| `useUpdateNotifications` | `generated/user/candidate-controller/candidate-controller.ts:349` | `{data: NotificationPreferences}` |
| `useUpdatePrivacy` | `generated/user/candidate-controller/candidate-controller.ts:292` | `{data: PrivacySettings}` |
| `useDeleteMyAccount` | `generated/user/candidate-controller/candidate-controller.ts:976` | `void` |
| `useChangeMyPassword` | `generated/users/users.ts:317` | `{data: ChangePasswordRequest}` |

### Key model types
| Type | Fields |
|---|---|
| `CandidateRequest` | `userId?, dob?, gender?, address?, bio?, title?, avatarUrl?, skills?, yearsOfExperience?, experiences?, educations?, certifications?, languages?, jobType?, preferredLocation?, expectedSalaryMin?, expectedSalaryMax?, portfolioUrl?, githubUrl?, linkedinUrl?` |
| `NotificationPreferences` | `emailApplicationUpdates?, emailJobSuggestions?, pushNotifications?, marketingEmails?` |
| `PrivacySettings` | `profileVisibility?, showCvToRecruiters?, showContactInfo?` |
| `ChangePasswordRequest` | `currentPassword: string; newPassword: string (min 8)` |
| `WorkExperience` | `title?, company?, location?, startDate? (YYYY-MM), endDate? (YYYY-MM), current?` |
| `Education` | `institution?, degree?, startYear?, endYear?` |

### Backend endpoints confirmed
All endpoints are implemented and accessible through the API gateway:
- `PUT /user/api/candidates/{id}` — update candidate (`CandidateController.java:51`)
- `POST /user/api/candidates/cv/upload` — upload CV (`CandidateController.java:65`)
- `PATCH /user/api/candidates/cvs/{cvId}/default` — set default CV (`CandidateController.java:83`)
- `DELETE /user/api/candidates/cvs/{cvId}` — delete CV (`CandidateController.java:89`)
- `POST /user/api/candidates/cvs/{cvId}/reanalyze` — re-analyze CV (`CandidateController.java:95`)
- `PUT /user/api/candidates/settings/notifications` — update notifications (`CandidateController.java:119`)
- `PUT /user/api/candidates/settings/privacy` — update privacy (`CandidateController.java:126`)
- `DELETE /user/api/candidates/me` — delete account (`CandidateController.java:133`)
- `PUT /user/api/users/me/password` — change password (`UserController.java:64`)

---

## Notes

- `CandidateRequest` does **not** include `fullName`, `email`, or `phone` — these are read-only via `CandidateResponse` (derived from the user record). The profile "Edit" form currently includes fullName/email/phone fields but these cannot be updated via `PUT /candidates/{id}`. Either hide those fields in edit mode or add a separate `PUT /users/me` call. The existing `updateUser` hook (`users.ts:215`) could update the user record for name/phone.
- `useUpdate1` requires the **candidate document ID** (`profile.id`), not the user ID. The profile page already has access to this from `useGetMe2` response (`data?.data?.id`).
- For the notification/privacy toggles, always send the full preferences object (not a partial patch) because the backend endpoint replaces the entire record. Read current values from the `useGetSettings` response and merge the toggled field before sending.
- The `Email Address` field in Settings has no backend write endpoint yet — leave it read-only with a visual indicator until an email-change flow is implemented.
- Query cache invalidation is required after each successful mutation to keep UI consistent:
  - After profile update → invalidate `useGetMe2` query key
  - After CV operations → invalidate `useListCvs` query key
  - After settings mutations → invalidate `useGetSettings` query key
