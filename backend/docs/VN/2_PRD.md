# TÀI LIỆU YÊU CẦU SẢN PHẨM (PRD) - DỰ ÁN SMARTCV

## 1. Mở đầu & Phạm vi sản phẩm
**SmartCV** không chỉ là một Job Board (bảng tin việc làm) thông thường mà là một công cụ AI-driven (tích hợp Llama 3 qua Spring AI) giúp tối ưu hoá phễu tuyển dụng ở cả 2 chiều: Cung (Ứng viên) và Cầu (Doanh nghiệp). PRD này phân tách chi tiết các modules tính năng.

## 2. Tính năng ứng dụng (Feature Specifications)

### 2.1. Phân hệ Ứng viên (Candidate Features)
*   **User Authentication:**
    *   Đăng ký / Đăng nhập (Email, thông qua hệ thống OTP gửi qua NotifyService Golang). JWT cho phiên đăng nhập.
*   **Quản trị Hồ sơ (Profile & CV):**
    *   Tải lên tối đa 10 CV (Lưu trữ bằng AWS S3).
    *   Parse nội dung CV từ tệp PDF/Docx để chuyển đổi thành text phục vụ search và AI.
*   **AI CV Evaluator & Skill Match (Tính năng lõi):**
    *   Khi ứng viên chuẩn bị Nộp đơn (Apply) vào 1 tin tuyển dụng (Job Post).
    *   Hệ thống gọi API phân tích đối chiếu giữa thư mục text của CV và text của Job Post.
    *   Trả về *Matching Score* (Từ 0 đến 100%).
    *   *Constructive Feedback:* List thiếu sót về mặt Kỹ năng (VD: JD cần SpringBoot nhưng ứng viên chỉ ghi Java). Hướng dẫn bổ sung chứng chỉ liên quan.
*   **Job Discovery & Recommendation:**
    *   Tìm kiếm việc làm fulltext search kết hợp bộ lọc (Filter) (dùng Elasticsearch cho JobService).
    *   *AI Recommender:* Nếu ứng viên rớt bộ lọc tự động ở một job, Recommender sẽ trả về danh mục 5 job khác phù hợp hơn với họ.
*   **Assessment (Khảo thí):**
    *   Thực hiện các bài test trắc nghiệm IQ/EQ và Chuyên ngành có tính giờ do nhà tuyển dụng cài đặt, trả kết quả tức thì.

### 2.2. Phân hệ Nhà tuyển dụng (Employer Features)
*   **Đăng ký & Chứng thực Doanh nghiệp:** Cần upload giấy phép công ty hoặc email tên miền doanh nghiệp để Admin uỷ quyền.
*   **Employer Job Posting:**
    *   Tạo tin tuyển dụng với title, tags kỹ năng, dải lương, địa điểm và cấu hình "Đề test ứng viên".
*   **Payment & Package Management:**
    *   Mua các gói dịch vụ (Basic, Pro, Premium) để được đăng nhiều job, đẩy tin lên đầu hoặc truy cập kho CV thụ động. Thanh toán thông qua Payment Gateway, log lưu MongoDB multi-document transaction.
*   **AI Auto-Screener (Lọc CV uỷ quyền):**
    *   Rule engine tích hợp AI:
        *   Nộp -> `PENDING_REVIEW`
        *   Tỉ lệ >= 70%: Chuyển status thành `QUALIFIED`. Đẩy thông báo thành công cho ứng viên.
        *   Tỉ lệ 50-69%: Status `UNDER_REVIEW`. HR sẽ nhìn thấy và duyệt thủ công bằng mắt.
        *   Tỉ lệ < 50%: Trạng thái `NOT_QUALIFIED`. Tự động từ chối kèm lý do (skill gap) và gợi ý job khác.
*   **ATS Board (Quản trị luồng tuyển dụng):**
    *   Bảng kéo thả Kanban: Qualified -> Interview Scheduled -> Interviewed -> Offer Sent -> Accepted/Rejected.
*   **Mock Interview Question Generator:**
    *   Với mỗi ứng viên lọt vào vòng Phỏng vấn, sinh ra bộ 5 câu hỏi phỏng vấn gợi ý (VD: dựa theo kinh nghiệm cũ ở CV của ứng viên).

### 2.3. Phân hệ System Admin
*   **User Management:** Khoá/mở khoá người dùng theo ID.
*   **Dashboard Analytics:** Biểu đồ active user, daily job post, conversion rate, billing.
*   **Cấu hình hệ thống:** Tùy biến các tham số như giới hạn kích thước file S3, tham số cache Redis.

## 3. Yêu cầu phi chức năng (Non-Functional Requirements)

1.  **Hiệu năng (Performance):** Search Elasticsearch response time < 200ms. Luồng phân tích AI cho CV có thể tốn 5s-10s, vì vậy phải xử lý theo dạng Asynchronous Message Queue (RabbitMQ) và báo lại bằng Websocket/Email.
2.  **Khả năng mở rộng (Scalability):** Dễ dàng scale từng port độc lập theo mô hình Microservices bằng Docker.
3.  **Bảo mật hệ thống (Security):** Mật khẩu phải mã hoá. JWT Token không lưu localstorage mà phải có cơ chế Refresh/Access token chuẩn bảo mật. API giao tiếp nội bộ giữa các microservices cần internal token hoặc chặn port bên ngoài.
4.  **Sự toàn vẹn dữ liệu (Data Integrity):** Với việc dùng MongoDB cho cả Payment, cấu hình replica sets bắt buộc để cho bật Sessions/Transactions.

---
*Phiên bản: 1.0 - Ngày tạo: 2026-03*
