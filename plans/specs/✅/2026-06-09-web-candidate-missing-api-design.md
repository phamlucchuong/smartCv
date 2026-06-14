✅

# Web Candidate Missing API — Design Spec

**Date:** 2026-06-09
**Scope:** Implement missing backend APIs for `web-candidate` frontend (P0 + P1 + P2, excluding Assessments)
**Source report:** `plans/issues/20260609_web_candidate_missing_api_report.md`

---

## 1. Architecture Decision

**Approach: Extend existing services. No new microservice.**

| Domain | Service | Rationale |
|---|---|---|
| Company Directory | `user-service` | Data already in `Recruiter` collection |
| Wishlists | `user-service` | Candidate-owned data, same DB |
| CV Management | `user-service` | Extend `Candidate` entity |
| Candidate Settings | `user-service` | Embed in `Candidate` |
| Enrich Applications | `application_service` | Enrich response at source |
| Job Suggestions Feed | `user-service` + `ai_engine_service` | Cache in `Candidate`, compute in AI |
| Job Detail Aggregate | `job_service` + `application_service` | Separate lightweight endpoints |
| Public Home Aggregates | `job_service` | MongoDB aggregation on Job collection |
| Company Follow | `user-service` | Field in `Candidate` entity |

### Gateway Changes

```yaml
# New public routes (no auth required):
- /user/api/companies/**
- /job/api/home/**
- /job/api/jobs/{id}/related
- /application/api/applications/by-job/{jobId}/mine  # auth required
```

---

## 2. P0 — Company Directory (`user-service`)

### Rationale for separate CompanyController

`RecruiterController` is recruiter self-management (authenticated, RECRUITER/ADMIN roles). Company directory is public candidate-facing browsing. They differ in:
- Security: company endpoints are mostly public
- Response shape: `CompanyResponse` excludes sensitive recruiter fields (`taxCode`, `businessLicenseUrl`, `quotaJobPost`, `quotaCvViews`, `contactEmail`, `status`)
- Query patterns: search/filter by `industry`, `size`, `location`, `query`

### New files

```
user-service/src/main/java/vn/chuongpl/user_service/features/company/
  CompanyResponse.java
  CompanyController.java      # /api/companies
  CompanyService.java         # delegates to RecruiterRepository
```

### CompanyResponse (public fields only)

```java
String id;                  // recruiter ID
String name;                // companyName
String logoUrl;
String coverImageUrl;
String industry;
String size;                // companySize
String location;            // companyAddress
String country;
String website;             // companyWebsite
String description;         // companyDescription
String foundedYear;
Integer activeJobCount;     // null in list view, computed in detail view
```

### Endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET /api/companies` | public | Filter: `query`, `industry`, `size`, `location`, `page`, `size` |
| `GET /api/companies/{id}` | public | id = recruiter ID. Includes `activeJobCount` via JobClient |
| `GET /api/companies/{id}/jobs` | public | Calls job_service internal endpoint |
| `GET /api/companies/{id}/related` | public | P2 — filter same `industry`, exclude current |
| `POST /api/companies/{id}/follow` | CANDIDATE | P2 — add to `followedCompanyIds` |
| `DELETE /api/companies/{id}/follow` | CANDIDATE | P2 |
| `GET /api/companies/followed` | CANDIDATE | P2 — list followed companies |

### activeJobCount strategy

- **List view** (`GET /api/companies`): `activeJobCount = null` — avoid N+1 calls to job_service
- **Detail view** (`GET /api/companies/{id}`): compute via `JobClient.countByRecruiterIdAndStatusActive(recruiterId)`

---

## 3. P0 — Wishlists (`user-service`)

### New files

```
user-service/src/main/java/vn/chuongpl/user_service/features/wishlist/
  Wishlist.java               # @Document(collection = "wishlists")
  WishlistRepository.java
  WishlistResponse.java
  WishlistController.java     # /api/wishlists
  WishlistService.java
```

### Wishlist entity

```java
@Document(collection = "wishlists")
String id;
String candidateId;
String jobId;
LocalDateTime savedAt;
boolean deleted = false;
```

Unique index on `(candidateId, jobId)`.

### WishlistResponse

```java
String jobId;
String title;
String company;
String logoUrl;
Integer salaryMin, salaryMax;
String location;
List<String> skills;
String jobType;
LocalDateTime savedAt;
String status;              // job status (ACTIVE/CLOSED)
```

### Endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET /api/wishlists` | CANDIDATE | List saved jobs. Batch-fetch job info via JobClient |
| `POST /api/wishlists` | CANDIDATE | Body: `{ jobId }`. Re-save existing job updates `savedAt` |
| `DELETE /api/wishlists/{jobId}` | CANDIDATE | Soft delete |
| `GET /api/wishlists/contains/{jobId}` | CANDIDATE | Returns `{ saved: boolean }` |

**Job data join:** `WishlistService` fetches all jobIds in one batch call to job_service (not N individual calls).

