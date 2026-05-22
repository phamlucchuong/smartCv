# NEXT IMPLEMENTATION PLAN - SMARTCV BACKEND

**Created date:** 2026-05-19
**Author:** Claude Code (based on analysis of current docs + source)
**Current time:** Week 9 in the roadmap (05/18 - 05/24)

---

## 1. ROADMAP VS ACTUAL PROJECT STATUS

### Legend
- ✅ Completed
- ⚠️ Partially done / needs fixes
- ❌ Not started
- 🔄 In progress (on current branch)

### Phase 1: Foundation & Infrastructure (Weeks 1-2) — LIMITED: 100%

| Task | Status | Notes |
|------|--------|-------|
| Docker Compose (MongoDB, Redis, RabbitMQ, ES) | ✅ | Complete, with healthchecks |
| API Gateway (Spring Cloud Gateway) | ⚠️ | Routing works but **Auth Filter does not block unauthenticated requests** |
| MongoDB Schema init | ✅ | Mongock migration seeds roles/permissions |
| Elasticsearch setup | ✅ | Container runs in docker-compose, no integration code yet |

### Phase 2: Core Microservices & Business Logic (Weeks 3-6) — PROGRESS: ~55%

| Task | Planned week | Status | Notes |
|------|--------------|--------|-------|
| **User Service - Auth** (JWT, OTP, Register, Login) | Week 2 | ✅ | Complete: register/login/OTP/introspect/refresh/logout |
| **User Service - CRUD** (User, Role, Permission) | Week 2 | ✅ | Full endpoints |
| **Notification Service** (Go - OTP, Email, SMS) | Week 2 | ✅ | Complete: OTP, SMTP email, Twilio SMS, RabbitMQ consumer, FCM push |
| **Candidate CRUD** (user-service) | Weeks 3-4 | 🔄 | Code written, **not committed** on branch `feat/init-user-candidate-and-recruiter` |
| **Recruiter CRUD** (user-service) | Weeks 3-4 | 🔄 | Code written, **not committed** on branch `feat/init-user-candidate-and-recruiter` |
| **Job Service - CRUD** | Week 3 | ⚠️ | Only basic scaffold. **Missing:** DTOs, validation, security, employer mapping, salary_range, status, expired_at |
| **Job Service - Elasticsearch** | Week 3 | ❌ | No integration code, only container |
| **Application/CV Service** (Port 8083) | Week 4 | ❌ | **Not started** — service not created |
| **AWS S3 Upload** | Week 4 | ❌ | **Not started** |
| **AI Evaluation Service** (Port 8085) | Week 5 | ❌ | **Not started** — service not created |
| **Spring AI + Llama 3 Integration** | Week 5 | ❌ | **Not started** |
| **End-to-end Event Loop** (AI -> App Service -> Notify) | Week 6 | ❌ | **Not started** |
| **Dead-letter Queue / Retry** | Week 6 | ❌ | **Not started** |

### Phase 3: Frontend Development (Weeks 7-9) — PROGRESS: 0%
> Frontend is in a separate repo and is not evaluated in this document.

### Phase 4: Advanced Features (Week 10) — PROGRESS: 0%

| Task | Status |
|------|--------|
| Payment Engine (VNPAY/Mock) | ❌ |
| MongoDB Multi-doc Transaction | ❌ |
| AI Mock Interview Generator | ❌ |

### Phase 5: Deploy & Documentation (Weeks 11-13) — PROGRESS: 0%

| Task | Status |
|------|--------|
| Rate limiter, CORS, security hardening | ❌ |
| Docker images for all services | ❌ |
| AWS EC2 Deployment | ❌ |
| CI/CD GitHub Actions (deploy) | ❌ |

---

## 2. GAP ANALYSIS SUMMARY

