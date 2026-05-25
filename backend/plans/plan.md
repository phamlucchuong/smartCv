# SmartCV Backend — Project Status & Remaining Work

**Updated:** 2026-05-25
**Branch:** `feat/init-user-candidate-and-recruiter` (pending merge)

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Fully implemented and committed |
| ⚠️ | Implemented but incomplete / has known gaps |
| ❌ | Not started |

---

## 1. Service Status Overview

| Service | Port | Language | Status | Notes |
|---------|------|----------|--------|-------|
| `api-gateway` | 8080 | Java/Spring Cloud Gateway | ✅ | JWT auth, 5 routes, Redis blacklist, rate limiter |
| `user-service` | 8081 | Java/Spring Boot 3.4.4 | ✅ | Auth + CRUD + Candidate + Recruiter (full fields) + S3 upload |
| `job_service` | 8082 | Java/Spring Boot 3.5.14 | ✅ | Full CRUD, Elasticsearch, RabbitMQ, role-based auth |
| `application_service` | 8083 | Java/Spring Boot 3.5.14 | ✅ | Full lifecycle CRUD, RabbitMQ events, UserClient + JobClient |
| `notification-service` | 8084 | Go 1.25/Echo v5 | ✅ | OTP + application result emails, all 4 event queues consumed |
| `ai_engine_service` | 8085 | Java/Spring Boot 3.5.14 | ✅ | CV analyze/improve/recommend, Spring AI + Ollama |

---

## 2. Detailed Status by Service

### Infrastructure
| Component | Status | Notes |
|-----------|--------|-------|
| `docker-compose.yaml` (dev) | ✅ | MongoDB, PostgreSQL, Redis, RabbitMQ, Elasticsearch with healthchecks |
| `docker-compose.prod.yaml` | ✅ | All 6 services + Ollama + ollama-init; `ollama_data` volume |
| Dockerfiles (all 6 services) | ✅ | Multi-stage: Java (`amazoncorretto:21-alpine`), Go (`alpine:3.19`) |
| `.env.example` | ✅ | All env vars documented including AWS S3 variables |
| `scripts/bootstrap.sh` | ✅ | Automated setup script |

### API Gateway (8080)
| Feature | Status |
|---------|--------|
| Local JWT validation (`GatewayJwtUtils` — HS512, no user-service roundtrip) | ✅ |
| Redis JWT blacklist check (`BlacklistCheckService`) | ✅ |
| Forward `X-User-Id`, `X-User-Scope`, `X-Gateway-Secret` to downstream | ✅ |
| Routes: `/user/**`, `/job/**`, `/application/**`, `/notification/**`, `/ai/**` | ✅ |
| Public routes matcher (register, login, OTP, public job reads) | ✅ |
| Rate limiter — Redis token bucket, IP-based (20 req/s global, 5 req/s auth) | ✅ |
| CI (`gateway-ci.yml`) | ✅ |

### User Service (8081)
| Feature | Status |
|---------|--------|
| Register (role selection: CANDIDATE / RECRUITER) | ✅ |
| OTP verify (email or SMS) | ✅ |
| Resend OTP | ✅ |
| Login → JWT access + refresh tokens | ✅ |
| Refresh token | ✅ |
| Logout (blacklist token in Redis) | ✅ |
| Introspect | ✅ |
| Forgot password / Reset password | ✅ |
| User CRUD (get, list paginated, update, delete, update roles) | ✅ |
| Change password | ✅ |
| Candidate CRUD (create, get, list paginated, update, soft delete) | ✅ |
| Recruiter CRUD (create, get, list paginated, update, soft delete) | ✅ |
| Recruiter: `taxCode`, `logoUrl`, `status` (PENDING/APPROVED/REJECTED), `quotaJobPost`, `quotaCvViews` | ✅ |
| Admin: `PATCH /api/recruiters/{id}/status` — approve/reject + set quotas | ✅ |
| S3 CV upload (`POST /api/candidates/cv/upload`) — PDF 5MB max, presigned URL | ✅ |
| Role / Permission CRUD | ✅ |
| Mongock migration (seed ADMIN/CANDIDATE/RECRUITER roles) | ✅ |
| `InternalAuthFilter` (header-based auth from gateway) | ✅ |
| CI (`user-ci.yml`) | ✅ |