---

## 4. P0 — CV Management (`user-service`)

### Entity changes

```java
// CvItem — embedded object, not a @Document
public class CvItem {
    String id;                      // UUID generated at upload
    String url;                     // S3 URL
    String filename;                // original filename
    boolean isDefault;
    LocalDateTime uploadedAt;
    CvAnalysisStatus analysisStatus; // PENDING, PROCESSING, DONE, FAILED
    String analysisResult;           // JSON summary from AI
}

// Candidate entity additions:
List<CvItem> cvs = new ArrayList<>();
// cvUrl kept for backward compat — always mirrors the default CvItem url
```

### Endpoints (added to CandidateController)

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET /api/candidates/cvs` | CANDIDATE | List all CVs for current candidate |
| `POST /api/candidates/cv/upload` | CANDIDATE | Existing — now appends to `cvs` list. Auto sets `isDefault=true` if first CV |
| `PATCH /api/candidates/cvs/{cvId}/default` | CANDIDATE | Set as default, clear old default, sync `cvUrl` |
| `DELETE /api/candidates/cvs/{cvId}` | CANDIDATE | Remove from list. Auto-promote newest CV as default if deleted was default |
| `POST /api/candidates/cvs/{cvId}/reanalyze` | CANDIDATE | Publish RabbitMQ event to trigger AI re-extraction |
| `GET /api/candidates/cvs/{cvId}/analysis` | CANDIDATE | Returns `analysisStatus` + `analysisResult` |

### Backward compatibility

Every time `isDefault` changes, sync `candidate.cvUrl = defaultCv.url`. All downstream services reading `candidate.cvUrl` (application_service) are unaffected.

---

## 5. P0 — Candidate Settings (`user-service`)

### Entity changes

```java
// Embedded objects in Candidate:
public class CandidateSettings {
    NotificationPreferences notifications = new NotificationPreferences();
    PrivacySettings privacy = new PrivacySettings();
}

public class NotificationPreferences {
    boolean emailApplicationUpdates = true;
    boolean emailJobSuggestions = true;
    boolean pushNotifications = true;
    boolean marketingEmails = false;
}

public class PrivacySettings {
    ProfileVisibility profileVisibility = ProfileVisibility.RECRUITERS_ONLY;
    boolean showCvToRecruiters = true;
    boolean showContactInfo = false;
}

public enum ProfileVisibility { PUBLIC, RECRUITERS_ONLY, PRIVATE }

// Candidate entity addition:
CandidateSettings settings = new CandidateSettings();
```

### Endpoints (added to CandidateController)

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET /api/candidates/settings` | CANDIDATE | Returns full settings object |
| `PUT /api/candidates/settings/notifications` | CANDIDATE | Partial update notification preferences |
| `PUT /api/candidates/settings/privacy` | CANDIDATE | Partial update privacy preferences |
| `DELETE /api/candidates/me` | CANDIDATE | Soft delete candidate + user. Publish confirmation event. Blacklist JWT |

**Password change:** Reuses existing `PUT /user/api/users/me/password`.

### Account deletion flow

```
DELETE /api/candidates/me
  → candidate.deleted = true, candidate.deletedAt = now
  → user.deleted = true, user.deletedAt = now
  → publish UserDeletedEvent to RabbitMQ (notification-service sends email)
  → blacklist current JWT in Redis
```

---

## 6. P0 — Enriched Applications (`application_service`)

### Problem

`ApplicationResponse` only returns `jobId`. UI card needs `companyName`, `location`, `salaryMin/Max`, `skills`, `jobType`.

### Solution: Denormalize at submission time

Copy job snapshot fields into `Application` entity when candidate submits. Consistent with existing pattern (`jobTitle` already stored).

### Application entity additions

```java
String companyName;       // Job.company at time of apply
String jobLocation;       // Job.location
Integer salaryMin;
Integer salaryMax;
List<String> jobSkills;
String jobType;
String companyLogoUrl;    // from recruiter — optional, best-effort
```

### Flow change

```
POST /api/applications
  → fetch job via JobClient.getById(jobId)      // already has integration/job/
  → copy snapshot fields into Application
  → save
```

### ApplicationResponse additions

```java
String companyName;
String jobLocation;
Integer salaryMin, salaryMax;
List<String> jobSkills;
String jobType;
String companyLogoUrl;
```

No new endpoints — enrich existing `GET /api/applications/my` and `GET /api/applications/{id}`.

---

## 7. P1 — Job Detail Aggregate

### isSaved / isApplied state

Frontend fetches 3 calls in parallel when opening job detail:

```
GET /job/api/jobs/{id}                                 // job detail (existing)
GET /user/api/wishlists/contains/{jobId}               // isSaved (Section 3)
GET /application/api/applications/by-job/{jobId}/mine  // isApplied
```

**New endpoint in `application_service`:**

