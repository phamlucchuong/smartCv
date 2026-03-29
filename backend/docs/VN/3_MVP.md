# TÀI LIỆU MVP (MINIMUM VIABLE PRODUCT) - SMARTCV

Trong giới hạn của một đồ án tốt nghiệp, để tránh sự phình to không kiểm soát, dự án sẽ khoanh vùng các scope thuộc ưu tiên cực cao (P0) là "Must-have" cho thiết kế hệ thống MVP trước khi bảo vệ trước Hội đồng.

## 1. Dành cho Ứng viên
* **Xác thực:** Đăng ký / Đăng nhập bằng Email, SĐT và Mật khẩu. Bắt buộc có OTP.
* **Hồ sơ:** Upload 1 CV định dạng PDF dưới 5MB. Parse ký tự đơn giản sử dụng thư viện PDF sang Text.
* **Tìm việc:** Tìm kiếm từ khóa Elasticsearch trên dữ liệu mô tả và title của Job.
* **Core Apply (Apply Job bằng AI):** Sử dụng Spring AI gọi tới Llama 3 API mô phỏng phân tích và đối chiếu CV Text với Job Text. Sinh ra điểm số (%) và một list gạch đầu dòng các kỹ năng còn thiếu.
* **Xem lịch sử Apply:** Lịch sử kèm trạng thái CV (Chờ xử lý, Vượt qua, Bị từ chối).
* **Nhận thông báo:** Nhận email/realtime message từ Golang Notification Service.

## 2. Dành cho Nhà tuyển dụng
* **Đăng tin:** Cho phép tạo tin tuyển dụng bao gồm Title, Text mô tả, Location, Lương. Đăng tải và gắn label công khai.
* **Quản trị ứng viên tối giản (ATS):** Nhìn thấy danh sách ứng viên nộp vào từng Job. Có hiển thị điểm số Screening do AI chấm từ phía Candidate. Cung cấp chức năng thay đổi Trạng thái ứng viên (Kanban drag-drop tối giản hoặc nút chuyển Status).
* **Thanh toán gói cước cơ bản:** Có thể xử lý giao dịch mua gói VIP (Tích hợp mock payment hoặc cổng thật như VNPAY/PayOS) và lưu hoá đơn vào MongoDB Multi-doc transaction.
* **Gợi ý câu hỏi phỏng vấn:** Tích hợp nút "AI Assist" trên trang chi tiết ứng viên để tự động Gen ra 3-5 câu hỏi phỏng vấn.

## 3. Dành cho Hệ thống / Backend
* **Kiến trúc:** Áp dụng đủ các Microservices theo thiết kế (AppService, UserService, JobService, CVReview, Notification bằng Golang, API Gateway). 
* **Worker & Queue:** Gửi mail / sinh đánh giá CV thông qua RabbitMQ (Bắt buộc).
* **Deploy:** Chạy được qua Docker-compose với tất cả các containers trên EC2.

## 4. Các tính năng Đưa vào Giai đoạn sau (Post-MVP hoặc Nice-to-have)
Nhóm tính năng dưới đây mang lại điểm cao nhưng sẽ cắt giảm nếu thời gian trễ độ (Deadline):
* Hệ thống Khảo thí (Làm bài Test trắc nghiệm trước phỏng vấn).
* Recommend hệ thống CV Job phù hợp cho Ứng viên nếu họ rớt AI auto-screener (Job Alternative Suggester).
* Đăng nhập via X/Google/Facebook OAuth2 (Khá phức tạp nếu nhiều service bảo mật).
* Chỉnh sửa sinh nhật, avatar siêu chi tiết của doanh nghiệp.

---
*Phiên bản: 1.0 - Ngày tạo: 2026-03*
