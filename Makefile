

run:
	user:
		cd user-service/ && ./mvnw spring-boot:run
	gateway:
		cd api-gateway/ && ./mvnw spring-boot:run

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