```
GET /api/applications/by-job/{jobId}/mine
  → returns current candidate's application for this job
  → 404 if not applied
  Auth: CANDIDATE
```

### Related jobs

**New endpoint in `job_service`:**

```
GET /api/jobs/{id}/related
  → find jobs sharing ≥1 skill with target job OR same company
  → exclude target job, status = ACTIVE only
  → limit 5, sorted by skill overlap count desc
  Auth: public
```

---

## 8. P1 — Job Suggestions Feed

### Persistence layer

Cache computed suggestions in `Candidate` entity:

```java
// Candidate entity additions:
List<JobSuggestion> jobSuggestions = new ArrayList<>();
LocalDateTime suggestionsUpdatedAt;

public class JobSuggestion {
    String jobId;
    Integer matchScore;
    String matchReason;
    List<String> alignedSkills;
    LocalDateTime suggestedAt;
}
```

### Flow

```
POST /ai/api/ai/recommend (existing, unchanged)
  → AI computes suggestions
  → Publish RabbitMQ event: "job.suggestions.computed" with { candidateId, suggestions[] }
  → user-service consumer: update candidate.jobSuggestions + suggestionsUpdatedAt
```

### New endpoint (`user-service`)

```
GET /user/api/candidates/job-suggestions
  → return jobSuggestions list
  → batch-join job detail from JobClient
  → include stale: true if suggestionsUpdatedAt > 7 days ago or list is empty
  Auth: CANDIDATE
```

---

## 9. P1 — Notification Candidate Contract Hardening

No new major features — hardening only:

1. **Notification service (Go):** Add `audience` field support. Filter notifications by `audience = USER | CANDIDATE | RECRUITER`. Currently defaults to `USER`.
2. **user-service:** `CandidateSettings.notifications` (Section 5) serves as candidate notification preferences. Notification service reads via internal call before delivering.
3. **OpenAPI spec:** Add `openapi.yaml` for notification-service (swaggo annotations or hand-written spec).

---

## 10. P2 — Public Home Aggregates (`job_service`)

**New `HomeController` at `/api/home/`, all public:**

| Endpoint | Implementation | Caching |
|---|---|---|
| `GET /api/home/stats` | MongoDB aggregation: count active jobs, distinct companies, remote jobs | Redis 10 min |
| `GET /api/home/categories` | Group by `jobType`, return `[{name, jobCount}]` | Redis 10 min |
| `GET /api/home/featured-jobs` | Status=ACTIVE, sort by createdAt DESC, limit 6 | Redis 5 min |
| `GET /api/home/top-companies` | Internal call to `GET /user/api/companies?limit=6` | Redis 10 min |
| `GET /api/home/resources` | Static hardcoded list (articles/guides) | None |
| `GET /api/home/testimonials` | Static hardcoded list | None |

**Stats response:**
```java
long openJobCount;
long hiringCompanyCount;   // distinct company values in active jobs
long remoteJobCount;
String avgResponseTime;    // static "24h"
```

---

## 11. P2 — Company Follow/Unfollow (`user-service`)

### Entity change

```java
// Candidate entity addition:
List<String> followedCompanyIds = new ArrayList<>();  // list of recruiter IDs
```

### Endpoints (added to CompanyController)

```
POST   /api/companies/{id}/follow    CANDIDATE  idempotent — add to followedCompanyIds
DELETE /api/companies/{id}/follow    CANDIDATE  remove from followedCompanyIds
GET    /api/companies/followed       CANDIDATE  list followed companies (join CompanyResponse)
```

---

## 12. Summary

### Endpoint count

| Priority | Domain | Service | New endpoints |
|---|---|---|---|
| P0 | Company Directory | user-service | 4 (+ 3 P2 follow) |
| P0 | Wishlists | user-service | 4 |
| P0 | CV Management | user-service | 5 |
| P0 | Candidate Settings | user-service | 4 |
| P0 | Enrich Applications | application_service | 1 new, enrich existing 2 |
| P1 | Job Detail Aggregate | job_service + application_service | 2 |
| P1 | Job Suggestions Feed | user-service | 1 + RabbitMQ consumer |
| P1 | Notification Contract | notification-service | hardening only |
| P2 | Public Home Aggregates | job_service | 6 |
| P2 | Company Follow | user-service | 3 |
| **Total** | | | **~30 endpoints** |

### Services touched

| Service | Nature of change |
|---|---|
| `user-service` | +3 new feature packages (company, wishlist — existing candidate extended), +~20 endpoints |
| `application_service` | Entity + response enrichment, +1 endpoint |
| `job_service` | +2 endpoints + new HomeController |
| `ai_engine_service` | +RabbitMQ publisher for suggestions event |
| `notification-service` | Audience field + OpenAPI spec |
| `api-gateway` | Add public route whitelist entries |

### Not in scope

- Assessment service (deferred)
- CMS / content management
- Real `avgResponseTime` metric
- Company rating / review system
