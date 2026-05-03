# CƠ SỞ DỮ LIỆU SMARTCV (DATABASE SCHEMA)
Bộ dữ liệu sử dụng **MongoDB** (NoSQL) cấu trúc dạng Document với Schema Validation nội bộ từ `Spring Data MongoDB`.
Redis đệm Cache không lưu schema phức tạp (Chỉ dùng Key-Value `otp_{email}` và lưu kết quả search `job_cache_{filter_hash}`).

Do việc chia microservices, mỗi service sở hữu Collection riêng biệt trong cùng Database Cluster.
`Database Name:` **smartcv_db**

## Service 1: User Service Collections (Quản Trị ID)

### Collections: `users`
**Mô tả:** Quản lý đăng nhập và vai trò (Role-Based Control).
```json
{
  "_id": "ObjectId",
  "email": "user@gmail.com",
  "password": "bcrypt_hash_string",
  "name": "Nguyen Van A",
  "role": "CANDIDATE", // Có thể: EMPLOYER, ADMIN
  "is_verified": true, // Xác thực email
  "created_at": "ISODate",
  "updated_at": "ISODate"
}
```

### Collections: `employers` (Profile Mở Rộng Của Công Ty)
**Mô tả:** Profile tách riêng cho Company, liên kết 1-1 với `users` via userId.
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId(users)",  // Foreign Reference
  "company_name": "Tập đoàn FPT",
  "tax_code": "0123456789",
  "logo_url": "s3://bucket/fpt.png",
  "status": "APPROVED", // PENDING, APPROVED, REJECTED
  "quota_job_post": 50,  // Số limit tin đăng cực kỳ quan trọng do Payment quyết định
  "quota_cv_views": 100
}
```

### Collections: `candidates` (Profile Mở Rộng)
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId(users)",
  "skills": ["Java", "Spring", "React"], 
  "years_of_experience": 2, // Đỡ tốn tài nguyên tìm kiếm filter
  "cv_list": [
     { "cv_id": "c1", "file_name": "NguyenVanA_Java.pdf", "file_url": "s3://...", "is_default": true, "raw_text_parsed": "Văn bản parse từ PDF..." }
  ]
}
```

## Service 2: Job Service Collections

### Collections: `jobs`
**Mô tả:** Tin tuyển dụng mà Nhà tuyển dụng tạo.
```json
{
  "_id": "ObjectId",
  "employer_id": "ObjectId(employers)", // Thuộc công ty nào
  "title": "Senior Backend Developer",
  "description": "HTML/Text mô tả kỹ công việc", // Index Search Elasticsearch text này
  "requirements": ["Java 17", "MongoDB", "Spring Boot"], // Hỗ trợ match chính xác bằng array
  "salary_range": { "min": 1000, "max": 2000, "currency": "USD" },
  "location": "Thành phố Hồ Chí Minh",
  "status": "OPEN", // OPEN, CLOSED, EXPIRED
  "created_at": "ISODate",
  "expired_at": "ISODate" // Auto Job Service crontab expired theo time
}
```
**Indexing Elasticsearch:** Collection này được mapping đồng thời qua Logstash để đưa vào Elasticsearch cấu trúc Full-text giúp Search Job cực mạnh.

## Service 3: Application & AI Service Collections

### Collections: `applications`
**Mô tả:** Mỗi một hành động nộp đơn sẽ ghi vào đây. Trái tim của quá trình Candidate Track (ATS).
```json
{
  "_id": "ObjectId",
  "candidate_user_id": "ObjectId(users)",
  "job_id": "ObjectId(jobs)",
  "used_cv_url": "s3://...",
  "status": "PENDING_REVIEW", // PENDING_REVIEW, QUALIFIED, UNDER_REVIEW, NOT_QUALIFIED, INTERVIEW_SCHEDULED, OFFER_SENT, REJECTED
  "applied_at": "ISODate",

  // Mảng dữ liệu Llama 3 AI chấm điểm (AI Result Document Embed)
  "ai_analysis": {
      "match_score": 85,
      "matched_skills": ["Java", "Spring Boot"],
      "missing_skills": ["MongoDB transaction"],
      "advice": "Cần thêm chứng chỉ database NoSQL AWS",
      "mock_questions_generated": [
         "Mô tả cách thức deploy trên EC2 cho SpringBoot?" // Hệ thống sinh sau
      ]
  }
}
```

## Service 4: Payment Service Collections (Giao Dịch ACID Đa Tài Liệu)

### Collections: `transactions_log`
**Mô tả:** Lưu lại dòng tiền nạp/mua package từ VNPay, quản trị bằng Session của MongoDB tránh Data Loss khi đua lệnh đồng thời (Concurrency issue - Giao dịch ACID).
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
  "granted_quota": 50 // Cộng 50 bài cho Quota 
}
```

---
*Phiên bản: 1.0 - Ngày cập nhật: 2026-03*
