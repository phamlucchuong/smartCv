# SmartCV Backend — Project Status & Remaining Work

**Updated:** 2026-05-29
**Branch:** `feat/ai-scoring` (R7 + R8 merged via commit `4c1f4d7`)
**Companion plan:** [20260526-0003-r9-r10-r11-completion.md](20260526-0003-r9-r10-r11-completion.md)

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Fully implemented and committed |
| ⚠️ | Partially implemented — has known gaps listed below |
| ❌ | Not started |

---

## 1. Service Status Overview

| Service | Port | Language | Status | Notes |
|---------|------|----------|--------|-------|
| `api-gateway` | 8080 | Java/Spring Cloud Gateway | ⚠️ | Missing `/payment/**` route |
| `user-service` | 8081 | Java/Spring Boot 3.4.4 | ⚠️ | Missing internal quota endpoint for payment_service |
| `job_service` | 8082 | Java/Spring Boot 3.5.14 | ⚠️ | Missing recruiter status + quota gate on createJob |
| `application_service` | 8083 | Java/Spring Boot 3.5.14 | ⚠️ | No candidate email after AI scoring; no auto-status by score |
| `notification-service` | 8084 | Go 1.25/Echo v5 | ✅ | OTP + application result emails |
| `ai_engine_service` | 8085 | Java/Spring Boot 3.5.14 | ⚠️ | `analyze` response is basic (see issue #enhance-cv-scoring) |
| `payment_service` | 8086 | Java/Spring Boot 3.5.14 | ⚠️ | Scaffold only — zero business logic |

---

## 2. Detailed Status by Service

### Infrastructure

| Component | Status | Notes |
|-----------|--------|-------|
| `docker-compose.yaml` (dev) | ✅ | MongoDB, PostgreSQL, Redis, RabbitMQ, Elasticsearch |
| `docker-compose.prod.yaml` | ⚠️ | All 6 existing services + Ollama — **payment_service missing** |
| Dockerfiles (6 existing services) | ✅ | Multi-stage Java/Go |
| `payment_service/Dockerfile` | ❌ | Not created yet |
| `.env.example` | ⚠️ | Missing `PAYMENT_SERVICE_PORT`, `PAYMENT_MONGO_DB_NAME` |
| `scripts/bootstrap.sh` | ✅ | |

### API Gateway (8080)

| Feature | Status |
|---------|--------|
| JWT validation, Redis blacklist, rate limiter | ✅ |
| Routes: `/user/**`, `/job/**`, `/application/**`, `/notification/**`, `/ai/**` | ✅ |
| Route: `/payment/**` → payment_service:8086 | ❌ |
| CI (`gateway-ci.yml`) | ✅ |

### User Service (8081)

| Feature | Status |
|---------|--------|
| Register / OTP / Login / Refresh / Logout / Forgot+Reset password | ✅ |
| User CRUD, Candidate CRUD, Recruiter CRUD | ✅ |
| Recruiter `status` (PENDING/APPROVED/REJECTED), `quotaJobPost`, `quotaCvViews` | ✅ |
| Admin: `PATCH /api/recruiters/{id}/status` — approve/reject + set quotas | ✅ |
| S3 CV upload (presigned URL, PDF 5 MB max) | ✅ |
| `POST /internal/recruiters/{id}/quota` — delta-based quota add for payment_service | ❌ |
| CI (`user-ci.yml`) | ✅ |

### Job Service (8082)

| Feature | Status |
|---------|--------|
| Job CRUD, Elasticsearch dual-write, full-text search | ✅ |
| `GET /api/jobs/active` (public, paginated) | ✅ |
| Role-based auth: RECRUITER owns jobs | ✅ |
| Gate `createJob`: check recruiter status = APPROVED via user-service | ❌ |
| Gate `createJob`: consume `quotaJobPost` atomically via user-service | ❌ |
| Refund quota on `closeJob` / `deleteJob` | ❌ |
| CI (`job-ci.yml`) | ✅ |

### Application Service (8083)

| Feature | Status |
|---------|--------|
| Submit, view, withdraw, status lifecycle, admin ops | ✅ |
| Duplicate prevention, JobClient validation, UserClient email fetch | ✅ |
| RabbitMQ publish on ACCEPTED / REJECTED / WITHDRAWN → notification email | ✅ |
| AI score stored: `aiScore`, `matchedSkills`, `missingSkills`, `aiStatus` | ✅ |
| Send candidate notification email after AI scoring completes (US-03) | ❌ |
| Auto-change status on AI score result (≥70 → REVIEWING, <50 → consider auto-reject) | ❌ |
| CI (`application-ci.yml`) | ✅ |

### Notification Service (8084)

| Feature | Status |
|---------|--------|
| OTP email + SMS (Twilio), Redis TTL | ✅ |
| RabbitMQ consumer: OTP + ACCEPTED/REJECTED/WITHDRAWN events | ✅ |
| Email template for application result | ✅ |
| Email template for AI scoring result (score + missing skills) | ❌ |
| CI (`noti-ci.yml`) | ✅ |

### AI Engine Service (8085)

| Feature | Status |
|---------|--------|
| `POST /api/ai/analyze` — matchScore, matchedSkills, missingSkills (flat list) | ✅ |
| `POST /api/ai/improve` — strengths, weaknesses, tips | ✅ |
| `POST /api/ai/recommend` — top-K job matches | ✅ |
| `POST /api/ai/interview-questions` — 5 questions (RECRUITER) | ✅ |
| Async CV scoring consumer (RabbitMQ) | ✅ |
| Enrich `/analyze`: `criticalSkills`, `niceToHaveSkills`, `passingRateEstimate` | ❌ (issue filed: `docs/issues/20260529_1430_enhance-cv-scoring-response.md`) |
| RabbitMQ DLQ on `cv.scoring.queue` (retry 3× on Ollama timeout) | ❌ |
| CI (`ai-ci.yml`) | ✅ |

### Payment Service (8086) — R9

| Feature | Status |
|---------|--------|
| Spring Boot scaffold (`PaymentServiceApplication.java`, `application.yaml`) | ✅ |
| `Invoice` entity (MongoDB): id, recruiterId, packageCode, amount, quotaJobPost, status, timestamps | ❌ |
| `GET /api/payments/packages` — list BASIC/PRO/ENTERPRISE packages | ❌ |
| `POST /api/payments/orders` — create PENDING invoice | ❌ |
| `POST /api/payments/confirm/{orderId}` — flip PAID + call user-service quota endpoint | ❌ |
| `@Async` mock-confirm task (fires 3 s after order creation) | ❌ |
| `GET /api/payments/orders/my` — paginated invoices for recruiter | ❌ |
| MongoDB session/transaction wrapping Invoice update + quota call | ❌ |
| `UserClient` in payment_service (calls `/internal/recruiters/{id}/quota`) | ❌ |
| `InternalAuthFilter` in payment_service | ❌ |
| `SecurityConfig` (RECRUITER-gated endpoints) | ❌ |
| Dockerfile | ❌ |
| `payment-ci.yml` GitHub Actions | ❌ |

### CI/CD Pipelines

| Pipeline | Status |
|----------|--------|
| Per-service test pipelines (6 workflows) | ✅ |
| `payment-ci.yml` | ❌ |
| `deploy-images.yml` — build + push to Docker Hub on push to `main` | ❌ |
| `deploy-ec2.yml` — SSH → `git pull && docker compose pull && up -d` | ❌ |
| Docker image builds in existing per-service CI | ❌ (commented out) |

---

## 3. Gap Summary — Liệt kê đầy đủ tính năng còn thiếu

### G1 — Payment Service core (R9) [BLOCKING MVP]

All payment business logic is missing from the scaffold. Required work:

1. `Invoice` MongoDB entity + `InvoiceRepository`
2. `PaymentPackage` enum: `BASIC` (5 posts / 0 CV views), `PRO` (20 / 50), `ENTERPRISE` (-1 unlimited)
3. `InvoiceController` → `InvoiceService`:
   - `GET /api/payments/packages`
   - `POST /api/payments/orders` → returns `{orderId, mockReference}`, status PENDING
   - `POST /api/payments/confirm/{orderId}` (INTERNAL) → PAID + quota call
   - `GET /api/payments/orders/my` (paginated)
   - `GET /api/payments/orders/{id}`
4. `@Async` 3-second mock-confirm task after order creation
5. MongoDB session/transaction on confirm (Invoice update + `UserClient.addQuota`)
6. `UserClient` (RestTemplate / WebClient calling `POST /internal/recruiters/{id}/quota`)
7. `InternalAuthFilter` (same pattern as other services)
8. Compensating action: mark Invoice `FAILED` if user-service call fails
9. `Dockerfile` (copy from `application_service/Dockerfile`)
10. Entry in `docker-compose.prod.yaml` (port 8086, depends on MongoDB, user-service)

### G2 — API Gateway `/payment/**` route [BLOCKING G1]

Add to `api-gateway/src/main/resources/application.yaml`:
```yaml
- id: payment-service
  uri: ${PAYMENT_SERVICE_URI:http://localhost:8086}
  predicates:
    - Path=/payment/**
```

### G3 — User Service internal quota endpoint [BLOCKING G1]

`POST /internal/recruiters/{userId}/quota` — guarded by `InternalAuthFilter`.
Body: `{addJobPosts: int, addCvViews: int}`.
Uses `findAndModify` with `$inc` for atomicity. No negative quota allowed.

### G4 — Job Service recruiter quota enforcement (R10) [BLOCKING MVP]

1. Add `UserClient` to `job_service` (HTTP calls to user-service internal endpoints):
   - `GET /internal/recruiters/by-user/{userId}` — returns `{status, quotaJobPost}`
   - `POST /internal/recruiters/by-user/{userId}/consume-job-quota`
   - `POST /internal/recruiters/by-user/{userId}/refund-job-quota`
2. Add corresponding internal controller methods to `user-service`
3. `job_service.createJob()`: before persisting — call `getProfile` (assert status = APPROVED, quota > 0 or = -1) → `consumeJobQuota`.
4. `job_service.closeJob()` / `deleteJob()`: call `refundJobQuota` (max-capped to prevent loops).

### G5 — Candidate notification after AI scoring (US-03) [MVP requirement]

After `application_service.updateAiScore()` stores the score:
1. Publish a new RabbitMQ event `application.ai_scored` with `{candidateEmail, jobTitle, aiScore, missingSkills, scoreLabel}`.
2. `notification-service` consumes `application.ai_scored` → sends email to candidate.
3. Add email template in notification-service: subject "Your application result for [jobTitle]", body includes score badge, matched/missing skills, and tip to use `/api/ai/improve` for improvement advice.

### G6 — AI scoring response enrichment [Filed as issue]

Issue: `docs/issues/20260529_1430_enhance-cv-scoring-response.md`

`CvAnalysisResponse` needs:
- `passingRateEstimate` (int 0–100)
- `criticalSkills` (replaces flat `missingSkills`)
- `niceToHaveSkills`

Impacts: `ai_engine_service` (DTO + prompt + AiScoreResult + CvScoringConsumer), `application_service` (AiScoreUpdateRequest + Application entity + response DTOs + ApplicationService + ApplicationMapper), plus the notification template in G5.

### G7 — RabbitMQ DLQ [Post-MVP, risk-critical]

Ollama frequently times out during CV scoring. Without a DLQ:
- RabbitMQ requeues indefinitely → message storm
- Application stuck in `PENDING` AI status forever

Required:
1. `ai_engine_service` `RabbitMQConfig`: declare `cv.scoring.queue.dlq` + set `x-dead-letter-exchange` + `x-dead-letter-routing-key` on the main queue; set message TTL or max-retries.
2. `application_service` `RabbitMQConfig`: mirror the DLQ binding.
3. Consumer retry: 3 attempts, then route to DLQ; `updateAiScore` called with `aiStatus=FAILED` on exhaustion.
4. Same pattern for `application.*` event queues in notification-service.

### G8 — CI/CD Docker build + EC2 deploy (R11)

1. **`deploy-images.yml`**: trigger on push to `main`; use `dorny/paths-filter` to detect changed services; build + push `phamlucchuong/smartcv-<service>:{latest,<sha>}` per changed service.
2. **Uncomment** Docker build steps in the 7 existing per-service CI workflows (`user-ci.yml`, etc.).
3. **`deploy-ec2.yml`**: `appleboy/ssh-action` → `git pull && docker compose pull && docker compose up -d` on EC2.
4. **`deploy/Caddyfile`**: reverse proxy config for HTTPS/auto-SSL.
5. **`deploy/ec2-bootstrap.sh`**: one-time EC2 setup (Docker, Caddy, Ollama, env vars).
6. **`docs/EN/deployment.md`**: runbook.

### G9 — Demo seed data & E2E script [Post-MVP, required for thesis]

1. `scripts/seed.sh`: 1 admin, 3 recruiters (2 APPROVED with quota), 6 candidates, 15 jobs (ACTIVE), 30 applications (varied statuses + AI scores).
2. `scripts/e2e.sh`: automated happy-path test — register → OTP → login → create job → apply → poll AI score → assert notification email.

### G10 — `.env.example` + Makefile + README updates

1. Add `PAYMENT_SERVICE_PORT=8086`, `PAYMENT_MONGO_DB_NAME=payment_db` to `.env.example`.
2. Add `run-payment` and `test-payment` targets to `Makefile`.
3. Update `READme.md`: add payment_service to service table + Postman collection.
4. Add `payment_service` to `pom.xml` modules list (if root POM aggregates all services).

---

## 4. Priority Order & Timeline

| # | Gap | Blocking | Target week | Effort |
|---|-----|----------|-------------|--------|
| G2 | Gateway `/payment/**` route | G1 | Week 10 (by 31/05) | 15 min |
| G3 | User-service internal quota endpoint | G1 | Week 10 (by 31/05) | 2 h |
| G1 | Payment Service full implementation | MVP | Week 10–11 | 8 h |
| G4 | Job Service quota enforcement | MVP | Week 11 | 5 h |
| G5 | Candidate AI score email notification | MVP/US-03 | Week 11 | 2 h |
| G6 | AI scoring response enrichment | Enhancement | Week 11 | 3 h |
| G8 | CI/CD Docker build + EC2 deploy | Deployment | Week 12 | 6 h |
| G7 | RabbitMQ DLQ | Stability | Week 13 | 3 h |
| G9 | Seed data + E2E script | Thesis demo | Week 13 | 7 h |
| G10 | `.env.example` + README + Makefile | Polish | Week 13 | 2 h |

**Deadline: 2026-06-20. Code freeze: 2026-06-17.**

---

## 5. Timeline còn lại

| Tuần | Ngày | Trạng thái | Mục tiêu backend |
|------|------|------------|------------------|
| 9 | 18–24/05 | ✅ done | P1 (Recruiter fields, S3, Rate limiter) |
| 10 | 25–31/05 | 🟡 partial | R7 ✅ R8 ✅ committed; **R9 scaffold done, logic còn thiếu; G2+G3 cần hoàn thành** |
| 11 | 01–07/06 | ⏳ | G1 (payment logic) + G4 (quota enforcement) + G5 (AI score email) + G6 (scoring enrichment) |
| 12 | 08–14/06 | ⏳ | G8 (Docker build + EC2 deploy) |
| 13 | 15–20/06 | ⏳ | G7 DLQ + G9 seed+e2e + G10 polish; **code freeze 2026-06-17** |

---

## 6. Service Map (current + planned)

```
Client → API Gateway :8080
              ├── /user/**         → User Service :8081          ✅
              ├── /job/**          → Job Service :8082           ⚠️ quota gate missing
              ├── /application/**  → Application Service :8083   ⚠️ AI score email missing
              ├── /notification/** → Notification Service :8084  ✅
              ├── /ai/**           → AI Engine Service :8085     ⚠️ enrichment pending
              └── /payment/**      → Payment Service :8086       ❌ route missing; logic missing

Async events (RabbitMQ):
  user-service        → notification-service  (OTP send)                            ✅
  application_service → notification-service  (ACCEPTED/REJECTED/WITHDRAWN)        ✅
  application_service → notification-service  (AI score result email — G5)          ❌
  application_service → ai_engine_service     (cv.scoring.queue)                   ✅
  ai_engine_service   → application_service   (PATCH ai-score callback)            ✅
  any queue           → *.dlq                 (DLQ on 3 failures — G7)             ❌

Sync HTTP (internal, X-Gateway-Secret):
  application_service → job_service           (validate job ACTIVE)                ✅
  application_service → user_service          (fetch candidateEmail)               ✅
  ai_engine_service   → job_service           (fetch job details)                  ✅
  ai_engine_service   → application_service   (PATCH ai-score)                     ✅
  job_service         → user_service          (verify APPROVED + consume quota)    ❌ G4
  payment_service     → user_service          (add quota on PAID — G1+G3)          ❌
```

---

## 7. MVP Feature Checklist (from BRD/PRD/USER_STORIES)

| User Story | Requirement | Status |
|------------|-------------|--------|
| US-01 | Candidate signup via email + OTP | ✅ |
| US-02 | Recruiter signup → Admin approval flow | ✅ |
| US-03 | AI Apply: async CV scoring on apply | ✅ scoring |
| US-03 | Candidate receives email with score + missing skills | ❌ G5 |
| US-04 | Recruiter views AI Summary on application detail | ✅ |
| US-05 | Kanban ATS: status transitions with notifications | ✅ (API) |
| US-06 | Mock Interview AI question generation (RECRUITER) | ✅ |
| US-07 | Recruiter purchases quota package (mock payment) | ❌ G1 |
| PRD 2.1 | Job search + Elasticsearch | ✅ |
| PRD 2.1 | AI Job Recommender | ✅ |
| PRD 2.2 | Recruiter quota gating on job post | ❌ G4 |
| PRD 3 | Deployable via Docker Compose on EC2 | ❌ G8 |
| MVP §3 | RabbitMQ for email + CV evaluation | ✅ |
| MVP §3 | Docker Compose + EC2 deployment | ❌ G8 |