### The project is **~3-4 weeks behind** the roadmap:
- Roadmap expected **Phase 2 completion** by end of Week 6 (05/03).
- Actual Phase 2 completion is **~55%** (missing Application Service, AI Service, S3, Elasticsearch).
- Current time is **Week 9** — roadmap expects frontend work.

### Backend **Critical Path** (must be done for frontend integration):
1. Complete Job Service (full CRUD + Elasticsearch)
2. Build Application/CV Service (S3 upload + Apply API)
3. Build AI Evaluation Service (Llama 3 + Spring AI)
4. Fix Gateway Auth Filter (security)
5. Complete Recruiter schema (missing fields from DB Schema docs)

---

## 3. PRIORITIZED IMPLEMENTATION PLAN

### Sprint 1: PACKAGE & FIX BUGS (highest priority — 1-2 days)

#### 1.1 Commit & Merge Candidate/Recruiter Feature
**Branch:** `feat/init-user-candidate-and-recruiter`

Items to complete before commit:
- [ ] Review Candidate entity vs DB Schema docs — missing `years_of_experience`, `cv_list`
- [ ] Review Recruiter entity vs DB Schema docs — currently named `Recruiter` but docs call `employers`, missing `tax_code`, `logo_url`, `status`, `quota_job_post`, `quota_cv_views`
- [ ] Update `UserService.getAllUsers()` if more accurate filtering is needed
- [ ] Commit and open PR to merge into `dev`

#### 1.2 Fix Gateway Auth Filter
**File:** `api-gateway/.../AuthenticationFilter.java`
- [ ] Fix filter to **actually block** requests when introspection returns invalid/expired token
- [ ] Return HTTP 401 Unauthorized for invalid requests
- [ ] Add route for job-service (`/job/**` -> localhost:8082)

#### 1.3 Fix Job Service Copy-paste Issues
**File:** `job_service/.../JobServiceApplication.java`
- [ ] Fix Mongock changelog import from `user_service.configuration.changelog` to the correct job_service package

---

### Sprint 2: COMPLETE JOB SERVICE (2-3 days)

#### 2.1 Upgrade Job Entity to match DB Schema
**Service:** `job_service`

Job entity additions:
```
- employerId (ObjectId reference)
- salaryRange: { min, max, currency }
- status: OPEN | CLOSED | EXPIRED
- expiredAt (ISODate)
- location (already exists but needs validation)
- requirements (already exists — List<String>)
```

#### 2.2 Create DTOs for Job Service
- [ ] `JobCreateRequest` — Validation: title required, description required, salary min/max
- [ ] `JobUpdateRequest` — Partial update fields
- [ ] `JobResponse` — Full job detail
- [ ] `JobListResponse` — Summary for list page
- [ ] `JobSearchRequest` — Query params for search

#### 2.3 Elasticsearch Integration
- [ ] Add `spring-boot-starter-data-elasticsearch` dependency
- [ ] Create `JobSearchRepository` interface extends `ElasticsearchRepository`
- [ ] Implement full-text search on `title` and `description`
- [ ] Sync MongoDB -> Elasticsearch (event listener or Logstash)
- [ ] Search API: `GET /api/jobs/search?q=keyword&page=0&size=20`

#### 2.4 Job Service Security & Integration
- [ ] JWT validation (call user-service introspect or gateway auth)
- [ ] Only EMPLOYER/RECRUITER can create/update jobs
- [ ] RabbitMQ publisher: publish event when a new job is created (for notification)
- [ ] Add gateway route: `/job/**` -> localhost:8082

---

### Sprint 3: APPLICATION & CV SERVICE (3-4 days)

#### 3.1 Initialize Application Service
**Port:** 8083 | **Database:** MongoDB | **Framework:** Spring Boot 3

