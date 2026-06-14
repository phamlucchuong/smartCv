# CV Page — Wire Upload and All CV Actions to Live API

## Overview

The CV page (`_account.cv.tsx`) has a complete UI (upload zone, CV list, action buttons) and `useListCvs` is already wired, but all mutations are stubbed with `toast.info(...)`. This issue wires every action to its generated hook, fixes a status enum mismatch, enforces PDF-only on the upload, and sorts the default CV to the top of the list.

## Current behavior

- `handleUpload()` always shows `toast.info('CV upload coming soon')` — no file is sent to the backend.
- Set-default, re-analyze, and delete buttons all show stub toasts.
- The status badge for a `DONE` analysis always renders as "Chờ xử lý" (PENDING style) because the style map uses key `'COMPLETED'` but the generated enum value is `'DONE'`.
- The CV list is unsorted — the default CV may appear anywhere.
- The UI accepts `.doc`/`.docx` but the backend `S3Service.validateFile()` only accepts `application/pdf` and will return an error for those types.

## Expected behavior

1. Selecting a PDF file (drag-and-drop or file picker) uploads it to the backend and shows a success toast; the CV list refreshes automatically.
2. The delete button calls the delete endpoint; the list refreshes and the next most-recent CV is selected.
3. The set-default button calls the set-default endpoint; the badge updates.
4. The re-analyze button calls the re-analyze endpoint; the status badge resets to PENDING.
5. The default CV is always shown first in the left-side list.
6. The `DONE` analysis status renders with the correct "Đã phân tích" / success style badge.

## Reproduction steps

1. Log in as a CANDIDATE.
2. Navigate to `/cv`.
3. Drag a PDF into the upload zone → toast says "coming soon", no upload happens.
4. Upload a CV via backend tooling so the list is non-empty; observe that if analysis is `DONE` the badge incorrectly shows "Chờ xử lý".
5. Click Set Default / Re-analyze / Delete → all show stub toasts.

---

## Impact scope

Backend:
- [ ] api-gateway
- [x] user-service — `S3Service.uploadCv()` (PDF validation is correct, no change needed)
- [ ] job_service
- [ ] application_service
- [ ] ai_engine_service
- [ ] notification-service
- [ ] Infrastructure

Frontend:
- [x] web-candidate — `src/routes/_account.cv.tsx`
- [ ] web-recruiter
- [ ] web-admin
- [x] packages/api — `AXIOS_INSTANCE` used directly for the upload
- [ ] packages/ui
- [ ] packages/i18n

---

## Related code

| Location | What |
|---|---|
| `frontend/apps/web-candidate/src/routes/_account.cv.tsx` | Main target — all stubs live here |
| `frontend/packages/api/src/generated/user/candidate-controller/candidate-controller.ts` | `useSetDefaultCv`, `useDeleteCv`, `useReanalyzeCv`, `useListCvs`, `getListCvsQueryKey` |
| `frontend/packages/api/src/generated/user/model/cvItemAnalysisStatus.ts` | Enum: `PENDING \| PROCESSING \| DONE \| FAILED` |
| `frontend/packages/api/src/axios-instance.ts` | `AXIOS_INSTANCE` — used directly for the upload to send `multipart/form-data` |
| `backend/user-service/.../candidate/CandidateController.java` | `POST /api/candidates/cv/upload` (requires ROLE_CANDIDATE) |
| `backend/user-service/.../candidate/S3Service.java` | `uploadCv()` — validates PDF, stores in `cvs/{userId}/{UUID}.pdf` |

---

## Implementation plan

### 0. Add named export for AXIOS_INSTANCE (prerequisite for Step 4)

`axios-instance.ts` only has `export default AXIOS_INSTANCE`. The barrel `index.ts` does `export * from './axios-instance'`, which does **not** re-export default exports. Add a named export so the barrel picks it up:

```ts
// frontend/packages/api/src/axios-instance.ts — add at bottom:
export { AXIOS_INSTANCE }
```

After this change, `import { AXIOS_INSTANCE } from '@smart-cv/api'` works. This step must be done before Step 4.

### 1. Fix the status enum mismatch (zero-risk, one line)

`cvStatusStyle` and `cvStatusLabel` in `_account.cv.tsx` use key `'COMPLETED'`, but `CvItemAnalysisStatus` exports `'DONE'`.

```tsx
// Before
const cvStatusStyle: Record<string, string> = {
  COMPLETED: 'bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success)]/20',
  ...
}
const cvStatusLabel: Record<string, string> = {
  COMPLETED: 'Đã phân tích',
  ...
}

// After
const cvStatusStyle: Record<string, string> = {
  DONE: 'bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success)]/20',
  ...
}
const cvStatusLabel: Record<string, string> = {
  DONE: 'Đã phân tích',
  ...
}
```

