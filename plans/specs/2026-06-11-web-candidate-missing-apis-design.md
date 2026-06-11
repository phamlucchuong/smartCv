# Web Candidate Missing APIs — Design Spec

**Date:** 2026-06-11
**Scope:** Implement all remaining backend APIs needed for `web-candidate` to remove mock data
**Services affected:** `job_service`, `user-service`, `application_service`
**Approach:** 3 independent plans per service, implemented in order: job_service → user-service + application_service (parallel)

---

## Summary of Changes

| Plan | Service | What changes |
|------|---------|-------------|
| Plan 1 | `job_service` | Home aggregates (top-companies, resources, testimonials, faqs) + `/jobs/batch` internal endpoint |
| Plan 2 | `user-service` | Company enrichment fields, `/{id}/jobs`, `/{id}/related`, Job Suggestions enrichment via JobClient |
| Plan 3 | `application_service` | Assessment domain (2 new collections, 9 endpoints) + Application response enrichment |

---

## Plan 1 — `job_service`

### New Endpoints

#### Home aggregates (added to `HomeController`)

```
GET /job/api/home/top-companies
GET /job/api/home/resources
GET /job/api/home/testimonials
GET /job/api/home/faqs
```

**`top-companies`:** Query jobs with status `ACTIVE`, group by `recruiterId`, count, sort desc, take top 8. Fetch company name/industry/location from user-service via existing `InternalCandidateController` pattern (internal HTTP call). Returns `List<TopCompanyResponse>`:
```json
{
  "recruiterId": "...",
  "name": "...",
  "industry": "...",
  "location": "...",
  "activeJobCount": 12
}
```

**`resources`, `testimonials`, `faqs`:** Static hardcoded lists in service layer — no DB or new collection. Sufficient to unblock frontend mock removal; replaceable with CMS later.

#### Job batch endpoint (added to `JobController`)

```
GET /job/api/jobs/batch?ids=id1,id2,...
```

Returns `List<JobCardResponse>` for the given job IDs. Used internally by `user-service` to enrich job suggestions. Fields:
```json
{
  "id": "...",
  "title": "...",
  "companyName": "...",
  "salaryMin": 1000,
  "salaryMax": 2000,
  "location": "...",
  "skills": ["Java", "Spring"],
  "jobType": "FULL_TIME"
}
```

No auth required (internal call from API gateway internal routes or same network). Accepts up to 50 IDs per request.

### No new entities or MongoDB collections in Plan 1.

---

## Plan 2 — `user-service`

### Company Enrichment

**Add fields to `Recruiter` entity and `RecruiterRequest`:**
```java
List<String> benefits;     // e.g. ["Health insurance", "Remote work", "Flexible hours"]
String coverUrl;           // S3 URL for company cover image
Double rating;             // recruiter-provided, nullable
Integer reviewCount;       // recruiter-provided, nullable
```

**`CompanyResponse`** exposes all 4 new fields. Existing response shape is additive — no breaking changes.

### New Company Endpoints

```
GET /user/api/companies/{id}/jobs
GET /user/api/companies/{id}/related
```

**`/{id}/jobs`:** Calls `job_service GET /job/api/jobs?recruiterId={id}` (existing job list endpoint, filter by recruiterId). Returns `List<JobCardResponse>` proxied from job_service.

**`/{id}/related`:** Queries `RecruiterRepository` for recruiters with same `industry`, excludes `{id}`, returns top 5 as `List<CompanyResponse>`.

### Job Suggestions Enrichment

**Current:** `GET /user/api/candidates/job-suggestions` returns `List<JobSuggestion>` with `{jobId, matchScore, matchReason, alignedSkills, suggestedAt}`.

**After:** Returns `List<EnrichedJobSuggestion>`:
```json
{
  "jobId": "...",
  "matchScore": 87,
  "matchReason": "Strong Java background matches requirements",
  "alignedSkills": ["Java", "Spring Boot"],
  "suggestedAt": "...",
  "job": {
    "id": "...",
    "title": "Senior Backend Engineer",
    "companyName": "TechCorp",
    "salaryMin": 2000,
    "salaryMax": 3500,
    "location": "Hanoi",
    "skills": ["Java", "Spring Boot", "MongoDB"],
    "jobType": "FULL_TIME"
  }
}
```

**Implementation:** New `JobClient` bean in `integration/job/JobClient.java` using RestTemplate. Calls `GET /job/api/jobs/batch?ids=...` with job IDs extracted from the suggestions list. Merges results by `jobId`. If job_service is unavailable, returns suggestions with `job: null` (graceful degradation).

### No new MongoDB collections in Plan 2.

---

## Plan 3 — `application_service`

### Application Response Enrichment

Add to `ApplicationResponse`:
```java
String location;
List<String> skills;
String companyLogoInitials;   // first 2 chars of companyName, computed in service layer
```

Populated from job data already fetched during application enrichment (existing `JobClient` call pattern in application_service).

### Assessment Domain

#### New MongoDB Collections

**`assessments` collection — `Assessment` entity:**
```java
String id;
String jobId;
String recruiterId;
String title;
String description;
List<Question> questions;      // embedded
int timeLimitMinutes;
AssessmentStatus status;       // DRAFT, ACTIVE
LocalDateTime createdAt;
```

