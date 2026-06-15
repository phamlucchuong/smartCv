# S3 Pre-signed CV URL Expiry — Add Refresh Mechanism

## Overview

CV URLs stored in `CvItem.url` are S3 pre-signed URLs generated at upload time with a TTL
of `AWS_S3_PRESIGNED_URL_TTL_MINUTES` (default: 60 minutes). After the TTL the URL expires
and the iframe preview on the CV page shows an access-denied error. There is no way to
regenerate the URL because the S3 object key is never stored — only the signed URL is.

## Current behavior

1. `POST /api/candidates/cv/upload` → `S3Service.uploadCv()` generates a pre-signed URL →
   `CandidateService.addCvToList(userId, url, filename)` stores that URL in `CvItem.url`.
2. `GET /api/candidates/cvs` returns `List<CvItem>` directly; `url` is the original stale URL.
3. After 60 minutes the URL returns HTTP 403. The frontend iframe shows an error permanently.
4. No endpoint exists to refresh the URL; re-uploading the same CV is the only workaround.

## Expected behavior

1. `GET /api/candidates/cvs` always returns a fresh, non-expired URL for each CV.
2. A dedicated `GET /api/candidates/cvs/{cvId}/url` endpoint returns a fresh URL on demand
   (used by the frontend to refresh the iframe without refetching the whole list).
3. Backward-compatible: CVs uploaded before this fix (no stored key) continue to return
   their stored URL unchanged.

## Reproduction steps

1. Upload a PDF CV as a CANDIDATE.
2. Wait 60 minutes (or reduce `AWS_S3_PRESIGNED_URL_TTL_MINUTES` to 1 for testing).
3. Navigate to `/cv` → the PDF iframe shows an S3 access-denied error.
4. Call `GET /api/candidates/cvs` → the `url` field is still the expired URL.

## Root cause

`CvItem` stores only `url` (the signed URL), never the S3 object key. Without the key,
`S3Presigner` cannot generate a new URL. The fix is to store `s3Key` on `CvItem` and
regenerate the pre-signed URL on every read in `listCvs`.

For real AWS S3 (no custom `AWS_S3_ENDPOINT_URL`), CVs should use a permanent public URL
(same pattern already used for avatars) to avoid the expiry problem entirely.

## Impact scope

Backend:
- [ ] api-gateway
- [x] user-service — `CvItem`, `S3Service`, `CandidateService`, `CandidateController`
- [ ] job_service
- [ ] application_service
- [ ] ai_engine_service — `UserClient.getCvInfo()` returns `cvUrl`; if the URL is always
      fresh from `listCvs` the ai_engine side requires no changes
- [ ] notification-service
- [ ] Infrastructure

Frontend:
- [x] web-candidate — add auto-refresh when `cv.url` is known to be near expiry (optional;
      backend fix alone is sufficient since `listCvs` always returns fresh URLs on query
      invalidation)

## Related code

| Location | What |
|---|---|
| `backend/user-service/src/main/java/.../candidate/CvItem.java` | Add `s3Key: String` field |
| `backend/user-service/src/main/java/.../candidate/S3Service.java` | `uploadCv()` returns both key + URL |
| `backend/user-service/src/main/java/.../candidate/CandidateService.java` | `addCvToList()` stores `s3Key`; `listCvs()` regenerates URL if key present |
| `backend/user-service/src/main/java/.../candidate/CandidateController.java` | Add `GET /cvs/{cvId}/url` refresh endpoint |

## Implementation plan

### Task 1 — Add `s3Key` to `CvItem`

**File:** `backend/user-service/src/main/java/.../candidate/CvItem.java`

Add one field:
```java
String s3Key;  // S3 object key (e.g. "cvs/userId/uuid.pdf"); null for legacy CVs
```

No migration needed — existing CVs have `s3Key = null`; the refresh path falls back to the
stored URL for those.

### Task 2 — `S3Service.uploadCv()` returns key + URL

Change the return type so callers can store the key.

```java
public record CvUploadResult(String s3Key, String url) {}

public CvUploadResult uploadCv(MultipartFile file, String candidateId) {
    // ... existing validate + putObject code ...
    String key = "cvs/" + candidateId + "/" + UUID.randomUUID() + ".pdf";
    // ... putObject ...
    String url = endpointUrl.isBlank()
        ? "https://" + bucket + ".s3." + region + ".amazonaws.com/" + key  // permanent for real AWS
        : generatePresignedUrl(key);  // pre-signed for MinIO / local dev
    return new CvUploadResult(key, url);
}
```

> Note: for real AWS (`endpointUrl` is blank) use a permanent URL — same pattern as avatars.
> This eliminates expiry for production deployments.
> For MinIO (local dev), keep using pre-signed URLs since the bucket is not publicly accessible.

### Task 3 — `CandidateService` stores key and refreshes on read

**`addCvToList`** — accept `s3Key`:
```java
public void addCvToList(String userId, String s3Key, String url, String filename) {
    // ...
    CvItem item = CvItem.builder()
        .id(UUID.randomUUID().toString())
        .s3Key(s3Key)
        .url(url)
        .filename(filename)
        .isDefault(isFirst)
        .uploadedAt(LocalDateTime.now())
        .build();
    // ...
}
```

