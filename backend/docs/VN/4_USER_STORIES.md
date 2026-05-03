# USER STORIES - SMARTCV MVP

**Phiên bản:** 1.0
**Phạm vi:** MVP (Minimum Viable Product) cho Giai đoạn Bảo vệ Đồ án
**Ngày cập nhật:** 2026-03

---

## Epic 1: Quản trị Tài khoản Cơ bản
### US-01 | Đăng ký Ứng viên (Candidate Signup)
**Là** một Ứng viên tìm việc, **tôi muốn** có thể đăng ký tài khoản bằng Email và xác thực OTP định tuyến bởi Notification Service, **để** an toàn bảo vệ thông tin hồ sơ của tôi.
*   **Acceptance Criteria:**
    *   Form gồm: Tên, Email, Password.
    *   Mật khẩu phải được băm (BCrypt).
    *   Gửi một mã OTP 6 số qua email. Cache OTP bằng Redis với TTL (Thời gian sống) là 5 phút.
    *   Sau khi nhập đúng OTP, trạng thái user `verified` = true và chuyển khoản vào màn hình Dashboard.

### US-02 | Đăng ký Doanh nghiệp (Employer Signup)
**Là** Nhà tuyển dụng, **tôi muốn** đăng ký hồ sơ công ty và chờ Admin phê duyệt, **để** tôi có quyền hợp pháp đăng tin tìm người.
*   **Acceptance Criteria:**
    *   Cung cấp thông tin Công ty (Tên, Mã số thuế, Website, Logo tải lên S3).
    *   Trạng thái tài khoản ban đầu: `PENDING_APPROVAL`.
    *   Không được phép đăng tin cho đến khi Admin chuyển thành `ACTIVE`.

---

## Epic 2: Core Flow - Sàng Lọc CV Bằng Trí Tuệ Nhân Tạo
### US-03 | Phân tích CV bằng AI lúc Nộp đơn (AI Apply)
**Là** một Ứng viên, **tôi muốn** khi bấm nút "Apply" vào một công việc, hệ thống sẽ tự dùng AI đọc CV của tôi so với Tin tuyển dụng, **để** cho tôi biết % độ phù hợp và điểm yếu trước khi HR nhìn thấy.
*   **Acceptance Criteria:**
    *   Ứng viên chọn file CV PDF hiện có, bấm Apply.
    *   Hệ thống chuyển status sang `PENDING_REVIEW` -> Đẩy một event vào RabbitMQ `cv.review.queue`.
    *   `CVReview Service` gọi **Llama 3 API (qua Spring AI)** truyền vào Text của CV và Text của Job. Prompt cấu trúc chặt chẽ yêu cầu trả về JSON định dạng (Score, Missing_Skills, Improvement_Tips).
    *   Nếu Score >= 70, status chuyển thành `QUALIFIED` và HR nhận được Notification qua Golang service.
    *   Nếu Score < 70, status sẽ là `NOT_QUALIFIED` (đánh rớt nếu < 50) hoặc `UNDER_REVIEW` (50-69).
    *   Ứng viên nhận được email giải thích % và các Tips.

### US-04 | Đọc Báo cáo AI Đánh giá (View AI Report)
**Là** Nhà tuyển dụng, **tôi muốn** vào trang chi tiết một ứng viên nộp đơn và xem "Bản tóm tắt AI", **để** tôi không phải cất công lướt toàn bộ CV PDF của họ mà vẫn nắm được Key Skills.
*   **Acceptance Criteria:**
    *   Trên giao diện Candidate Application, hiển thị một khung "AI Summary".
    *   Trong khung có: "Match Score %", "Matched Skills", "Missing Skills", và "AI Recommendation (ví dụ: Should Interview / Not Good Fit)".

---

## Epic 3: Khảo thí Điển hình & Quản trị Tuyển dụng (ATS)
### US-05 | Bảng Kéo Thả Trạng thái Ứng viên (Kanban ATS)
**Là** Nhà tuyển dụng, **tôi muốn** kéo thả một ứng viên từ trạng thái `QUALIFIED` sang `INTERVIEW_SCHEDULED`, **để** trực quan hóa quy trình phỏng vấn của chiến dịch.
*   **Acceptance Criteria:**
    *   Có View dạng Board (Trello-like) dùng React DnD hoặc tương tự.
    *   Kéo từ cột này sang cột khác sẽ gọi REST API update trạng thái đơn nộp ứng tuyển (Application Status) vào MongoDB.
    *   Mỗi lần kéo thả, tự động publish `notification.email.queue` để bắn mail trạng thái mới tới candidate.

### US-06 | Sinh Câu Hỏi Phỏng Vấn (Mock Interview Gen)
**Là** Nhà tuyển dụng, **tôi muốn** bấm nút "Gợi ý Phỏng Vấn", hệ thống AI sẽ cho tôi 5 câu hỏi dựa trên CV mà ứng viên này nộp, **để** tôi tiện hỏi trong buổi phỏng vấn trực tiếp.
*   **Acceptance Criteria:**
    *   Nút bấm nằm trên Modal CV trực tuyến.
    *   Gọi Spring AI Llama 3 Prompt: "Đóng vai người phỏng vấn IT cho vị trí X, ứng viên có kinh nghiệm Y. Đặt 5 câu hỏi hóc búa để kiểm chứng".
    *   Trả về Text để copy/paste hoặc in ra PDF ghim vào bộ hồ sơ phỏng vấn.

---

## Epic 4: Thanh toán - Mua Gói Đăng Tin
### US-07 | Giao dịch Mua Gói (Purchase Package)
**Là** Nhà tuyển dụng, **tôi muốn** thanh toán để mua "Gói Premium 30 ngày (Post 50 Jobs)", **để** có lượng tương tác ứng viên cao hơn.
*   **Acceptance Criteria:**
    *   Nhà tuyển dụng mua Package, được chuyển hướng (redirect) tới cổng thanh toán Mock hoặc VNPAY sandbox.
    *   Khi thanh toán thành công, hệ thống API nhận Webhook IPN, kiểm tra checksum.
    *   **Thực thi Multi-document Transaction MongoDB** trên Payment Service: Tạo Transaction -> Insert Invoice Record -> Cộng vào Limit Quota dư của Provider -> Commit Transaction.
    *   Gửi màn hình thông báo Success cho Employer.
