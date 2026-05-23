# SmartCV Backend — Project Status & Remaining Work

**Updated:** 2026-05-23
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
| `api-gateway` | 8080 | Java/Spring Cloud Gateway | ✅ | Centralized JWT auth, all 5 routes, Redis blacklist |
| `user-service` | 8081 | Java/Spring Boot 3.4.4 | ✅ | Auth + CRUD + Candidate + Recruiter + Role + Permission |
| `job_service` | 8082 | Java/Spring Boot 3.5.14 | ✅ | Full CRUD, Elasticsearch, RabbitMQ, role-based auth |
| `application_service` | 8083 | Java/Spring Boot 3.5.14 | ✅ | Full lifecycle CRUD, RabbitMQ events, JobClient HTTP |
| `notification-service` | 8084 | Go 1.25/Echo v5 | ⚠️ | OTP/Email/SMS done; application events not consumed |
| `ai_engine_service` | 8085 | Java/Spring Boot 3.5.14 | ✅ | CV analyze/improve/recommend, Spring AI + Ollama |

---

## 2. Detailed Status by Service

### Infrastructure
| Component | Status | Notes |
|-----------|--------|-------|
| `docker-compose.yaml` (dev) | ✅ | MongoDB, PostgreSQL, Redis, RabbitMQ, Elasticsearch with healthchecks |
| `docker-compose.prod.yaml` | ⚠️ | App services defined with image refs — **Dockerfiles missing** |
| `.env.example` | ✅ | All env vars documented |
| `scripts/bootstrap.sh` | ✅ | Automated setup script |

### API Gateway (8080)
| Feature | Status |
|---------|--------|
| Local JWT validation (`GatewayJwtUtils` — HS512, no user-service roundtrip) | ✅ |
| Redis JWT blacklist check (`BlacklistCheckService`) | ✅ |
| Forward `X-User-Id`, `X-User-Scope`, `X-Gateway-Secret` to downstream | ✅ |
| Routes: `/user/**`, `/job/**`, `/application/**`, `/notification/**`, `/ai/**` | ✅ |
| Public routes matcher (register, login, OTP, public job reads) | ✅ |
| Rate limiter | ❌ |
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
| Role / Permission CRUD | ✅ |
| Mongock migration (seed ADMIN/CANDIDATE/RECRUITER roles) | ✅ |
| `InternalAuthFilter` (header-based auth from gateway) | ✅ |
| Recruiter: `tax_code`, `logo_url`, `status`, `quota_job_post`, `quota_cv_views` | ❌ |
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
| RabbitMQ events: publish on ACCEPTED, REJECTED, WITHDRAWN | ✅ |
| `InternalAuthFilter` | ✅ |
| CV file URL stored in application (`cvUrl` field) but **no S3 upload endpoint** | ❌ |
| CI (`application-ci.yml`) | ✅ |

### Notification Service (8084)
| Feature | Status |
|---------|--------|
| OTP via SMTP email | ✅ |
| OTP via Twilio SMS | ✅ |
| OTP store/verify in Redis (TTL) | ✅ |
| RabbitMQ consumer: OTP send events | ✅ |
| PostgreSQL persistence for notification records | ✅ |
| Consume `application.accepted/rejected/withdrawn` events | ❌ |
| Email template for application result | ❌ |
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
| `ai_engine_service` missing from `docker-compose.prod.yaml` | ❌ |
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

## 3. Remaining Work

### P0 — Required for complete backend

#### R1: Notification Service — application events
Notification-service currently has no consumer for the events published by application_service
(`application.accepted`, `application.rejected`, `application.withdrawn`).

**To implement:**
- Add consumer in `notification-service/internal/notification/consumer.go` for these 3 routing keys.
- Create email template for application result (candidate receives outcome + rejectionReason if rejected).
- Message payload already defined: `ApplicationEventMessage` (applicationId, candidateId,
  jobId, recruiterId, newStatus, rejectionReason).

#### R2: Dockerfiles for all application services

`docker-compose.prod.yaml` references images like `smartcv/api-gateway:latest` but no
`Dockerfile` exists in any service directory.