### Job Service (8082)
| Feature | Status |
|---------|--------|
| Job CRUD (create, get, list paginated, update, delete, close) | ✅ |
| Job entity: title, description, company, location, salary, jobType, experienceLevel, skills, requirements, benefits, status, deadline | ✅ |
| Elasticsearch dual-write (index on create/update, remove on close/delete) | ✅ |
| Full-text search (`GET /api/jobs/search`) | ✅ |
| Public active job listing (`GET /api/jobs/active`) | ✅ |
| Role-based auth: RECRUITER creates/edits own jobs, public reads | ✅ |
| RabbitMQ: publish job events | ✅ |
| `InternalAuthFilter` | ✅ |
| CI (`job-ci.yml`) | ✅ |

### Application Service (8083)
| Feature | Status |
|---------|--------|
| Submit application (`POST /api/applications`) — CANDIDATE only | ✅ |
| Duplicate prevention (blocks re-apply while PENDING/REVIEWING/ACCEPTED) | ✅ |
| View own applications (`GET /api/applications/my`) | ✅ |
| View single application — role-conditional response (candidate vs recruiter) | ✅ |
| List applications for a job (`GET /api/applications/job/{jobId}`) — RECRUITER | ✅ |
| Update status (`PATCH /{id}/status`) — RECRUITER/ADMIN; validates transitions | ✅ |
| Withdraw application (`PATCH /{id}/withdraw`) — CANDIDATE | ✅ |
| Admin: list all, soft delete | ✅ |
| JobClient HTTP: validates job is ACTIVE before accepting application | ✅ |
| UserClient HTTP: fetches `candidateEmail` at submit time for notification enrichment | ✅ |
| `candidateEmail` + `jobTitle` stored denormalized in `Application` entity | ✅ |
| RabbitMQ events: publish on ACCEPTED, REJECTED, WITHDRAWN (with email + jobTitle) | ✅ |
| `InternalAuthFilter` | ✅ |
| CI (`application-ci.yml`) | ✅ |

### Notification Service (8084)
| Feature | Status |
|---------|--------|
| OTP via SMTP email | ✅ |
| OTP via Twilio SMS | ✅ |
| OTP store/verify in Redis (TTL) | ✅ |
| RabbitMQ consumer: OTP send events | ✅ |
| RabbitMQ consumer: `application.accepted/rejected/withdrawn` events | ✅ |
| Email template for application result (accepted/rejected/withdrawn, with rejectionReason) | ✅ |
| `SendApplicationResultEmail()` — routes to SMTP with rendered HTML template | ✅ |
| PostgreSQL persistence for notification records | ✅ |
| CI (`noti-ci.yml`) | ✅ |

### AI Engine Service (8085)
| Feature | Status |
|---------|--------|
| CV scoring vs JD (`POST /api/ai/analyze`) — matchScore 0-100, skills breakdown, summary | ✅ |
| CV improvement tips (`POST /api/ai/improve`) — strengths, weaknesses, prioritized tips | ✅ |
| Job recommendations (`POST /api/ai/recommend`) — top-K ranked matches | ✅ |
| PDF CV extraction (`CvTextExtractor` via `PagePdfDocumentReader`) | ✅ |
| Spring AI 1.1.5 + Ollama `ChatClient` with `BeanOutputConverter` | ✅ |
| Prompt templates: `skill.md`, `analyze_cv.md`, `improve_cv.md`, `recommend_jobs.md` | ✅ |
| JobClient HTTP: fetch job details and active job list | ✅ |
| `InternalAuthFilter` | ✅ |
| Included in `docker-compose.prod.yaml` with Ollama dependency | ✅ |
| CI (`ai-ci.yml`) | ✅ |

### CI/CD Pipelines
| Pipeline | Status |
|----------|--------|
| `user-ci.yml` — Maven test + MongoDB service | ✅ |
| `gateway-ci.yml` — Maven test | ✅ |
| `job-ci.yml` — Maven test + MongoDB service | ✅ |
| `application-ci.yml` — Maven test + MongoDB service | ✅ |
| `noti-ci.yml` — Go build + test | ✅ |
| `ai-ci.yml` — Maven compile + test (Ollama disabled) | ✅ |
| Docker image builds in CI | ❌ |
| Deploy pipeline (push to registry + EC2) | ❌ |

---

## 3. Remaining Work (theo Roadmap)

> Deadline: **20/06/2026**. Hôm nay: 25/05/2026 (Tuần 10/13).

### MVP Critical — Tuần 9–10 (23/05 – 31/05)

