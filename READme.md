# SmartCV - AI-Powered Job Matching Platform

<!-- ![SmartCV Logo](docs/images/logo.png) -->

## 1. Project Overview

**SmartCV** is a modern recruitment platform designed to bridge the gap between candidates and employers through the power of Artificial Intelligence (AI). Unlike traditional job boards, SmartCV is not just a place to post jobs and apply; it serves as an intelligent "mentor" helping candidates optimize their profiles and enabling employers to automate the talent screening process.

Built on a robust **Microservices architecture**, the project offers high scalability and performance. The system focuses on creating a seamless, aesthetically pleasing, and highly efficient user experience for three primary user groups: **Candidates**, **Employers**, and **System Administrators**.

---

## 2. Project Goals

The core objective of SmartCV is to optimize the recruitment and job-seeking process using technology:

### For Candidates:
*   **Eliminate "Blind Applying":** Provides a % Matching Score between the CV and JD (Job Description) so candidates know their suitability level.
*   **AI Career Mentorship:** AI analyzes skill gaps and suggests personalized learning roadmaps to meet job requirements.
*   **Interview Preparation:** Automatically generates Mock Interview questions based on the candidate's actual CV content.

### For Employers:
*   **Automated Screening (Auto-Screener):** Saves 80% of screening time by using AI to automatically categorize qualified resumes.
*   **Application Tracking System (ATS):** Provides a professional recruitment workflow with an integrated Kanban board to manage candidates from application to hire.
*   **Improved Hiring Accuracy:** AI helps discover the actual skills and potential of candidates beyond simple keyword matching.

---

## 3. Architecture

SmartCV adopts a Microservices model to ensure high availability and maintainability.

### General Architecture Diagram:
The system consists of several components collaborating via HTTP/REST protocols and Message Brokers:

1.  **API Gateway (Port 8080):** 
    -   The single entry point for all client requests.
    -   Handles Routing, Authentication (JWT), and Rate Limiting.
2.  **User Service (Port 8081):** 
    -   Manages user identities, OTP verification, and profiles for Candidates and Employers.
    -   Uses **MongoDB** as the primary persistence store.
3.  **Job Service (Port 8082):** 
    -   Manages job posting rights, recruitment business logic, and job discovery.
    -   Integrates **Elasticsearch** for high-speed full-text searching.
4.  **Application & CV Service (Port 8083):** 
    -   Handles application logic, cloud file storage for CVs, and coordinates with the AI Service.
5.  **Notification Service (Port 8084 - Golang):** 
    -   A high-performance service for sending Emails (SMTP) and real-time notifications (Web Push/Firebase).
    -   Consumes events from **RabbitMQ**.
6.  **AI Core Service (Port 8085):** 
    -   The heart of the system, using **Spring AI** combined with the **Llama 3** model for CV analysis and matching.

---

## 4. Tech Stack

The system utilizes state-of-the-art technologies to ensure modernization and stability:

### Frontend
-   **Framework:** React 19, Vite, TypeScript.
-   **Styling:** TailwindCSS 4, Shadcn UI (Glassmorphism & Modern UI components).
-   **State Management:** Zustand & TanStack Query (React Query).

### Backend
-   **Java Ecosystem:** Spring Boot 3, Spring Security (JWT), Spring Data MongoDB.
-   **Go Ecosystem:** Golang, Echo V5 (for high-performance notification handling).
-   **AI Integration:** Spring AI, Llama 3 API.

### Data & Messaging
-   **NoSQL Database:** MongoDB (Main storage).
-   **Relational Database:** PostgreSQL (Notification logs storage).
-   **Caching & Session:** Redis (OTP verification, data caching).
-   **Message Broker:** RabbitMQ (Asynchronous task processing).

### Infrastructure & DevOps
-   **Containerization:** Docker & Docker Compose.
-   **CI/CD:** GitHub Actions (Automated build, test, and deployment).
-   **Cloud Storage:** Cloudinary or AWS S3 (CV and Image storage).

---

## 5. Getting Started

### 5.1 Prerequisites
Before starting, ensure you have the following installed:
-   **Docker & Docker Compose** (Docker Desktop recommended).
-   **Java JDK 21** & **Maven**.
-   **Node.js 20+** & **npm/yarn/pnpm**.
-   **Golang 1.25+**.

