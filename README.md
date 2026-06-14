# SmartCV — AI-Powered Job Matching Platform

SmartCV bridges candidates and employers through AI: CV analysis, job matching scores, automated screening, and interview preparation — all in one platform.

This repository is a **monorepo** containing both the backend microservices and the frontend applications.

```
smartcv/
├── backend/     Java/Spring Boot microservices + Go notification service
└── frontend/    pnpm monorepo — web-candidate, web-recruiter, web-admin
```

---

## Architecture Overview

```
Client
  └── API Gateway (8080)  — JWT auth, routing, rate limiting
        ├── User Service (8081)        MongoDB   — auth, OTP, profiles
        ├── Job Service (8082)         MongoDB + Elasticsearch — jobs, search
        ├── Application Service (8083) MongoDB   — applications, CV storage
        ├── Notification Service (8084) PostgreSQL + Redis — email, SMS, push (Go)
        └── AI Core Service (8085)     Spring AI + Llama 3 — CV analysis, matching
```

Async events flow through **RabbitMQ**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 21, Spring Boot 3.x, Go 1.25 |
| Frontend | React 19, Vite, TypeScript, TanStack Router/Query |
| Databases | MongoDB, PostgreSQL, Redis, Elasticsearch |
| Messaging | RabbitMQ |
| Infrastructure | Docker Compose |
| CI/CD | GitHub Actions |

---

## Getting Started

### Prerequisites

- Java 21, Maven
- Go 1.25+
- Node.js 22+, pnpm 11+
- Docker & Docker Compose

### Setup

```bash
# 1. Clone
git clone https://github.com/phamlucchuong/smartCv-be.git
cd smartCv-be

# 2. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# 3. Start infrastructure
make compose-up

# 4. Install frontend dependencies
make fe-install
```

---

## Running the Project

### Backend services

```bash
make run-gateway       # API Gateway    port 8080
make run-user          # User Service   port 8081
make run-job           # Job Service    port 8082
make run-noti          # Notification   port 8084
```

Or start all at once:

```bash
make run-backend
```

### Frontend apps

```bash
make fe-dev-candidate  # web-candidate  port 3000
make fe-dev-recruiter  # web-recruiter  port 3001
make fe-dev-admin      # web-admin      port 3003

# Or all apps in parallel:
make fe-dev
```

---

## Testing

```bash
make test              # All backend tests + frontend lint/build
make test-user         # User Service only
make test-noti         # Notification Service only
make fe-lint           # Frontend lint
make fe-build          # Frontend production build
```

---

## Project Structure

```
backend/
├── api-gateway/           API Gateway (Spring Cloud Gateway)
├── user-service/          User management, auth, OTP
├── job_service/           Job listings, Elasticsearch search
├── application_service/   Applications, CV file storage
├── ai_engine_service/     AI core — CV analysis, matching
├── notification-service/  Email/SMS/push notifications (Go)
├── docker-compose.yaml    Local infrastructure
├── Makefile               Backend make targets
└── plans/                 Architecture docs and issue tracking

frontend/
├── apps/
│   ├── web-candidate/     Candidate portal (port 3000)
│   ├── web-recruiter/     Recruiter portal (port 3001)
│   └── web-admin/         Admin dashboard (port 3003)
├── packages/
│   ├── api/               Generated API hooks (Orval + React Query)
│   ├── ui/                Design system (shadcn/ui + Tailwind)
│   └── i18n/              Localization EN/VI (i18next)
└── pnpm-workspace.yaml
```

---

## Documentation

- Backend details: [`backend/CLAUDE.md`](backend/CLAUDE.md), [`backend/README.md`](backend/READme.md)
- Frontend details: [`frontend/CLAUDE.md`](frontend/CLAUDE.md), [`frontend/README.md`](frontend/README.md)
- Architecture decisions: [`backend/plans/EN/`](backend/plans/EN/)

---

## API Documentation

Swagger UI is available at `http://localhost:{port}/{context-path}/swagger-ui.html` for each Java service.

Example: `http://localhost:8081/user/swagger-ui.html`

Postman collections: [`backend/postman/`](backend/postman/)
