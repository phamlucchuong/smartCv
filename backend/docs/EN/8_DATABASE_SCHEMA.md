# SMARTCV DATABASE SCHEMA
The dataset utilizes **MongoDB** (NoSQL) structurally organized via Documents reinforced by internal Schema Validations using `Spring Data MongoDB`.
Redis pads the Cache negating complex schemas (Strictly Key-Value pairs like `otp_{email}` mapping alongside search returns via `job_cache_{filter_hash}`).

Adhering to microservice demarcations, each service claims sole ownership over exclusive Collections within a unified Database Cluster.
`Database Name:` **smartcv_db**

## Service 1: User Service Collections (ID Admin)

### Collections: `users`
**Description:** Manages logins and Role-Based Access Controls.
```json
{
  "_id": "ObjectId",
  "email": "user@gmail.com",
  "password_hash": "bcrypt_hash_string",
  "name": "Nguyen Van A",
  "role": "CANDIDATE", // Roles: EMPLOYER, ADMIN
  "is_verified": true, // Email verified
  "created_at": "ISODate",
  "updated_at": "ISODate"
}
```

### Collections: `employers` (Extended Company Profile)
**Description:** Splintered profile dedicated to Companies, bridging 1-1 with `users` via userId.
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId(users)",  // Foreign Reference
  "company_name": "FPT Corporation",
  "tax_code": "0123456789",
  "logo_url": "s3://bucket/fpt.png",
  "status": "APPROVED", // PENDING, APPROVED, REJECTED
  "quota_job_post": 50,  // Crucial posting limits mandated by Payment packages
  "quota_cv_views": 100
}
```

### Collections: `candidates` (Extended Profile)
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId(users)",
  "skills": ["Java", "Spring", "React"], 
  "years_of_experience": 2, // Eases search filter queries
  "cv_list": [
     { "cv_id": "c1", "file_name": "NguyenVanA_Java.pdf", "file_url": "s3://...", "is_default": true, "raw_text_parsed": "Raw text passed from PDF..." }
  ]
}
```

## Service 2: Job Service Collections

### Collections: `jobs`
**Description:** The actual recruitment postings erected by Employers.
```json
{
  "_id": "ObjectId",
  "employer_id": "ObjectId(employers)", // Owning Company
  "title": "Senior Backend Developer",
  "description": "HTML/Text intensive job description", // Indexed for Elasticsearch text search
  "requirements": ["Java 17", "MongoDB", "Spring Boot"], // Arrayed for exact skill matching
  "salary_range": { "min": 1000, "max": 2000, "currency": "USD" },
  "location": "Ho Chi Minh City",
  "status": "OPEN", // OPEN, CLOSED, EXPIRED
  "created_at": "ISODate",
  "expired_at": "ISODate" // Auto-expired via Job Service cron
}
```
**Elasticsearch Indexing:** This Collection syncs map data through Logstash funnelling into Elasticsearch, building up Full-text structuring for ultra-fast Job Searches.

## Service 3: Application & AI Service Collections

### Collections: `applications`
**Description:** Every application submission initiates a row here. The heartbeat of the Candidate Track (ATS).
```json
{
  "_id": "ObjectId",
  "candidate_user_id": "ObjectId(users)",
  "job_id": "ObjectId(jobs)",
  "used_cv_url": "s3://...",
  "status": "PENDING_REVIEW", // PENDING_REVIEW, QUALIFIED, UNDER_REVIEW, NOT_QUALIFIED, INTERVIEW_SCHEDULED, OFFER_SENT, REJECTED
  "applied_at": "ISODate",

  // Embedded Array compiling Llama 3 AI evaluations
  "ai_analysis": {
      "match_score": 85,
      "matched_skills": ["Java", "Spring Boot"],
      "missing_skills": ["MongoDB transaction"],
      "advice": "Recommend securing AWS NoSQL certification",
      "mock_questions_generated": [
         "Describe architecture deployment on EC2 for SpringBoot?" // Auto-generated
      ]
  }
}
```

## Service 4: Payment Service Collections (ACID Multi-Document Transact)

### Collections: `transactions_log`
**Description:** Chronicles cash flows/package purchases via VNPay, managed natively utilizing MongoDB Sessions nullifying Data Loss from heavy concurrent hits (Concurrency robustness - ACID Transactions).
```json
{
  "_id": "ObjectId",
  "employer_id": "ObjectId(employers)",
  "package_id": "Pkg_01_Premium",
  "amount_paid": 500000,
  "currency": "VND",
  "payment_gateway": "VNPAY",
  "gateway_transaction_no": "VNP12345678",
  "status": "SUCCESS", // PENDING, SUCCESS, FAILED
  "granted_quota": 50 // Adds +50 views to Quota
}
```

---
*Version: 1.0 - Last Updated: 2026-03*