**Files to create:**
```
api-gateway/Dockerfile
user-service/Dockerfile
job_service/Dockerfile
application_service/Dockerfile
notification-service/Dockerfile
ai_engine_service/Dockerfile
```

Java services: multi-stage build (`maven:3.9-amazoncorretto-21` → `amazoncorretto:21-alpine`).
Go service: multi-stage build (`golang:1.25-alpine` → `alpine:3.19`).

#### R3: AI service in docker-compose.prod.yaml

`ai_engine_service` and Ollama are not present in `docker-compose.prod.yaml`.

**Add:**
```yaml
ai-engine-service:
  image: ${AI_SERVICE_IMAGE:-smartcv/ai-engine-service:latest}
  environment:
    OLLAMA_BASE_URL: http://ollama:11434
    ...

ollama:
  image: ollama/ollama
  volumes:
    - ollama_data:/root/.ollama
```

---

### P1 — Should have before demo/deploy

#### R4: Recruiter entity — missing business fields

Current `Recruiter.java` has: `userId`, `companyName`, `companyWebsite`, `companyAddress`,
`companyDescription`. Missing fields needed for the job posting quota system:

| Field | Type | Purpose |
|-------|------|---------|
| `taxCode` | String | Company tax code for verification |
| `logoUrl` | String | Company logo (S3 URL) |
| `status` | enum `APPROVED/PENDING/REJECTED` | Recruiter account approval |
| `quotaJobPost` | int | Max active job postings allowed |
| `quotaCvViews` | int | Max CV views allowed |

#### R5: S3 / CV file upload

No file upload endpoint exists anywhere. `application_service` stores `cvUrl` but there is
no mechanism for a candidate to upload a PDF and receive a URL.

**Minimum required:**
- `POST /api/candidates/cv/upload` in user-service — accepts multipart PDF, stores in S3,
  returns presigned URL.
- Dependencies: `software.amazon.awssdk:s3`, `S3Config.java`, PDF size/type validation (max 5MB).

#### R6: Gateway rate limiter

Redis is already connected at the gateway but no rate limit filter is configured.

**To add in `api-gateway/application.yaml`:**
```yaml
default-filters:
  - name: RequestRateLimiter
    args:
      redis-rate-limiter.replenishRate: 10
      redis-rate-limiter.burstCapacity: 20
```

---

### P2 — Nice to have / Post-MVP

| Item | Notes |
|------|-------|
| RabbitMQ dead-letter queues | Retry failed messages 3× then route to DLQ |
| Payment service / VNPAY mock | Needed for recruiter quota packages |
| AI mock interview question generator | Add `POST /api/ai/interview-questions` to ai_engine_service |
| End-to-end integration tests | Full flow: register → apply → AI score → notify |
| AWS EC2 deploy + deploy pipeline | Final production deployment |

---

## 4. Execution Order for Remaining P0/P1 Work

```
R1  Notification: application events consumer    ~1 day
R2  Dockerfiles for all 6 services               ~1 day
R3  ai_engine_service in docker-compose.prod     ~2 hours
R4  Recruiter: add 5 missing fields              ~3 hours
R5  S3 CV upload endpoint                        ~1 day
R6  Gateway rate limiter config                  ~1 hour

Total P0+P1                                      ~4-5 days
```

---

## 5. Service Map (current)

```
Client → API Gateway :8080
              ├── /user/**         → User Service :8081          (JWT auth + user mgmt)
              ├── /job/**          → Job Service :8082           (jobs + Elasticsearch)
              ├── /application/**  → Application Service :8083   (apply lifecycle)
              ├── /notification/** → Notification Service :8084  (OTP + email/SMS)
              └── /ai/**           → AI Engine Service :8085     (Llama 3 analysis)

Async events (RabbitMQ):
  user-service       → notification-service    (OTP send)
  application_service → notification-service   (accepted/rejected/withdrawn) ← ❌ not consumed yet

Sync HTTP (internal):
  application_service → job_service            (validate job ACTIVE before apply)
  ai_engine_service   → job_service            (fetch job details for analysis)
```
