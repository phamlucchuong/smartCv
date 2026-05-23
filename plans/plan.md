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

## 3. Remaining Work

### P2 — Nice to have / Post-MVP

| Item | Notes |
|------|-------|
| RabbitMQ dead-letter queues | Retry failed messages 3× then route to DLQ |
| Recruiter status enforcement in job-service | `createJob()` should verify recruiter `status == APPROVED` via user-service |
| Payment service / VNPAY mock | Needed for recruiter quota packages |
| AI mock interview question generator | Add `POST /api/ai/interview-questions` to ai_engine_service |
| End-to-end integration tests | Full flow: register → apply → AI score → notify |
| Docker image builds in CI | Push images to registry on merge to main |
| AWS EC2 deploy + deploy pipeline | Final production deployment |

---

## 4. Service Map (current)

```
Client → API Gateway :8080  [rate limit: 20 req/s global, 5 req/s auth]
              ├── /user/**         → User Service :8081          (JWT auth + user mgmt + S3)
              ├── /job/**          → Job Service :8082           (jobs + Elasticsearch)
              ├── /application/**  → Application Service :8083   (apply lifecycle)
              ├── /notification/** → Notification Service :8084  (OTP + email/SMS)
              └── /ai/**           → AI Engine Service :8085     (Llama 3 analysis)

Async events (RabbitMQ):
  user-service        → notification-service   (OTP send)
  application_service → notification-service   (accepted/rejected/withdrawn) ✅ consumed

Sync HTTP (internal):
  application_service → job_service            (validate job ACTIVE before apply)
  application_service → user_service           (fetch candidateEmail at submit time)
  ai_engine_service   → job_service            (fetch job details for analysis)
```