#### R7: Auto AI Scoring khi Apply (core MVP differentiator)
✅ Implemented on 2026-05-25.
- Application stores `aiScore`, `matchedSkills`, `missingSkills`, `aiStatus`.
- `application_service` publishes cv scoring message after submit.
- `ai_engine_service` consumes `cv.scoring.queue`, analyzes CV, callbacks `PATCH /api/applications/{id}/ai-score`.
- Response DTOs expose AI scoring fields to frontend.

Follow-up: add integration test for async flow (apply -> queue -> callback).

#### R8: AI Mock Interview Questions
✅ Implemented on 2026-05-25.
- Added `POST /api/ai/interview-questions` in ai_engine_service.
- Added `interview_questions.md` prompt template.
- Added request/response DTOs and service generation flow.

Note: current input uses `cvText|cvUrl + jobId` (not `applicationId`).

### Phase 4 — Tuần 10 (25/05 – 31/05)

#### R9: Payment Service (Mock)
Recruiter cần mua gói để có quota đăng job.

**Cần làm:**
- Service mới `payment_service` (port 8086) hoặc module trong `user-service`
- 3 gói: Basic (5 posts), Pro (20 posts), Enterprise (unlimited)
- Mock payment: sau 3s tự xác nhận thành công
- MongoDB Multi-document Transaction: update Invoice + recruiter.quotaJobPost atomically
- `POST /api/payments/orders` — tạo đơn
- `POST /api/payments/confirm/{orderId}` — confirm (mock webhook)

#### R10: Recruiter Quota Enforcement trong Job Service
Job service chưa kiểm tra recruiter có được phép đăng job không.

**Cần làm:**
- `job_service` gọi user-service: verify `recruiter.status == APPROVED` trước khi tạo job
- Kiểm tra `recruiter.quotaJobPost > 0`; decrement khi tạo job thành công
- Tăng lại quota khi job bị xóa/đóng

### Phase 5 — Tuần 12 (08/06 – 14/06)

#### R11: CI/CD Docker Build + EC2 Deploy
**Cần làm:**
- GitHub Actions: build + push Docker images lên DockerHub/ECR khi merge vào `main`
- EC2: setup `docker-compose.prod.yaml`, map domain, cài SSL Let's Encrypt
- Seed data mẫu cho demo

### Post-MVP / Nice-to-have

| Item | Notes |
|------|-------|
| RabbitMQ dead-letter queues | Retry 3× sau đó route sang DLQ |
| WebSocket realtime notification | Thay polling 3s bằng WS từ notification-service |
| End-to-end integration tests | Full flow: register → apply → AI score → notify |

---

## 4. Timeline còn lại

| Tuần | Ngày | Mục tiêu backend |
|------|------|-----------------|
| 9 | 18–24/05 | ✅ P1 xong (Recruiter fields, S3, Rate limiter) |
| 10 | 25–31/05 | R7 Auto AI scoring + R8 Interview questions + R9 Payment |
| 11 | 01–07/06 | R10 Quota enforcement + Bug fixing + Refactor |
| 12 | 08–14/06 | R11 CI/CD build + EC2 deploy |
| 13 | 15–20/06 | Code freeze + Demo data + Thesis |

---

## 6. Service Map (current)

```
Client → API Gateway :8080  [rate limit: 20 req/s global, 5 req/s auth]
              ├── /user/**         → User Service :8081          (JWT auth + user mgmt + S3)
              ├── /job/**          → Job Service :8082           (jobs + Elasticsearch)
              ├── /application/**  → Application Service :8083   (apply lifecycle)
              ├── /notification/** → Notification Service :8084  (OTP + email/SMS)
              ├── /ai/**           → AI Engine Service :8085     (Llama 3 analysis)
              └── /payment/**      → Payment Service :8086       ❌ chưa có

Async events (RabbitMQ):
  user-service        → notification-service   (OTP send)
  application_service → notification-service   (accepted/rejected/withdrawn) ✅
  application_service → ai_engine_service      (cv.analysis.queue) ❌ chưa có

Sync HTTP (internal):
  application_service → job_service            (validate job ACTIVE before apply)
  application_service → user_service           (fetch candidateEmail at submit time)
  ai_engine_service   → job_service            (fetch job details for analysis)
  ai_engine_service   → application_service    (callback ai-score) ❌ chưa có
  job_service         → user_service           (verify recruiter APPROVED + quota) ❌ chưa có
```
