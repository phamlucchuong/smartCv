# LỘ TRÌNH THỰC HIỆN DỰ ÁN SMARTCV (PROJECT ROADMAP)

**Thời gian:** 23/03/2026 – 20/06/2026 (13 Tuần)
**Nhân lực triển khai:** 1 Developer (Fullstack & DevOps)
**Phạm vi (Scope):** Các tính năng MVP (P0) thuộc kiến trúc Microservices có tích hợp AI.

---

## TỔNG QUAN CÁC GIAI ĐOẠN (PHASES)
- **Phase 1: Foundation & Infrastructure (Tuần 1 - 2)** - Thiết lập kiến trúc, hạ tầng và dịch vụ Xác thực cốt lõi.
- **Phase 2: Core Microservices & Business Logic (Tuần 3 - 6)** - Phát triển các APIs xử lý nghiệp vụ chính, ứng dụng hàng đợi RabbitMQ và Tích hợp AI (LLM).
- **Phase 3: Frontend Development (Tuần 7 - 9)** - Xây dựng giao diện cho 2 Portal (Candidate và Employer).
- **Phase 4: Advanced Features & Integration (Tuần 10)** - Tích hợp hệ thống Thanh toán và AI Sinh câu hỏi Phỏng vấn.
- **Phase 5: Deploy, Testing & Documentation (Tuần 11 - 13)** - Đưa toàn bộ 6 rổ containers lên AWS EC2, Fix bug cuối & làm báo cáo Thesis.

---

## CHI TIẾT KẾ HOẠCH THEO TỪNG TUẦN (WEEKLY SPRINT LOG)

### PHASE 1: FOUNDATION & INFRASTRUCTURE

**Tuần 1 (23/03 - 29/03): Thiết lập kiến trúc tổng thể & Môi trường**
- **Hạ tầng:** Cài đặt Docker, viết tệp `docker-compose.yml` local chung cho các dịch vụ nền tảng (MongoDB Replica Set, Redis, RabbitMQ, API Gateway/Nginx).
- **Core Backend:** Khởi tạo Spring Boot Config Server (hoặc cấu hình quản lý tham số cục bộ), thiết lập API Gateway làm Front Controller quản lý định tuyến Route (`/api/users/**`, `/api/jobs/**`).
- **Database:** Xây dựng các mẫu schema JSON, setup database init cho MongoDB. Thiết lập Index ban đầu, cài cắm Elasticsearch.

**Tuần 2 (30/03 - 05/04): Authentication & Notification System**
- **User Service (Java):** Xây dựng luồng Đăng ký/Đăng nhập (Auth flow) bằng JWT qua Spring Security. Tích hợp sinh luồng OTP và cấu hình TTL đẩy vào Redis.
- **Notification Service (Golang):** Dựng khung service riêng bằng Golang (Echo/Gin). Kết nối dịch vụ với RabbitMQ Exchange dưới vai trò Subscriber.
- **Integration Test:** Liên kết luồng dữ liệu 2 dịch vụ (UserService gửi Publish Event chứa mã OTP -> NotifyService hứng Event -> Call API gửi Email bằng SMTP tới hòm thư User).

### PHASE 2: CORE MICROSERVICES & BUSINESS LOGIC

**Tuần 3 (06/04 - 12/04): Job Service & Elasticsearch**
- **Lưu trữ:** Tạo CSDL cho lưu trữ bản ghi Company, Job Category tại MongoDB.
- **Job Service:** Viết các APIs CRUD cho nhà tuyển dụng đăng tin, sửa thông tin ứng tuyển.
- **Tìm kiếm Siêu Tốc:** Thiết lập Elasticsearch chuyên biệt để tìm kiếm (Full-text Keyword Search) cho nội dung ứng tuyển (Description) rất dài. Đồng bộ Logstash hoặc Event ngầm giữa MongoDB <-> Elastic.

**Tuần 4 (13/04 - 19/04): Application & CV Upload Service**
- **Cloud Storage:** Tích hợp `AWS S3 SDK` để upload file PDF CV chuẩn ứng viên (validate check 5MB).
- **Application Service:** Xây dựng API "Apply Job". Lưu document ứng tuyển "Mapping giữa Job và Candidate" vào DB dưới trạng thái `PENDING_REVIEW`.
- **Queuing:** Application Service đóng vai trò Publisher đẩy 1 Object thông báo `[cvUrl, jobId, candidateId]` vào RabbitMQ để hệ thống khác AI nghe ngầm. Trả HTTP 202 sớm cho thiết bị Client.

**Tuần 5 (20/04 - 26/04): AI Evaluation Service (CV Review Core)**
- Khởi tạo **CVReview & Recommender Service**. Dựng Consumer hứng message queue từ Tuần 4.
- **Tải file:** Tự động call AWS S3 tải ngầm CV PDF, Parse trích xuất thành cụm Raw Text.
- **AI Tích hợp:** Sử dụng `Spring AI` gọi sang `Llama 3 API`. Áp dụng Prompt Engineering đóng vai HR để đối chiếu độ phù hợp giữa Nội dung CV vs Nội dung Job Requirement.
- Xử lý Response JSON Parsing để chắt lọc lấy các Keyword còn thiếu + Điểm Match `Score %`.

