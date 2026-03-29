# MICROSERVICES ARCHITECTURE & TECH STACK DOCUMENT

## 1. Tech Stack Selection

### 1.1 Frontend (Candidate & Employer)
* **Code Framework:** `React 19` alongside `Vite` for maximized build velocity, utilizing `TypeScript` for safely-typed object communication with microservice APIs.
* **Component / Style:** `TailwindCSS 4`, `Shadcn UI` for easy-to-use component blocks and extreme visual aesthetics fitting for a Web ATS System.
* **State & Query Management:** 
  * `Zustand` (Fast, lightweight) for global state management (e.g., Global Auth Token, App Loading Status).
  * `TanStack Query` for Data API calls, utilizing auto Caching, auto Refetching, paired with the `Orval` client code generator. Orval auto-generates Axios calls and TanStack Query Hooks from a Swagger/OpenAPI file, cutting client JSON modeling time by 80%.

### 1.2 Backend Service Array (Java Spring Universe)
Java reigns as the "King" of Enterprise-grade Microservices.
* **Spring Boot 3:** The core for booting microservices, running Java 17/21.
* **Spring Cloud & Gateway:** Spring Cloud for service discovery (Eureka, if required), Config Server. Spring Cloud API Gateway acts as the Front Controller routing Routes (`/api/users/** -> UserService`).
* **Spring Security:** Authentication OAuth2, JWT Resource Server situated at the Gateway layering or distributed across Services.
* **Spring Data MongoDB:** Replaces JPA for Mongo Collections queries, structuring Documents via `@Document`.
* **Database & Cache:** `MongoDB` serves as the primary data persistence layer. Configurations, API Rate Limit, and Caching sessions utilize `Redis`.
* **Message Broker:** `RabbitMQ` manages the queuing system, administering mail dispatch down the queue for asynchronous node sending.
* **AI Core:** Calls Spring AI to standardize prompt requests directed to the `Llama 3 API` library.

### 1.3 Golang Notification Infrastructure
Pursuant to requirements to achieve absolute peak performance—ensuring zero dropped WebSocket (realtime) or Email notifications—an isolated Node written in **Golang** is spun up, operating strictly as a RabbitMQ Consumer.
* Uses `Echo V5` as a Web/Rest handler for exposing open APIs. `GORM` connects to a miniature internal Notification Log DB.
* Golang's unparallelled concurrency strength (Go Routines) enables it to catch and broadcast tens of thousands of socket notifications seamlessly to web applications.
* Integrates SMTP Email modules and Twilio SDK SMS (should external OTP be required).

## 2. Isolated Microservice Port Mapping

As dictated by the System Diagram, independent Ports and Services are provisioned:

1. **User Service (Port 8081):**
    * Manages End-user CRUD intelligence (Candidate, Company).
    * Connects: MongoDB (User logic). Spring Security + JWT Handler for Auth Signin/Signup.

2. **Job Service (Port 8082):**
    * Administers Master Data covering professions (Accounting, IT...), list of Jobs currently hiring by companies.
    * Connects: MongoDB (Job repository). Spring Cache (via Redis Cache) for category lists. Links exclusively to an `Elasticsearch Search Engine` optimizing Full-text keyword searches like "Java React Junior" navigating through dense Job Descriptions instantly, bypassing slow Regex MongoDB scans.

3. **Application & CV Service (Port 8083):**
    * Origin where Candidates apply.
    * Connects: AWS S3 SDK (File Upload Data) housing the CV PDFs, HTTP Client, and RabbitMQ.

4. **Notification Service (Golang - Port 8084):**
    * Combines Spring WebSocket/Golang WebSocket for real-time pushing, Spring/Golang Mail Sender, integrated heavily with RabbitMQ to Listen and Transmit.

5. **AI CVReview & Recommender Service (Port 8085):**
    * Dictates all core AI Prompts logic. Downloads Files from S3, extracts text, calls LLMs.

## 3. Deployment Topology & CI/CD
All operations run isolated across a **Docker Bridge Network**.
* Each service (inclusive of FE) builds out via pre-defined `Dockerfile`s.
* Aggregated systemic deployment navigates through the `docker-compose.yml` defining environment variables, networks, and volumes (MongoDB Volume, Redis Volume) hosted on an `AWS EC2 Instance`.
* **CI/CD:** Utilizes `GitHub Actions` capturing Trigger `git commit` Pushes. 
  * Action executes test (JUnit/Testify Golang). Meets coverage.
  * Pushes the Docker image into the repository (Docker Hub/ AWS Elastic Container Registry - ECR).
  * Triggers an automated SSH script to access EC2, pull the image, and reproduce the container, dropping Down time ~ down to seconds. Supports perfect system scoring for cloud architectures.

---
*Version: 1.0 - Last Updated: 2026-03*