### 2. Sort default CV to top of list

Sort immediately after receiving `data` from `useListCvs`:

```tsx
const cvList = React.useMemo(() => {
  const raw = data?.data ?? []
  return [...raw].sort((a, b) => (b.default ? 1 : 0) - (a.default ? 1 : 0))
}, [data])
```

### 3. Enforce PDF-only in the upload handler

```tsx
// Change file input:
<input ref={fileRef} type="file" accept=".pdf" ... />

// Update handleUpload validation:
const validType = file.type === 'application/pdf'
if (!validType) {
  toast.error(t('account_upload_invalid_type'))
  return
}
```

Also update the UI subtitle from "PDF, DOCX" to "PDF" only (two places in the JSX).

### 4. Wire CV upload via direct AXIOS_INSTANCE call

The generated `useUploadCv` sends `Content-Type: application/json`, which the backend rejects. Use `AXIOS_INSTANCE` directly (after Step 0 adds the named export) with `FormData` inside a `useMutation`.

**Important**: do NOT set `Content-Type: 'multipart/form-data'` manually — Axios automatically sets it with the correct `boundary` parameter when it detects a `FormData` body. Setting it manually removes the boundary and breaks multipart parsing on the backend.

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AXIOS_INSTANCE, getListCvsQueryKey } from '@smart-cv/api'

const queryClient = useQueryClient()

const uploadMutation = useMutation({
  mutationFn: async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    // No Content-Type header — Axios auto-sets multipart/form-data with boundary
    return AXIOS_INSTANCE.post('/api/candidates/cv/upload', form)
  },
  onSuccess: () => {
    toast.success(t('account_upload_success'))
    queryClient.invalidateQueries({ queryKey: getListCvsQueryKey() })
  },
  onError: () => toast.error('Upload failed. Please try again.'),
})

const handleUpload = (file: File | null) => {
  if (!file) return
  if (cvList.length >= 10) {
    toast.error('You have reached the 10 CV limit. Delete a CV before uploading a new one.')
    return
  }
  if (file.type !== 'application/pdf') {
    toast.error(t('account_upload_invalid_type'))
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    toast.error(t('account_upload_too_large'))
    return
  }
  uploadMutation.mutate(file)
}
```

Disable the upload zone and button while uploading or at the 10-CV limit:

```tsx
const uploadDisabled = uploadMutation.isPending || cvList.length >= 10

// Drag-and-drop zone:
<div
  className={`... ${uploadDisabled ? 'pointer-events-none opacity-50' : ''}`}
  onDrop={(e) => {
    e.preventDefault()
    if (!uploadDisabled) handleUpload(e.dataTransfer.files[0] ?? null)
  }}
  ...
>
  ...
  <Button variant="outline" disabled={uploadDisabled} onClick={() => fileRef.current?.click()}>
    {uploadMutation.isPending ? 'Đang tải...' : 'Chọn file'}
  </Button>
</div>
```

### 5. Wire Set Default

```tsx
import { useSetDefaultCv } from '@smart-cv/api'

const setDefaultMutation = useSetDefaultCv({
  mutation: {
    onSuccess: () => {
      toast.success(t('account_cv_default_set'))
      queryClient.invalidateQueries({ queryKey: getListCvsQueryKey() })
    },
    onError: () => toast.error('Failed to set default CV'),
  }
})

// In JSX — set-default button:
<Button
  size="sm"
  variant="ghost"
  disabled={cv.default || setDefaultMutation.isPending}
  onClick={() => cv.id && setDefaultMutation.mutate({ cvId: cv.id })}
>
  <Star className={`h-4 w-4 ${cv.default ? 'fill-[var(--warning)] text-[var(--warning)]' : ''}`} />
</Button>
```

### 6. Wire Re-analyze

Disable re-analyze when the CV is already in `PROCESSING` or `PENDING` state — triggering a reanalysis on an already-queued CV would create a duplicate job.

```tsx
import { useReanalyzeCv } from '@smart-cv/api'
import type { UserModels } from '@smart-cv/api'

const reanalyzeMutation = useReanalyzeCv({
  mutation: {
    onSuccess: () => {
      toast.success(t('account_cv_reanalyzing'))
      queryClient.invalidateQueries({ queryKey: getListCvsQueryKey() })
    },
    onError: () => toast.error('Failed to start reanalysis'),
  }
})

const reanalyzeDisabled =
  reanalyzeMutation.isPending ||
  cv.analysisStatus === UserModels.CvItemAnalysisStatus.PROCESSING ||
  cv.analysisStatus === UserModels.CvItemAnalysisStatus.PENDING

