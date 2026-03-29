# SYSTEM ANALYSIS DOCUMENT - SMARTCV

This document presents an in-depth analysis of the System Workflows between entities and microservices based on the proposed system architecture.

## 1. Authentication & Registration Flow
The system adopts Spring Security OAuth2 (for potential social login) alongside a traditional JWT flow through the API Gateway.
* **Participating Components:** Nginx/React Client, API Gateway, User Service, Notification Service (Golang), Redis, MongoDB.
* **Steps:**
  1. User sends `POST /api/auth/register` via the Gateway, forwarding to the User Service.
  2. UserService intercepts the request, checking for Email duplication in MongoDB. It applies a `BCrypt` hash to the password, creating a user instance with `verified=false`.
  3. UserService generates a 6-digit OTP string, caching it in **Redis** under `key=otp_{email}` with a 5-minute Time-To-Live (TTL). `UserService` fires a message down **RabbitMQ** `notification.exchange`.
  4. The **Golang Notification Service** acts as a Subscriber, catches the OTP event, connects to `Spring Mail` or standard Golang `net/smtp` to automatically deliver the email to the candidate.
  5. The user invokes `POST /api/auth/verify-otp` with the code to the gateway. `UserService` matches it via Redis; if Valid -> Switches `verified=true`. Deletes Redis Key.
  6. Initializes and returns Access Token + Refresh Token (Stores RT in Redis).

## 2. Core Flow: AI CV Review Process
Following best practices, this massive Review process isn't performed Synchronously over an HTTP Call since AI parsing is slow (can take 10 seconds). Forcing an End-user to stare at a spinning loader violates Microservices convention.
* **Architectural Model:** **Event-Driven Architecture (Publisher - Subscriber).**
* **Steps:**
  1. Candidate triggers `POST /api/applications` submitting a CV for Job X.
  2. `Application Service` receives the file, employs `AWS S3 SDK` to upload the binary file to the CLOUD (S3/MinIO), and receives the file URI.
  3. Inserts an Application Document into MongoDB with **status: PENDING_REVIEW**. Returns HTTP status 202 (Accepted) to the Client, alongside a message: "Your CV is being evaluated...". 
  4. Client displays a tracking Progress bar.
  5. `Application Service` publishes a JSON Object `{applicationId, cvUrl, jobId}` to the Message Queue (RabbitMQ).
  6. At the `CVReview Service` Node (Running as an async Consumer): The Node receives the message. It calls the S3 API to silently download the CV PDF.
  7. Node parses PDF to Raw Text.
  8. Queries the JobService DB to extract the Raw Job Description Text via JobID.
  9. Calls **Llama 3 API** (Spring AI Framework): *Analyses the matching similarity between this CV and this Job, scoring from 0-100.*
  10. Returns the score. Depending on the score, publishes the status back for `AppService` DB updates (Qualified, Not_Qualified).
  11. `AppService` alerts `NotifyService` via RabbitMQ. NotifyService pushes a **WebSocket Stream** declaring "AI review complete, you achieved 85%" in real-time on the browser (or via Email).

## 3. Alternative Recommendation Process
When an Application fails (`Score < 50%`):
1. The system doesn't only dispatch a Failure Notification; `AppService` fires a signal into the `Recommender Service`.
2. `Recommender` will query **Elasticsearch/Redis cached Jobs** that are better suited based on the Key Skills Summary that Llama 3 just extracted in the prior flow.
3. The Golang Email Service Node packages a "Rejection letter from the employer along with 3 better alternative job suggestions" to console the candidate, boosting the Job Portal's Conversion Rate.

## 4. Payment Incident Management & Transactions (ACID)
The employer purchases posting packages on the System.
* Because MongoDB runs on a Multi-node Replica Set, Spring Data MongoDB supports `@Transactional` just like SQL.
* Collections: `Invoices`, `Employers`, `Packages`.
* Upon the VNPAY successful payment IPN Webhook returning, the sequence opens:
  1. `Session Transaction Started`.
  2. `Invoice Collection`: Updates status document to `PAID`.
  3. `Employer Collection`: `$inc` (Increment operator) increases `job_post_quota` by +5, `cv_view_quota` by +50.
  4. If the Node Dies between steps 2 and 3, MongoDB Transaction Auto-rollback protects the Corporate entity from being falsely billed, mitigating balance deficits. System locks `Session Transaction Committed.`

---
*Version: 1.0 - Last Updated: 2026-03*