### 5.2 Fast Environment Setup (Recommended)
We provide a bootstrap script to quickly set up your development environment. This script checks for prerequisites, initializes your `.env` file, builds the backend services, and starts the database infrastructure.

Run the following command from the root directory:
```bash
bash scripts/bootstrap.sh
```

### 5.3 Manual Configuration
If you prefer to set up the system step-by-step:

1.  **Environment Setup:**
    ```bash
    cp .env.example .env
    ```
2.  **Fill in Credentials:**
    Open the `.env` file and fill in required secrets (SMTP, Firebase, Twilio, etc.).

3.  **Build Services:**
    ```bash
    mvn clean install -DskipTests
    ```

4.  **Start Infrastructure:**
    ```bash
    docker compose up -d
    ```

### 5.4 Running for Local Development
After the infrastructure is up, you can run services individually:

**Start Backend Services:**
```bash
# Terminal 1: User Service
make run-user

# Terminal 2: API Gateway
make run-gateway

# Terminal 3: Notification Service
make run-noti
```

---

## 6. Detailed Features

### 6.1 For Candidates
*   **Dynamic Profile System:** Synchronizes information directly from uploaded CVs to personal profiles.
*   **AI CV Analyzer:** Provides deep insights into strengths, weaknesses, and industry suitability.
*   **Job Recommendation:** Suggests jobs based on skill sets, experience, and geographical location.
*   **Application Tracking:** Real-time tracking of application status transition (from Pending to Hired).
*   **Mock Interview:** Interactive interview practice with AI-generated questions specific to your CV.

### 6.2 For Employers
*   **Company Branding:** Customizable company pages to enhance employer branding.
*   **Integrated ATS (Applicant Tracking System):** A professional recruitment pipeline with customizable stages.
*   **AI Auto-Screener:** Automates candidate prioritization or rejection based on precise hiring criteria.
*   **Management Dashboard:** Comprehensive statistics on job performance, application volume, and costs.
*   **Communication Hub:** Direct candidate communication and automated email workflows.

---

## 7. Environment Variables

The system uses the `.env` file to manage crucial configurations. Key variables include:

| Variable                 | Description                              | Example                         |
|--------------------------|------------------------------------------|---------------------------------|
| `USER_SERVICE_PORT`      | Port for the User Service                | `8081`                          |
| `NOTI_SERVICE_PORT`      | Port for the Notification Service        | `8084`                          |
| `JWT_SECRET_KEY`         | Secret key for signing JWTs              | `your_secret_string`            |
| `MONGO_DB_NAME`          | Name of the MongoDB database             | `smartcv_db`                    |
| `REDIS_HOST`             | Redis server address                     | `localhost`                     |
| `SMTP_USER`              | Email address for sending notifications  | `noreply.smartcv@gmail.com`     |
| `SMTP_PASSWORD`          | App Password for the SMTP email          | `abcd efgh ijkl mnop`           |
| `FCM_PROJECT_ID`         | Firebase Project ID for push notifs      | `smartcv-push-123`              |

---

## 8. Services and Ports Mapping

| Service              | Port | Language | Database/Broker |
|----------------------|------|----------|-----------------|
| **API Gateway**      | 8080 | Java     | -               |
| **User Service**     | 8081 | Java     | MongoDB, Redis  |
| **Job Service**      | 8082 | Java     | MongoDB         |
| **Application Svc**  | 8083 | Java     | MongoDB, S3     |
| **Notification Svc** | 8084 | Golang   | PostgreSQL      |
| **AI Specialist**    | 8085 | Java     | Llama 3 API     |

---

## 9. Detailed Documentation
For deeper dives into specific components, please refer to the `docs/` directory:
-   [System Analysis](docs/VN/5_SYSTEM_ANALYSIS.md)
-   [Database Schema](docs/VN/8_DATABASE_SCHEMA.md)
-   [Project Roadmap](docs/VN/9_PROJECT_ROADMAP.md)

---

## 10. Contributing
We welcome all contributions to improve SmartCV. If you have any ideas or find a bug, please create an Issue or submit a Pull Request.

**Author:** Phamlucchuong
**Version:** 1.0.0
**Last Updated:** May 3rd, 2026

---
*This project is part of a Graduation Thesis for University.*
