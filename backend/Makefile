
# test commands
test-user:
	set -a; [ -f .env ] && . ./.env; set +a; cd user-service/ && ./mvnw test

test-gateway:
	set -a; [ -f .env ] && . ./.env; set +a; cd api-gateway/ && ./mvnw test

test-job:
	set -a; [ -f .env ] && . ./.env; set +a; cd job_service/ && ./mvnw test

test-noti:
	cd notification-service/ && go test ./... -v

test: test-user test-gateway test-job test-noti


# run services
run-user:
	set -a; [ -f .env ] && . ./.env; set +a; cd user-service/ && ./mvnw spring-boot:run
run-gateway:
	set -a; [ -f .env ] && . ./.env; set +a; cd api-gateway/ && ./mvnw spring-boot:run
run-job:
	set -a; [ -f .env ] && . ./.env; set +a; cd job_service/ && ./mvnw spring-boot:run
run-noti:
	cd notification-service/ && go run cmd/server/main.go

run: run-user run-gateway run-job run-noti

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