// In JSX:
<Button
  size="sm"
  variant="ghost"
  disabled={reanalyzeDisabled}
  onClick={() => cv.id && reanalyzeMutation.mutate({ cvId: cv.id })}
>
  <RefreshCw className={`h-4 w-4 ${reanalyzeMutation.isPending ? 'animate-spin' : ''}`} />
</Button>
```

### 7. Wire Delete

After deletion, clear `userSelected` if the deleted CV was selected so the UI falls back to the next default/first CV.

```tsx
import { useDeleteCv } from '@smart-cv/api'

const deleteMutation = useDeleteCv({
  mutation: {
    onSuccess: (_, variables) => {
      toast.success(t('account_cv_deleted'))
      if (userSelected === variables.cvId) setUserSelected(null)
      queryClient.invalidateQueries({ queryKey: getListCvsQueryKey() })
    },
    onError: () => toast.error('Failed to delete CV'),
  }
})

// In JSX — delete button should pass cvId, not cv.id:
<Button
  size="sm"
  variant="ghost"
  disabled={cv.default || deleteMutation.isPending}
  onClick={() => cv.id && deleteMutation.mutate({ cvId: cv.id })}
  className="text-[var(--danger)] hover:bg-[var(--danger-soft)] disabled:opacity-30"
>
  <Trash2 className="h-4 w-4" />
</Button>
```

### 8. Verify exports are correct after Step 0

After adding `export { AXIOS_INSTANCE }` to `axios-instance.ts` (Step 0), verify:

```bash
cd frontend && pnpm -F web-candidate typecheck
```

The import `import { AXIOS_INSTANCE, getListCvsQueryKey } from '@smart-cv/api'` should resolve without errors. No other changes to `index.ts` are needed — `export * from './axios-instance'` already picks up named exports.

---

## Gotchas

- **`useSetDefaultCv` / `useDeleteCv` / `useReanalyzeCv` hook signature**: All three take `{ cvId: string }` as the mutation variable. The generated hook wraps this in an object — call `mutation.mutate({ cvId: cv.id! })`, not `mutation.mutate(cv.id)`.
- **`getListCvsQueryKey()` must be imported from the generated file**, not constructed manually. It is already exported from `candidate-controller.ts` and re-exported via `packages/api/src/index.ts`.
- **`cv.default` is the field name** (matches the Java `isDefault` serialization to `default` in JSON). TypeScript allows `cv.default` as a property access — no rename needed.
- **Delete is disabled when `cv.default === true`**: keep this guard; deleting the default CV is not allowed by the backend either.
- **Upload loading state**: disable both the drag zone and the "Chọn file" button while `uploadMutation.isPending` to prevent double-submit.
- **`CvItemAnalysisStatus.DONE`** (not `'COMPLETED'`) is the enum value for a successfully analyzed CV. The old `COMPLETED` key in the style/label maps is dead code.
- **Do NOT set `Content-Type: 'multipart/form-data'` manually** on the upload request — Axios sets it automatically with the correct `boundary` when it detects a `FormData` body. Manual override breaks multipart parsing.
- **Upload URL**: use `/api/candidates/cv/upload` (not `/user/api/candidates/...`) — the axios interceptor auto-prefixes `/api/candidates/*` with `/user`, keeping the pattern consistent with all other generated hooks.

## Intentional deferrals

- **Empty state (0 CVs)**: When the CV list is empty the right panel is hidden and only the upload zone is shown. No explicit empty-state message is planned — the upload zone already communicates the next action.
- **Delete confirmation dialog**: Delete is wired directly on click. A confirm dialog (e.g. `AlertDialog`) would improve safety but is deferred. The `disabled={cv.default}` guard prevents accidental deletion of the primary CV.
- **Auto-select newly uploaded CV**: After upload, `userSelected` is not changed; the list falls back to the existing default. A brief loading flash may appear before the refetch completes on first-ever upload. Acceptable for MVP.

## Notes

- Avatar upload (implemented in issue `20260614_1900_profile-manager-real-api-hooks.md`) uses a separate endpoint (`POST /candidates/me/avatar`) and a dedicated `uploadAvatar()` method in `S3Service`. The CV upload endpoint (`POST /candidates/cv/upload`) already exists and is stable — this issue is purely frontend wiring.
- DOCX support is intentionally out of scope. Backend `S3Service.validateFile()` only accepts `application/pdf`; the UI should reflect this (PDF-only accept attribute and subtitle text).
- CV preview (`<Eye>` button) remains a stub — it requires a separate viewer integration and is out of scope.