Create a new service with structure:
```
application-service/
├── src/main/java/vn/chuongpl/application_service/
│   ├── ApplicationServiceApplication.java
│   ├── configuration/
│   │   ├── SecurityConfig.java
│   │   ├── RabbitMQConfig.java
│   │   ├── S3Config.java
│   │   └── AppConfig.java
│   ├── dtos/
│   │   ├── request/
│   │   │   ├── ApplicationCreateRequest.java
│   │   │   └── CVUploadRequest.java
│   │   └── response/
│   │       ├── ApplicationResponse.java
│   │       └── ApplicationListResponse.java
│   ├── enums/
│   │   └── ApplicationStatus.java  (PENDING_REVIEW, QUALIFIED, UNDER_REVIEW, NOT_QUALIFIED, INTERVIEW_SCHEDULED, OFFER_SENT, REJECTED)
│   ├── features/application/
│   │   ├── Application.java (entity)
│   │   ├── ApplicationController.java
│   │   ├── ApplicationService.java
│   │   ├── ApplicationRepository.java
│   │   └── ApplicationMapper.java
│   ├── features/cv/
│   │   ├── CVDocument.java (entity)
│   │   ├── CVController.java
│   │   ├── CVService.java
│   │   └── CVRepository.java
│   └── integration/
│       └── UserClient.java
└── src/main/resources/
    └── application.yaml
```

#### 3.2 Application Entity (per DB Schema)
```java
@Document(collection = "applications")
public class Application {
    @Id
    private String id;
    private String candidateUserId;
    private String jobId;
    private String usedCvUrl;
    private ApplicationStatus status; // PENDING_REVIEW, QUALIFIED, etc.
    private LocalDateTime appliedAt;
    private AiAnalysis aiAnalysis; // Embedded document
}

public class AiAnalysis {
    private int matchScore;
    private List<String> matchedSkills;
    private List<String> missingSkills;
    private String advice;
    private List<String> mockQuestionsGenerated;
}
```

#### 3.3 AWS S3 Integration
- [ ] Add `software.amazon.awssdk:s3` dependency
- [ ] `S3Config.java` — S3 client bean with credentials from env
- [ ] `CVService.java` — Upload PDF, validate (max 5MB, only .pdf), generate presigned URL
- [ ] CV entity stores: `cv_id`, `file_name`, `file_url` (S3), `is_default`, `raw_text_parsed`
- [ ] PDF text extraction (Apache PDFBox or similar)

#### 3.4 Apply Job API
- [ ] `POST /api/applications` — Candidate apply (upload CV + jobId)
  - Validate: candidate has not applied to this job
  - Save Application with status `PENDING_REVIEW`
  - **Publish RabbitMQ message** `[cvUrl, jobId, candidateId]` for AI Service to consume
  - Return HTTP 202 Accepted

#### 3.5 Application Status Tracking
- [ ] `GET /api/applications/candidate/{candidateId}` — View candidate application history
- [ ] `GET /api/applications/job/{jobId}` — View list of applicants for a job (EMPLOYER only)
- [ ] `PATCH /api/applications/{id}/status` — Employer updates status (Kanban)
- [ ] `GET /api/applications/{id}` — Application details (with AI analysis)

#### 3.6 RabbitMQ Integration
- [ ] Exchange: `application.exchange`
- [ ] Queue: `cv.review.queue` — Message contains `{cvUrl, jobId, candidateId, applicationId}`
- [ ] Routing key: `cv.review.routing.key`

---

### Sprint 4: AI EVALUATION SERVICE (3-4 days)

#### 4.1 Initialize AI Service
**Port:** 8085 | **Database:** MongoDB | **Framework:** Spring Boot 3 + Spring AI

