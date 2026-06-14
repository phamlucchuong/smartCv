# ── Backend ──────────────────────────────────────────────────────────────────

test-user:
	$(MAKE) -C backend test-user

test-gateway:
	$(MAKE) -C backend test-gateway

test-job:
	$(MAKE) -C backend test-job

test-application:
	$(MAKE) -C backend test-application

test-ai:
	$(MAKE) -C backend test-ai

test-noti:
	$(MAKE) -C backend test-noti

test-backend: test-user test-gateway test-job test-application test-ai test-noti

run-user:
	$(MAKE) -C backend run-user

run-gateway:
	$(MAKE) -C backend run-gateway

run-job:
	$(MAKE) -C backend run-job

run-application:
	$(MAKE) -C backend run-application

run-ai:
	$(MAKE) -C backend run-ai

run-noti:
	$(MAKE) -C backend run-noti

run-backend:
	$(MAKE) -C backend run

stop:
	$(MAKE) -C backend stop

migrate-user:
	$(MAKE) -C backend migrate-user

migrate-job:
	$(MAKE) -C backend migrate-job

migrate-all:
	$(MAKE) -C backend migrate-all

# ── Infrastructure ────────────────────────────────────────────────────────────

compose-up:
	$(MAKE) -C backend compose-up

compose-down:
	$(MAKE) -C backend compose-down

compose-build:
	$(MAKE) -C backend compose-build

compose-logs:
	$(MAKE) -C backend compose-logs

compose-restart:
	$(MAKE) -C backend compose-restart

# ── Frontend ──────────────────────────────────────────────────────────────────

fe-install:
	cd frontend && pnpm install

fe-dev:
	cd frontend && pnpm dev

fe-dev-candidate:
	cd frontend && pnpm -F web-candidate dev

fe-dev-recruiter:
	cd frontend && pnpm -F web-recruiter dev

fe-dev-admin:
	cd frontend && pnpm -F web-admin dev

fe-build:
	cd frontend && pnpm build

fe-lint:
	cd frontend && pnpm lint

fe-generate-api:
	cd frontend && pnpm generate:api

# ── Combined ──────────────────────────────────────────────────────────────────

test: test-backend
	cd frontend && pnpm lint && pnpm build

setup:
	bash backend/scripts/bootstrap.sh
	cd frontend && pnpm install
