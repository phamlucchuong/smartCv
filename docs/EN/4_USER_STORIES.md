# USER STORIES - SMARTCV MVP

**Version:** 1.0
**Scope:** MVP (Minimum Viable Product) for Thesis Defense
**Last Updated:** 2026-03

---

## Epic 1: Basic Account Management
### US-01 | Candidate Signup
**As a** Job Candidate, **I want** to securely register an account using Email and verify via a Notification Service-routed OTP, **so that** my profile information remains protected.
*   **Acceptance Criteria:**
    *   Form includes: Name, Email, Password.
    *   Passwords must be hashed (BCrypt).
    *   Send a 6-digit OTP via email. Cache OTP in Redis with a Time-To-Live (TTL) of 5 minutes.
    *   Upon entering the correct OTP, user status changes to `verified` = true, and redirects to the Dashboard.

### US-02 | Employer Signup
**As an** Employer, **I want** to register my company profile and await Admin approval, **so that** I have legal permission to post job listings.
*   **Acceptance Criteria:**
    *   Provide Company details (Name, Tax ID, Website, S3-uploaded Logo).
    *   Initial account status: `PENDING_APPROVAL`.
    *   Cannot post jobs until Admin transitions status to `ACTIVE`.

---

## Epic 2: Core Flow - AI CV Screening
### US-03 | AI Application Processing (AI Apply)
**As a** Candidate, **I want** the system to use AI to read my CV against the Job Description when I click "Apply", **so that** I know my matching percentage and weaknesses before HR sees it.
*   **Acceptance Criteria:**
    *   Candidate selects an existing PDF CV and clicks Apply.
    *   System changes status to `PENDING_REVIEW` -> Pushes an event to RabbitMQ `cv.review.queue`.
    *   `CVReview Service` calls **Llama 3 API (via Spring AI)** passing the CV Text and Job Text. The strict prompt requests a formatted JSON return (Score, Missing_Skills, Improvement_Tips).
    *   If Score >= 70, status becomes `QUALIFIED` and HR receives a Golang service-triggered Notification.
    *   If Score < 70, status becomes `NOT_QUALIFIED` (rejected if < 50) or `UNDER_REVIEW` (50-69).
    *   Candidate receives an email explaining the % score and improvement tips.

### US-04 | View AI Evaluation Report
**As an** Employer, **I want** to enter a candidate's application details page and see an "AI Summary", **so that** I grasp key skills without manually skimming the entire PDF CV.
*   **Acceptance Criteria:**
    *   On the Candidate Application UI, display an "AI Summary" pane.
    *   The pane contains: "Match Score %", "Matched Skills", "Missing Skills", and "AI Recommendation (e.g., Should Interview / Not Good Fit)".

---

## Epic 3: Testing & Applicant Tracking System (ATS)
### US-05 | Candidate Status Drag & Drop Board (Kanban ATS)
**As an** Employer, **I want** to drag and drop a candidate from the `QUALIFIED` column to `INTERVIEW_SCHEDULED`, **so that** I can visually track the campaign's interview pipeline.
*   **Acceptance Criteria:**
    *   Provides a Board View (Trello-like) employing React DnD or similar libraries.
    *   Dragging across columns triggers a REST API to update the Application Status in MongoDB.
    *   Each drag-and-drop automatically publishes to `notification.email.queue` to fire an email updating the candidate on their new status.

### US-06 | Mock Interview Question Generation
**As an** Employer, **I want** to click an "Interview Suggestions" button so the AI system generates 5 questions based on the applicant's submitted CV, **so that** I have customized questions for the face-to-face interview.
*   **Acceptance Criteria:**
    *   The button sits inside the online CV Modal.
    *   Calls Spring AI Llama 3 Prompt: "Act as an IT interviewer for position X, candidate has experience Y. Pose 5 rigorous questions to verify their skills."
    *   Returns Text to copy/paste or print as PDF for the interview file.

---

## Epic 4: Payment - Purchasing Job Packages
### US-07 | Purchase Package Transaction
**As an** Employer, **I want** to pay to purchase the "30-Day Premium Package (Post 50 Jobs)", **so that** I can garner higher candidate engagement.
*   **Acceptance Criteria:**
    *   Employer buys a Package, redirecting to a Mock payment gateway or VNPAY sandbox.
    *   Upon successful payment, the API receives the IPN Webhook and validates checksums.
    *   **Executes Multi-document Transaction MongoDB** on the Payment Service: Create Transaction -> Insert Invoice Record -> Add Limit Quota to Employer's balance -> Commit Transaction.
    *   Presents a Success notification screen to the Employer.
