# test commands
test-user:
	set -a; [ -f .env ] && . ./.env; set +a; cd user-service/ && ./mvnw test

test-gateway:
	set -a; [ -f .env ] && . ./.env; set +a; cd api-gateway/ && ./mvnw test

test-job:
	set -a; [ -f .env ] && . ./.env; set +a; cd job_service/ && ./mvnw test

test-application:
	set -a; [ -f .env ] && . ./.env; set +a; cd application_service/ && ./mvnw test

test-ai:
	set -a; [ -f .env ] && . ./.env; set +a; cd ai_engine_service/ && ./mvnw test

test-noti:
	cd notification-service/ && go test ./... -v

test: test-user test-gateway test-job test-application test-ai test-noti


# run services
run-user:
	set -a; [ -f .env ] && . ./.env; set +a; cd user-service/ && ./mvnw spring-boot:run
run-gateway:
	set -a; [ -f .env ] && . ./.env; set +a; cd api-gateway/ && ./mvnw spring-boot:run
run-job:
	set -a; [ -f .env ] && . ./.env; set +a; cd job_service/ && ./mvnw spring-boot:run
run-application:
	set -a; [ -f .env ] && . ./.env; set +a; cd application_service/ && ./mvnw spring-boot:run
run-ai:
	set -a; [ -f .env ] && . ./.env; set +a; cd ai_engine_service/ && ./mvnw spring-boot:run
run-noti:
	cd notification-service/ && go run cmd/server/main.go

run: run-user run-gateway run-job run-application run-ai run-noti

# run migrations without manual cd (process auto-stops after timeout)
migrate-user:
	set -a; [ -f .env ] && . ./.env; set +a; \
	timeout 45s sh -c 'cd user-service && ./mvnw spring-boot:run -Dspring-boot.run.arguments="--server.port=0 --spring.main.web-application-type=none"' || [ $$? -eq 124 ]

migrate-job:
	set -a; [ -f .env ] && . ./.env; set +a; \
	timeout 45s sh -c 'cd job_service && ./mvnw spring-boot:run -Dspring-boot.run.arguments="--server.port=0 --spring.main.web-application-type=none --app.search.enabled=false --spring.data.elasticsearch.repositories.enabled=false"' || [ $$? -eq 124 ]

migrate-all: migrate-user migrate-job


# docker compose commands
compose-up:
	docker compose -f docker-compose.yaml up -d
compose-down:
	docker compose -f docker-compose.yaml down
compose-build:
	docker compose -f docker-compose.yaml build
compose-logs:
	docker compose -f docker-compose.yaml logs -f
compose-restart:
	docker compose -f docker-compose.yaml restart