**Tuần 6 (27/04 - 03/05): Integration Connectors & Event Loop Tuning**
- **End-to-end Background:** Hoàn thiện luồng tuần hoàn tự động: Điểm số từ AI Update ngược về Application Service để đổi status: `Qualified` / `Not_Qualified`. 
- Kích hoạt NotifyService đánh chuông/Gửi Mail để push Notification thành quả cho người dùng.
- Bắt lỗi timeout/retry cho API Llama và Fall-back Data Handling trên RabbitMQ (Dead-letter Queue) đối với những CV bị lỗi do lỗi mạng hoặc độ trễ dài.

### PHASE 3: FRONTEND DEVELOPMENT

**Tuần 7 (04/05 - 10/05): Frontend Ecosystem & Candidate Portal (P.1)**
- Dựng Base React 19 + Vite + ESBuild. Cài framework UI thẩm mỹ (TailwindCSS v4, Shadcn Layout).
- Khởi chạy Auto-gen SDK: Dùng công cụ `Orval` sinh tự động cấu trúc Axios Model + `TanStack Query` Hooks từ file OpenAPI/Swagger từ các Microservices để gọt dũa Type Safety.
- Cài UI Navigation Bar, Footer, Luồng Auth và Popup đăng nhập bằng Form OTP. Trang Profile quản lý ứng viên.

**Tuần 8 (11/05 - 17/05): Candidate Portal (P.2 - Core Job Search)**
- Cấu hình Landing page hiển thị list danh sách Job nổi bật (Tối ưu call từ Redis Cache).
- Giao diện chi tiết Job: Form Apply CV Drag & Drop Widget bắt mắt.
- **Radar & Progress Widget:** Vẽ UI thanh trạng thái chấm điểm, Box thông số kỹ năng sau khi AI trả về kết quả 3 chiều. Có Loading Skeleton khi AI đang load tính toán ngầm.

**Tuần 9 (18/05 - 24/05): Employer ATS Web App (Kanban System)**
- Trang Dashboard cho Nhà tuyển dụng (Biểu đồ thống kê). Form Đăng tải Job mới (Tích hợp Markdown Editor đẹp mắt).
- **ATS Kanban Board:** Thiết kế riêng rổ lưới Quản trị CV với `dnd-kit`. Các cột kéo thả: Hàng Mới -> Hợp lệ (AI Chấm điểm xanh) -> Phỏng vấn -> Nhận Offer. 
- Side-panel (Pop-out Drawer ngang) tự động Preview PDF file CV khi nhấn đúp vào User Card mà không cần tải file về trình duyệt.

### PHASE 4: ADVANCED FEATURES INTEGRATION

**Tuần 10 (25/05 - 31/05): Payment Engine & AI Mentor (Interview Generator)**
- **Thanh toán Job Packages:** Code UI Bảng giá và API Thanh toán (Sử dụng Mock DB transaction tự động sau 3 giây hoặc Call API Test VNPAY/PayOS).
- Đảm bảo tính nguyên vẹn dữ liệu Thanh toán bằng MongoDB Multi-Document `Transactional` để update Invoices và Balance limit của Employer cùng 1 phiên (+5 slot đăng job).
- **AI Mock Interviewers:** Nút "AI Suggestion" phía UI HR: Trích gọi Spring AI sinh tự động format 3-5 câu hỏi phỏng vấn hóc búa để HR xoáy ứng viên đó theo đúng năng lực hổng của CV.

### PHASE 5: DEPLOY, TESTING & DOCUMENTATION

**Tuần 11 (01/06 - 07/06): System Refactoring & Bug Fixing**
- Rà soát lỗ hổng: Cắm Rate-Limiter chống DDOS/tạo Spam Script ở màng API Gateway. Cấu hình Cors Header hợp quy từ IP Frontend.
- Chỉnh trau chuốt UX/UI trên Responsive Web Mobile.
- Sửa các lỗi vụn vặt về Token hết hạn (Cấu hình luồng Refresh Token mượt tự động).

**Tuần 12 (08/06 - 14/06): Cloud Deployment & CI/CD Actions**
- Chuẩn bị Docker image mọi rổ Microservices gửi lên ECR/DockerHub.
- Viết GitHub Actions bắt Workflow push mã lệnh để Deploy lại Image test.
- Triển khai trên `AWS EC2`. Chạy `docker-compose up -d`. Map tên miền IP tĩnh, cài SSL Let's Encrypt cho Web và API. Test System online Live End-to-end trên môi trường không dây.

**Tuần 13 (15/06 - 20/06): Hoàn Thiện Báo Cáo & Chuẩn Bị Slide Thuyết Trình**
- Đóng băng toàn bộ Server (Code Freeze).
- Tập trung chạy Data giả mẫu đẹp vào Hệ thống DB. Dàn dựng kịch bản Demo theo luồng User Stories đã định.
- Viết cuốn thuyết minh Đồ án (Chạm file Docx): Chụp ảnh luồng UML, Diagram, Code Coverage Report. Chốt slide thuyết trình ấn tượng cho Hội đồng Phản biện.
- **20/06: Kết Thúc Dự Án - Lên Bục.**

---
*Roadmap được tối ưu riêng biệt cho Đội ngũ 1 Người tập trung vào Stack Microservices (Spring/Go) kết hợp Component Web UI hiện đại.*
