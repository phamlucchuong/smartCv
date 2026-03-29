# PRODUCT REQUIREMENTS DOCUMENT (PRD) - SMARTCV

## 1. Introduction & Product Scope
**SmartCV** is not just a standard Job Board but an AI-driven tool (integrating Llama 3 via Spring AI) designed to optimize the recruitment funnel from both the Supply (Candidate) and Demand (Enterprise) sides. This PRD breaks down the detailed feature modules.

## 2. Feature Specifications

### 2.1. Candidate Features
*   **User Authentication:**
    *   Sign Up / Sign In (Email, through an OTP system routed via Golang NotifyService). JWT generation for login sessions.
*   **Profile & CV Management:**
    *   Upload up to 10 CVs (Stored using AWS S3).
    *   Parse CV content from PDF/Docx files to convert to text for search indexing and AI analysis.
*   **AI CV Evaluator & Skill Match (Core Feature):**
    *   Triggered when a candidate is about to Apply for a Job Post.
    *   The system calls the AI API to cross-reference the extracted text of the CV against the text of the Job Post.
    *   Returns a *Matching Score* (From 0 to 100%).
    *   *Constructive Feedback:* Lists missing skills (e.g., JD requires SpringBoot but candidate only lists Java). Recommends adding relevant certifications.
*   **Job Discovery & Recommendation:**
    *   Full-text job search combined with filters (using Elasticsearch within JobService).
    *   *AI Recommender:* If a candidate fails the auto-filter for a job, the Recommender will suggest 5 alternative jobs that better match their profile.
*   **Assessment System:**
    *   Take timed multiple-choice tests (IQ/EQ and Technical) configured by the employer, immediately displaying results.

### 2.2. Employer Features
*   **Enterprise Registration & Verification:** Must upload a company license or verify a corporate email domain for Admin authorization.
*   **Employer Job Posting:**
    *   Create job postings with titles, skill tags, salary ranges, locations, and configure the "Candidate Assessment Test".
*   **Payment & Package Management:**
    *   Purchase service packages (Basic, Pro, Premium) to allow multiple job posts, top visibility, or passive CV database access. Payment via Gateway; logs saved via MongoDB multi-document transaction.
*   **AI Auto-Screener (Delegated CV Filtering):**
    *   AI-integrated Rule Engine:
        *   Applied -> `PENDING_REVIEW`
        *   Score >= 70%: Status changes to `QUALIFIED`. Push success notification to the candidate.
        *   Score 50-69%: Status `UNDER_REVIEW`. HR visually reviews and manually approves/rejects.
        *   Score < 50%: Status `NOT_QUALIFIED`. Automatically rejects with reasons (skill gap) and suggests alternative jobs.
*   **ATS Board (Recruitment Pipeline Management):**
    *   Kanban Drag-and-Drop Board: Qualified -> Interview Scheduled -> Interviewed -> Offer Sent -> Accepted/Rejected.
*   **Mock Interview Question Generator:**
    *   For each candidate entering the Interview round, generate a set of 5 suggested interview questions (e.g., based on previous experience listed in the candidate's CV).

### 2.3. System Admin Features
*   **User Management:** Lock/unlock users by ID.
*   **Dashboard Analytics:** Charts covering active users, daily job posts, conversion rates, and billing.
*   **System Configuration:** Customize parameters like S3 file size limits and Redis cache behaviors.

## 3. Non-Functional Requirements (NFR)

1.  **Performance:** Elasticsearch search response time < 200ms. The AI parsing flow may take 5s-10s, so it must be processed asynchronously via Message Queue (RabbitMQ) and user notified via Websocket/Email.
2.  **Scalability:** Easily scale individual ports independently following the Microservices model using Docker.
3.  **System Security:** Passwords must be hashed (BCrypt). JWT Tokens should not be stored in localstorage but managed securely with Refresh/Access token flows. Internal API communication between microservices requires internal tokens or external port blocking.
4.  **Data Integrity:** Given the use of MongoDB for Payments, Replica Sets MUST be configured to enable Sessions/Transactions (ACID compliance).

---
*Version: 1.0 - Date: 2026-03*