**`Question` embedded object:**
```java
String id;                     // UUID
String text;
List<String> options;          // for MCQ; empty for TEXT
Integer correctOptionIndex;    // null for TEXT type (not exposed to candidate)
QuestionType type;             // MCQ, TEXT
```

**`assessment_attempts` collection — `AssessmentAttempt` entity:**
```java
String id;
String assessmentId;
String candidateId;
String applicationId;          // optional, links to an application
AttemptStatus status;          // IN_PROGRESS, SUBMITTED, EXPIRED
List<AttemptAnswer> answers;   // embedded
LocalDateTime startedAt;
LocalDateTime submittedAt;
Double score;                  // null until graded; 0.0–100.0
AttemptResult result;          // PASS, FAIL, PENDING (null until graded)
```

**`AttemptAnswer` embedded object:**
```java
String questionId;
Integer selectedOptionIndex;   // for MCQ; null for TEXT
String textAnswer;             // for TEXT; null for MCQ
```

#### Candidate Endpoints

```
GET  /application/api/assessments/my
GET  /application/api/assessments/{id}
POST /application/api/assessments/{id}/start
GET  /application/api/attempts/{attemptId}
POST /application/api/attempts/{attemptId}/answers
POST /application/api/attempts/{attemptId}/submit
GET  /application/api/attempts/{attemptId}/result
```

**Access control:** All candidate endpoints require `ROLE_CANDIDATE`. Candidates can only access their own attempts.

**`GET /assessments/my`:** Returns all `AssessmentAttempt` records for the authenticated candidate (grouped or flat list). Includes assessment title, status, score if submitted.

**`GET /assessments/{id}`:** Returns assessment metadata. `correctOptionIndex` is **never exposed** to candidates — stripped in the DTO mapper.

**`POST /assessments/{id}/start`:** Creates a new `AssessmentAttempt` with status `IN_PROGRESS`. Returns `attemptId`. Throws `ATTEMPT_ALREADY_IN_PROGRESS` if an active attempt exists.

**`GET /attempts/{attemptId}`:** Returns current attempt state including saved answers (for resume). Only accessible by the owning candidate.

**`POST /attempts/{attemptId}/answers`:** Upsert answers. Accepts `List<AttemptAnswer>`. Replaces entire answer list (idempotent). Throws if attempt is not `IN_PROGRESS`.

**`POST /attempts/{attemptId}/submit`:** Sets status to `SUBMITTED`, records `submittedAt`. Auto-grades MCQ questions: for each MCQ answer, compares `selectedOptionIndex` to `correctOptionIndex`, calculates `score` as percentage. TEXT questions leave `score = null` (manual grading). Sets `result` to `PASS` if score ≥ 70, `FAIL` if < 70, `PENDING` if any TEXT questions exist.

**`GET /attempts/{attemptId}/result`:** Returns `{score, result, submittedAt}`. Returns 404 if attempt not submitted yet.

#### Recruiter Endpoints (minimal — needed to seed test data)

```
POST  /application/api/assessments              → create assessment (ROLE_RECRUITER)
PATCH /application/api/assessments/{id}/assign  → assign to candidateId (ROLE_RECRUITER)
```

**`POST /assessments`:** Creates assessment with status `DRAFT`. Body includes title, description, questions, timeLimitMinutes.

**`PATCH /assessments/{id}/assign`:** Sets assessment to `ACTIVE` if not already, links to `candidateId` by creating an `AssessmentAttempt` with status `IN_PROGRESS` and `startedAt = now`.

#### Error Codes (new)

```java
ASSESSMENT_NOT_FOUND(5001, "Assessment not found")
ATTEMPT_NOT_FOUND(5002, "Attempt not found")
ATTEMPT_ALREADY_IN_PROGRESS(5003, "An attempt is already in progress for this assessment")
ATTEMPT_ALREADY_SUBMITTED(5004, "This attempt has already been submitted")
ATTEMPT_NOT_SUBMITTED(5005, "Attempt has not been submitted yet")
```

---

## Cross-Service Dependencies

```
Plan 1 (job_service)
  └── exposes GET /jobs/batch
        └── consumed by Plan 2 (user-service JobClient)

Plan 2 (user-service)
  └── GET /companies/{id}/jobs calls job_service GET /jobs?recruiterId={id}
  └── GET /candidates/job-suggestions calls job_service GET /jobs/batch

Plan 3 (application_service)
  └── no new cross-service calls
  └── existing JobClient already used for application enrichment
```

**Implementation order:** Plan 1 must be deployed before Plan 2. Plan 3 is independent.

---

## What Remains Out of Scope

- `GET /home/top-companies` logo/cover images (top-companies response uses name/industry only)
- Assessment time enforcement (expiry timer) — `timeLimitMinutes` stored but not auto-expired server-side
- TEXT question manual grading UI (data model supports it, no grading endpoint in this spec)
- Company `rating`/`reviewCount` sourced from a review system (recruiter self-reports for now)
- Notification service OpenAPI spec (triggered via RabbitMQ, not direct frontend calls)