Create new service:
```
ai-service/
├── src/main/java/vn/chuongpl/ai_service/
│   ├── AiServiceApplication.java
│   ├── configuration/
│   │   ├── SecurityConfig.java
│   │   ├── RabbitMQConfig.java
│   │   └── SpringAiConfig.java
│   ├── dtos/
│   │   ├── request/
│   │   │   ├── CVAnalysisRequest.java
│   │   │   └── InterviewQuestionRequest.java
│   │   └── response/
│   │       ├── CVAnalysisResponse.java
│   │       └── InterviewQuestionResponse.java
│   ├── features/evaluation/
│   │   ├── CVEvaluationConsumer.java  (RabbitMQ listener)
│   │   ├── CVEvaluationService.java
│   │   └── CVEvaluationController.java
│   ├── features/interview/
│   │   ├── InterviewService.java
│   │   └── InterviewController.java
│   └── integration/
│       ├── S3Client.java
│       └── ApplicationServiceClient.java
└── src/main/resources/
    └── application.yaml
```

#### 4.2 Spring AI + Llama 3 Integration
- [ ] Add `spring-ai-ollama-spring-boot-starter` or `spring-ai-openai-spring-boot-starter` (depends on Llama deployment)
- [ ] Configure model endpoint in `application.yaml`
- [ ] Create prompt templates:
  - **CV Screening Prompt**: "Act as a hiring expert. Analyze the CV below and compare with the job requirements. Return JSON: {matchScore, matchedSkills, missingSkills, advice}"
  - **Interview Question Prompt**: "Based on the CV and missing skills, generate 3-5 interview questions."

#### 4.3 CV Processing Pipeline
- [ ] `CVEvaluationConsumer.java` — Listen on `cv.review.queue`
- [ ] On message:
  1. Download CV PDF from S3
  2. Parse PDF -> raw text (Apache PDFBox)
  3. Fetch job description from Job Service (HTTP call)
  4. Send prompt + CV text + job text -> Llama 3 via Spring AI
  5. Parse JSON response into `AiAnalysis` object
  6. Update Application via Application Service (HTTP call): status -> `QUALIFIED` or `NOT_QUALIFIED`, embed `aiAnalysis`
  7. Publish notification event to Notification Service

#### 4.4 Interview Question Generation API
- [ ] `POST /api/ai/interview-questions` — Input: applicationId
  - Fetch Application (already has AI analysis)
  - Use missing_skills + job context -> generate questions
  - Return: list of interview questions

#### 4.5 Error Handling & Dead-letter Queue
- [ ] Configure DLQ for `cv.review.queue`
- [ ] Retry policy (3 times, exponential backoff)
- [ ] Fallback for Llama 3 timeout
- [ ] Detailed logging for failed CV processing

---

### Sprint 5: NOTIFICATION INTEGRATION & END-TO-END FLOW (2 days)

#### 5.1 Connect Notification Service with Application Flow
- [ ] After AI scoring -> publish event to RabbitMQ -> Notification Service consumes
- [ ] Email template "Application result" (use existing template `new.html` — currently empty)
- [ ] Notification payload: candidate name, job title, match score, status

#### 5.2 End-to-End Testing
Test the full flow:
1. Candidate registers -> OTP -> Verify ✅
2. Candidate uploads CV -> S3 ✅
3. Candidate applies job -> Application created (PENDING_REVIEW) ✅
4. AI Service consumes -> parse CV -> Llama 3 analysis -> update Application ✅
5. Notification Service sends result email to candidate ✅
6. Employer views applications list with AI scores ✅
7. Employer updates application status (Kanban) ✅

---

### Sprint 6: FINALIZATION & DEPLOY PREP (2-3 days)

#### 6.1 Complete Gateway Routes
- [ ] `/user/**` -> localhost:8081 ✅ (already exists)
- [ ] `/job/**` -> localhost:8082 (new)
- [ ] `/application/**` -> localhost:8083 (new)
- [ ] `/notification/**` -> localhost:8084 ✅ (already exists)
- [ ] `/ai/**` -> localhost:8085 (new)