**`listCvs`** — regenerate URL for CVs that have a key:
```java
public List<CvItem> listCvs(String userId) {
    List<CvItem> cvs = candidateRepository.findByUserIdAndDeletedFalse(userId)
            .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND))
            .getCvs();
    cvs.forEach(cv -> {
        if (cv.getS3Key() != null) {
            cv.setUrl(s3Service.generateFreshUrl(cv.getS3Key()));
        }
    });
    return cvs;
}
```

Add `generateFreshUrl(String key)` to `S3Service` (identical to `generatePresignedUrl` but
only called when a key exists; for real AWS returns the permanent URL without calling AWS):

```java
public String generateFreshUrl(String key) {
    if (!endpointUrl.isBlank()) {
        return generatePresignedUrl(key);   // MinIO: regenerate signed URL
    }
    return "https://" + bucket + ".s3." + region + ".amazonaws.com/" + key; // AWS: permanent
}
```

### Task 4 — `CandidateController.uploadCv` uses new return type

```java
@PostMapping("/cv/upload")
public ApiResponse<CvUploadResponse> uploadCv(...) {
    CvUploadResult result = s3Service.uploadCv(file, userId);
    candidateService.addCvToList(userId, result.s3Key(), result.url(), file.getOriginalFilename());
    return ApiResponse.<CvUploadResponse>builder()
            .data(new CvUploadResponse(result.url()))
            .message("CV uploaded successfully").build();
}
```

### Task 5 — Add `GET /cvs/{cvId}/url` refresh endpoint

Allows the frontend to get a fresh URL for a single CV without refetching the whole list
(useful for long-lived sessions where the user has the CV page open for hours).

```java
@GetMapping("/cvs/{cvId}/url")
@PreAuthorize("hasAuthority('ROLE_CANDIDATE')")
public ApiResponse<Map<String, String>> refreshCvUrl(
        @PathVariable String cvId,
        @AuthenticationPrincipal String userId) {
    String freshUrl = candidateService.refreshCvUrl(userId, cvId);
    return ApiResponse.<Map<String, String>>builder()
            .data(Map.of("url", freshUrl))
            .message("URL refreshed").build();
}
```

`CandidateService.refreshCvUrl`:
```java
public String refreshCvUrl(String userId, String cvId) {
    Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId)
            .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
    CvItem cv = candidate.getCvs().stream()
            .filter(c -> cvId.equals(c.getId()))
            .findFirst()
            .orElseThrow(() -> new AppException(ErrorCode.CV_NOT_FOUND));
    if (cv.getS3Key() == null) return cv.getUrl();  // legacy: no key, return stored
    return s3Service.generateFreshUrl(cv.getS3Key());
}
```

### Task 6 — TDD: write tests before each implementation step

Per-task tests:
- `CvItemTest` — `s3Key` field is present and serialized
- `S3ServiceTest` — `uploadCv()` returns `CvUploadResult` with non-null key and url
- `CandidateServiceRefreshTest` — `listCvs()` calls `s3Service.generateFreshUrl` for CVs
  with a non-null key; CVs with null key return stored url unchanged
- `CandidateControllerRefreshUrlTest` — `GET /cvs/{cvId}/url` returns 200 with `url` key

Use `MockMvcBuilders.standaloneSetup()` (not `@WebMvcTest`) to avoid `@EnableMongock` issues.

### Task 7 — Frontend: auto-refresh on query refocus (optional enhancement)

`useListCvs` already uses TanStack Query. Set `staleTime` shorter than the URL TTL so a
refocus refetches the list (and gets fresh URLs from the backend).

In `_account.cv.tsx`:
```tsx
const { data } = useListCvs({
  query: {
    enabled: isAuthenticated,
    staleTime: 30 * 60 * 1000,    // 30 min — refetch before 60 min TTL expires
    refetchOnWindowFocus: true,
  }
})
```

This is sufficient — no frontend URL parsing or expiry tracking needed.

## Gotchas

- **`setDefaultCv` also stores `cv.getUrl()` in `Candidate.cvUrl`** — this field is a
  legacy "primary CV URL" used in some places. After this fix `setDefaultCv` should store
  a fresh URL (call `generateFreshUrl` at the time of the set-default operation) or store
  the `s3Key` on `Candidate` too. Simplest: call `s3Service.generateFreshUrl(cv.getS3Key())`
  and set `candidate.setCvUrl(...)` at set-default time.
- **`CvInfoResponse` in user-service** used by ai_engine_service — `getCvInfo` returns the
  stored `url`. After this fix, `getCvInfo` should also call `generateFreshUrl` if `s3Key`
  is present, so the ai_engine_service always gets a valid URL for text extraction.
- **MinIO pre-signed regeneration is cheap** — it is a local HMAC computation, no network
  round-trip. Calling it on every `listCvs` is safe.
- **`AWS_S3_PRESIGNED_URL_TTL_MINUTES` default 60** — increase to `10080` (7 days) in
  `.env.example` as a belt-and-suspenders safeguard while the fix is rolled out.

## Notes

- The same issue may affect avatar URLs stored on `Candidate.avatarUrl`, but avatars already
  use the permanent URL on real AWS and only pre-signed on MinIO. CV upload currently always
  uses pre-signed even on real AWS — this fix also corrects that inconsistency.
- This issue does not require changes to the API Gateway or any other service.
