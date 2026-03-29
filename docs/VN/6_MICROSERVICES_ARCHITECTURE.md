# TÀI LIỆU KIẾN TRÚC MICROSERVICES & TECH STACK

## 1. Lựa Chọn Nền Tảng (Tech Stack)

### 1.1 Frontend Giao Diện (Ứng viên & Nhà tuyển dụng)
* **Framework Code:** `React 19`, `Vite` tăng tốc độ build tối đa, dùng ngôn ngữ `TypeScript` để typed object giao tiếp an toàn với API microservices.
* **Component / Style:** `TailwindCSS 4`, `Shadcn UI` cho các khối components dễ sử dụng, giao diện thẩm mỹ cao, phù hợp cho Web ATS System.
* **State & Query Management:** 
  * `Zustand` (Fast, nhẹ) quản lý global state (VD: Global Auth Token, Trạng thái Loading của App).
  * `TanStack Query` gọi Data API, auto Caching, auto Refetching, kết hợp công cụ sinh code client `Orval`. Orval sinh các Axios calls và TanStack Query Hooks tự động từ Swagger/OpenAPI file, giảm 80% time code model JSON client.

### 1.2 Nhóm Backend Services (Java Spring Universe)
Java là "Vua" của Microservices cấp doanh nghiệp.
* **Spring Boot 3:** Bản gốc để boot microservices, dùng Java 17/21.
* **Spring Cloud & Gateway:** Spring Cloud cho service discovery (Eureka nếu cần), Config Server. Spring Cloud API Gateway làm bộ lọc Front Controller định tuyến Route (`/api/users/** -> UserService`).
* **Spring Security:** Authentication OAuth2, JWT Resource Server ở tầng Gateway hoặc phân lớp các Services.
* **Spring Data MongoDB:** Thay thế JPA truy vấn Mongo Collections, cấu trúc Document dựa trên `@Document`.
* **Database & Cache:** `MongoDB` là main persistance data. Mọi config, API Rate Limit, Caching sessions dùng `Redis`.
* **Message Broker:** `RabbitMQ` xử lý hàng chờ. Quản lý việc gửi mail thông qua queue để các node gửi asynq.
* **AI Core:** Gọi Spring AI để chuẩn hóa request prompt với thư viện `Llama 3 API`.

### 1.3 Hạ Tầng Golang Notification Service
Theo yêu cầu hệ thống có hiệu suất cao nhất để không bỏ lỡ một thông báo WebSocket (realtime) hoặc Email nào, một Node riêng biệt viết bằng **Golang** được sinh ra, chỉ đóng vai trò Consumer của RabbitMQ.
* Dùng `Echo V5` làm Web/Rest handler nếu cần open API. `GORM` kết nối DB nội bộ nhỏ của Notification log nếu cần.
* Ngôn ngữ Golang mạnh vô địch ở concurrency (Go Routines) giúp nó catch và broadcast hàng chục ngàn socket notification tới web applications nhẹ tựa lông hồng.
* Kết nối module SMTP Email và Twilio SDK SMS (nếu cần mã ngoài OTP email).

## 2. Các Microservices Được Cô Lập

Theo Diagram chuẩn của Hệ thống, có các Ports và Services độc lập:

1. **User Service (Port 8081):**
    * Quản lý CRUD thông tin End-user (Candidate, Company).
    * Kết nối: MongoDB (Users logic). Spring Security + JWT Handler cho Auth Signin/Signup.

2. **Job Service (Port 8082):**
    * Quản lý Master Data về ngành nghề (Kế toán, IT...), list Jobs của doanh nghiệp đang tuyển.
    * Kết nối: MongoDB (Job lưu trữ). Spring Cache (có thể Redis Cache) cho list category. Kết nối `Elasticsearch Search Engine` chuyên môn riêng cho việc Full-text keyword search "Java React Junior" trong một đống văn bản dài của phần Job Description với tốc độ cực kì nhanh thay vì quét Regex MongoDB.

3. **Application & CV Service (Port 8083):**
    * Nơi Ứng viên apply form.
    * Kết nối: AWS S3 SDK (File Upload Data) chứa PDF CV và HTTP Client, RabbitMQ.

4. **Notification Service (Golang - Port 8084):**
    * Kết hợp Spring WebSocket/Golang WebSocket cho real-time push, Spring/Golang Mail Sender, tích hợp RabbitMQ để nghe tin và Gửi.

5. **AI CVReview & Recommender Service (Port 8085):**
    * Quản lý toàn bộ core logic Prompts AI. Download File từ S3, trích xuất text, gọi LLM.

## 3. Deployment Topology & CI/CD
Tất cả chạy cô lập qua mạng mạng **Bridge Network của Docker**.
* Mỗi dịch vụ (kể cả FE) đều build qua `Dockerfile` được định nghĩa trước.
* Deploy tổng thông qua file `docker-compose.yml` định nghĩa biến môi trường, networks và volumes (MongoDB Volume, Redis Volume) tại `AWS EC2 Instance`.
* **CI/CD:** Sử dụng `GitHub Actions` bắt Trigger gõ mã lệnh Push `git commit`. 
  * Action chạy test (JUnit/Testify Golang). Đạt coverage.
  * Đẩy Docker image lên kho (Docker Hub/ AWS Elastic Container Registry - ECR).
  * Chạy SSH script tự động truy cập EC2 pull image về và tái tạo container, Down time ~ tính bằng giây. Hỗ trợ hệ thống đạt điểm tuyệt đối cho đồ án kiến trúc đám mây.

---
*Phiên bản: 1.0 - Ngày cập nhật: 2026-03*
