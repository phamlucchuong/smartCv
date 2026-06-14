# TÀI LIỆU YÊU CẦU NGHIỆP VỤ (BRD) - DỰ ÁN SMARTCV

## 1. Tổng quan dự án (Project Overview)
*   **Tên dự án:** Phát triển hệ thống nền tảng kết nối việc làm thông minh và hỗ trợ đánh giá CV dựa trên AI (SmartCV).
*   **Mục đích tài liệu:** Xác định rõ các yêu cầu từ góc độ nghiệp vụ kinh doanh, bối cảnh thực tế và mục tiêu chung của hệ thống để định hướng toàn bộ nền tảng cho đội ngũ phát triển.
*   **Phạm vi:** Xây dựng hệ thống web-based phục vụ 3 nhóm đối tượng: Ứng viên (Candidate) tìm việc, Nhà tuyển dụng (Employer) tìm nhân tài và Quản trị viên (Admin) vận hành hệ thống. Mô hình tương tự TopCV, VietnamWorks, LinkedIn.


## 2. Bối cảnh và Mục tiêu (Business Goals)
*   **Vấn đề cốt lõi (Pain points):**
    *   *Với Ứng viên:* Viết CV nhưng không biết mức độ phù hợp với tin tuyển dụng (Job Description - JD), thường nộp hồ sơ mù quáng và thiếu hướng dẫn để cải thiện bộ kỹ năng.
    *   *Với Nhà tuyển dụng:* Tốn quá nhiều thời gian và chi phí đọc từng CV thủ công để sàng lọc sơ bộ. Thiếu công cụ quản trị vòng đời tuyển dụng (Application Tracking System - ATS) tích hợp sẵn trong cổng việc làm.
*   **Mục tiêu giải pháp (To-Be):**
    *   Xây dựng một nền tảng tuyển dụng áp dụng Trí tuệ nhân tạo (Llama 3 API thông qua Spring AI) để tự động hóa khâu sàng lọc sơ yếu lý lịch, đánh giá tỷ lệ phù hợp (% mapping) và đóng vai trò như một chuyên gia tư vấn (mentor) cho người tìm việc.
*   **Quy mô ước tính ban đầu (Initial Scale):**
    *   1.000 Người dùng đăng ký.
    *   100 Tin tuyển dụng.
    *   1.000 Lượt tải lên CV & 1.000 Lượt AI đánh giá CV.

## 3. Các nhóm người dùng (User Personas)
*   **Ứng viên (Candidate):** Sinh viên mới ra trường hoặc người đi làm có nhu cầu tìm việc. Cần công cụ tạo/tải CV tự động, kiểm tra lỗi và nhận gợi ý chỉnh sửa từ AI để tăng tỷ lệ trúng tuyển.
*   **Nhà tuyển dụng (Employer/HR):** Đại diện các phòng nhân sự của công ty. Có nhu cầu mua gói đăng tin tuyển dụng, nhận CV đã được chấm điểm tự động từ AI và quản lý ứng viên qua bảng Kanban (ATS).
*   **Quản trị viên (System Admin):** Đội ngũ vận hành nền tảng, quản lý giao dịch, duyệt thông tin công ty và xem thống kê tổng luồng hoạt động.

## 4. Yêu cầu nghiệp vụ cấp cao (High-Level Business Requirements)

### Dành cho Ứng viên (Candidate)
*   Đăng ký và xác thực tài khoản an toàn thông qua Email/OTP.
*   Tải lên CV (định dạng PDF/Word) và sử dụng AI để phân tích.
*   Nhận phân tích chi tiết: Tính toán % độ phù hợp (matching score) với JD mong muốn, phát hiện lỗi trình bày, phát hiện các kỹ năng còn thiếu (Skill gap) và gợi ý hướng đi (roadmap).
*   Làm bài kiểm tra đánh giá năng lực (IQ/EQ/Chuyên môn) trước khi phỏng vấn.
*   Hệ thống đưa ra danh sách các công việc phù hợp dựa trên nội dung CV tải lên.

### Dành cho Nhà tuyển dụng (Employer)
*   Quản trị hồ sơ doanh nghiệp (Logo, mô tả, website).
*   Đăng tin tuyển dụng và mua các gói dịch vụ (Packages) để đẩy tin lên Top hoặc tăng lượt hiển thị. Giao dịch thanh toán được xử lý và lưu trữ toàn vẹn.
*   Sử dụng hệ thống tự động (AI Auto-Screener): Tự động đánh rớt CV (< 50% match) hoặc chuyển vào vòng xét duyệt thủ công (50 - 69%) và tự động duyệt chuyển cho HR nếu CV xuất sắc (>= 70%).
*   Quản trị tiến trình tuyển dụng (ATS Board): Kéo thả ứng viên qua các cột như Khởi tạo -> Chờ phỏng vấn -> Đã phỏng vấn -> Đưa ra lời đề nghị (Offer) -> Chấp nhận/Từ chối.
*   Nhận 5 câu hỏi phỏng vấn Mock Interview ngẫu nhiên do AI sinh ra dựa trên chính CV của ứng viên đang xem.

### Dành cho Admin
*   Xem Dashboard thống kê toàn cầu: Số lượng việc làm, số lượt đánh giá AI, doanh thu gói dịch vụ từ Employer.
*   Quản lý tài nguyên, giải quyết khiếu nại và khoá/xoá các Account vi phạm quy chuẩn.

## 5. Ràng buộc Tài chính & Khả thi
*   Doanh thu chính đến từ các gói cước bán cho "Nhà tuyển dụng" (Job Posting Packages / Top CV viewing limits).
*   Giao dịch tài chính (Payment) phải được đảm bảo bằng Transaction (Giao dịch đa tài liệu) trong MongoDB.

---
*Phiên bản: 1.0 - Ngày tạo: 2026-03*