#### 6.2 Docker Images for All Services
- [ ] `api-gateway/Dockerfile` (Java 21, Maven)
- [ ] `user-service/Dockerfile` ✅ (likely already exists)
- [ ] `job_service/Dockerfile` (Java 21, Maven)
- [ ] `application-service/Dockerfile` (Java 21, Maven)
- [ ] `notification-service/Dockerfile` (Go) ✅ (likely already exists)
- [ ] `ai-service/Dockerfile` (Java 21, Maven)
- [ ] Update `docker-compose.yaml` for all services

#### 6.3 CI/CD Pipeline
- [ ] Add GitHub Actions for job-service, application-service, ai-service
- [ ] Build + test pipeline for each service

#### 6.4 Security Hardening
- [ ] Rate limiter at Gateway
- [ ] CORS configuration
- [ ] Validate all endpoints have proper auth

---

## 4. RECRUITER ENTITY — DESIGN DECISION NEEDED

### Issue: Actual vs DB Schema

**DB Schema docs** call the entity `employers` with fields:
```json
{
  "user_id": "...",
  "company_name": "FPT",
  "tax_code": "0123456789",
  "logo_url": "s3://...",
  "status": "APPROVED",
  "quota_job_post": 50,
  "quota_cv_views": 100
}
```

**Current code** (`Recruiter.java`) has fields:
```java
userId, companyName, companyWebsite, companyAddress, companyDescription
```

**Decision needed:**
- **Option A:** Rename entity from `Recruiter` -> `Employer`, add fields per DB Schema (tax_code, logo_url, status, quota)
- **Option B:** Keep `Recruiter` but add missing fields (quota, status, tax_code)
- **Recommendation:** Option A — align with docs for Payment Service compatibility (quota_job_post is needed for package purchase)

---

## 5. ESTIMATED TIMELINE

| Sprint | Scope | Time |
|--------|-------|------|
| Sprint 1 | Commit Candidate/Recruiter + Fix bugs | 1-2 days |
| Sprint 2 | Complete Job Service + Elasticsearch | 2-3 days |
| Sprint 3 | Application/CV Service + S3 | 3-4 days |
| Sprint 4 | AI Evaluation Service + Llama 3 | 3-4 days |
| Sprint 5 | Notification Integration + E2E Test | 2 days |
| Sprint 6 | Deploy Prep + Security | 2-3 days |
| **Total** | | **13-18 days** |

> With this schedule, the backend should complete around **early week 12** (06/01 - 06/07), aligned with Phase 5 (Deploy + Documentation).

---

## 6. DEPENDENCIES & RISKS

### Dependencies (required order)
1. Sprint 1 (fix bugs) — does not block other sprints but should be done early
2. Sprint 2 (Job Service) — **Blocks Sprint 3** (Application needs Job entity)
3. Sprint 3 (Application Service) — **Blocks Sprint 4** (AI Service consumes Application messages)
4. Sprint 4 (AI Service) — Blocks Sprint 5 (Notification needs AI results)
5. Sprint 5 (Integration) — Blocks Sprint 6 (Deploy needs end-to-end system)
6. Sprint 6 (Deploy Prep) — final stage

### Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Llama 3 API not available/local | Block AI Service | Use mock response first, swap to real API later |
| Missing AWS S3 credentials | Block CV Upload | Use local storage (MinIO) for dev, S3 for prod |
| Deadline slip (06/20) | Project not completed | Cut Payment Service (P1), focus on AI + Apply flow (P0) |
| Elasticsearch sync complexity | Delays Job Service | Use simple MongoDB query first, add ES later |

### Scope reduction if behind schedule (priority order)
1. **P0 — Must have:** Auth, Job CRUD, Apply CV, AI Screening, Notification
2. **P1 — Should have:** Elasticsearch search, Interview Question Generator, Kanban ATS
3. **P2 — Nice to have:** Payment/Mock Payment, Dead-letter Queue, Rate Limiter
4. **P3 — Post-MVP:** OAuth2 login, Quiz/Test system, Job Recommender

---

*This document is auto-generated based on analysis of the current source code and documentation. It should be reviewed and adjusted to match actual implementation.*
