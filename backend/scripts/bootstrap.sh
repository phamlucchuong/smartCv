#!/usr/bin/env bash
# Bootstrap dev environment for Smart CV Backend & Infra.
# Usage: bash scripts/bootstrap.sh

set -euo pipefail

echo "=== Smart CV Backend Dev Bootstrap ==="
echo ""

# 1. Check prerequisites
echo "[1/4] Checking prerequisites..."
command -v java >/dev/null 2>&1 || { echo "ERROR: Java not found. Please install JDK 21."; exit 1; }
command -v mvn >/dev/null 2>&1 || { echo "ERROR: Maven not found."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "ERROR: Docker not found."; exit 1; }

JAVA_VER=$(java -version 2>&1 | head -n 1)
DOCKER_VER=$(docker version --format '{{.Server.Version}}' 2>/dev/null || echo "Unknown")

echo "  - Java: $JAVA_VER"
echo "  - Docker: $DOCKER_VER"

# 2. Setup Environment
echo ""
echo "[2/4] Setting up environment variables..."
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "Created .env from .env.example"
  else
    echo "Warning: .env.example not found. Please create .env manually."
  fi
else
  echo ".env already exists, skipping"
fi

# 3. Backend Build
echo ""
echo "[3/4] Building Backend (Spring Boot)..."
mvn clean install -DskipTests -f pom.xml

# 4. Start Infrastructure
echo ""
echo "[4/4] Starting Docker infrastructure..."
docker compose -f docker-compose.yaml up -d

echo ""
echo "=== Bootstrap Complete ==="
echo ""
echo "Next steps:"
echo "  1. Check containers status: docker compose -f docker-compose.yaml ps"
echo "  2. View logs: docker compose -f docker-compose.yaml logs -f"
echo "  3. Run application: './mvnw spring-boot:run' or 'make run'"
echo ""
echo "Endpoints (default):"
echo "  - MongoDB: localhost:27017"
echo "  - Redis:      localhost:6379"