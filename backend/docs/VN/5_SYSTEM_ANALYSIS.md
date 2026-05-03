# TÀI LIỆU PHÂN TÍCH HỆ THỐNG - SMARTCV

Tài liệu này trình bày các phân tích chuyên sâu về luồng hoạt động (System Workflows) giữa các thực thể và microservices theo kiến trúc hệ thống đã được đề xuất.

## 1. Luồng Xác thực & Phân quyền (Auth & Registration Flow)
Hệ thống kết hợp Spring Security OAuth2 (cho đăng nhập MXH - nếu có) và luồng JWT truyền thống qua API Gateway.
* **Component tham gia:** Nginx/React Client, API Gateway, User Service, Notification Service (Golang), Redis, MongoDB.
* **Các bước (Steps):**
  1. Người dùng `POST /api/auth/register` qua Gateway, forward tới User Service.
  2. UserService chặn request, kiểm tra Email duplication trong MongoDB. Khớp lệ `BCrypt` hash mật khẩu, tạo user instance với `verified=false`.
  3. UserService sinh một chuỗi OTP 6 số, gán vào **Redis Cache** theo `key=otp_{email}` với thời gian rảnh rỗi (TTL) 5 phút. `UserService` quăng một message qua **RabbitMQ** `notification.exchange`.
  4. Hệ thống **Golang Notification Service** đóng vai trò Subscriber, catch lấy event có mã OTP, kết nối `Spring Mail` hoặc Golang `net/smtp` chuẩn để gửi email tự động tới ứng viên.
  5. Người dùng gọi `POST /api/auth/verify-otp` kèm mã vào gateway. `UserService` match với Redis, nếu Valid -> Chuyển `verified=true`. Xóa Redis Key.
  6. Khởi tạo và trả về Access Token + Refresh Token (Lưu RT vào Redis).

## 2. Luồng Lõi (Core Flow) Sàng Lọc Hệ Thống AI (CV Review Process)
Theo mô hình, quá trình Review cực lớn này không làm Synchronous (Đồng bộ) qua HTTP Call vì AI parsing rất chậm (tốn 10 giây). Việc bắt End-user chờ load xoay mòng mòng là sai quy tắc Microservices.
* **Mô hình kiến trúc:** **Event-Driven Architecture (Publisher - Subscriber).**
* **Các bước:**
  1. Ứng viên gọi `POST /api/applications` nộp CV cho mục Job X.
  2. `Application Service` tiếp nhận tệp, dùng `AWS S3 SDK` upload nhị phân Filel lên CLOUD (S3/MinIO), nhận lại URI file.
  3. Insert một Document Application vào MongoDB với **status: PENDING_REVIEW**. Return status HTTP 202 (Accepted) về cho Client, kèm message: "CV của bạn đang được chấm điểm...". 
  4. Client hiển thị thanh Progress theo dõi.
  5. `Application Service` publish một JSON Object `{applicationId, cvUrl, jobId}` vào Message Queue (RabbitMQ).
  6. Tại Node `CVReview Service` (Chạy Consumer asynq): Node này nhận tin nhắn. Nó gọi API S3 download ngầm CV PDF.
  7. Node parse PDF thành Raw Text.
  8. Gọi DB JobService truy xuất Raw Text mô tả công việc của JobID.
  9. Gọi **Llama 3 API** (Spring AI Framework): *Phân tích sự tương đồng của CV này với Job này, cho điểm 0-100.*
  10. Trả về điểm. Tùy điểm mà Publish ngược lại status cho `AppService` cập nhật CSDL (Qualified, Not_Qualified).
  11. `AppService` báo cho `NotifyService` bằng RabbitMQ. NotifyService đẩy ngược **WebSocket Stream** hiển thị trạng thái "AI đã chấm xong, bạn đạt 85%" trực tiếp Realtime trên trình duyệt (hoặc Email).

## 3. Luồng Gợi Ý Nếu Rớt CV (Recommender Process)
Khi Application rớt (`Score < 50%`):
1. System không chỉ ném về Notification Fail, `AppService` gửi luôn tín hiệu vào `Recommender Service`.
2. `Recommender` sẽ truy vấn **Elasticsearch/Redis cached Jobs** phù hợp hơn dựa trên chính bản Tóm tắt Kỹ năng (Key Skills) mà Llama 3 vừa phân tích được ở luồng phía trên.
3. Node Golang Email Service sẽ đóng gói "Thư từ chối từ nhà tuyển dụng kèm Gợi ý 3 công việc thay thế tốt hơn" để xoa dịu ứng viên, tăng Conversion Rate của Cổng thông tin (Job Portal).

## 4. Quản lý Sự Cố & Giao dịch Thanh Toán (Payment ACID Transactions)
Nhà tuyển dụng mua gói tin đăng trên Hệ thống.
* Do MongoDB chạy trên Replica Set nhiều nodes, Spring Data MongoDB hỗ trợ `@Transactional` như SQL.
* Các Collection: `Invoices`, `Employers`, `Packages`.
* Khi có sự kiện IPN Webhook trả về thanh toán thành công từ VNPAY, mở chuỗi:
  1. `Session Transaction Started`.
  2. `Invoice Collection`: Update document `Status` thành `PAID`.
  3. `Employer Collection`: Phép `$inc` (Toán tử Increment) làm tăng số lượng `job_post_quota` (số tin đăng tối đa dư) thêm +5, `cv_view_quota` thêm +50.
  4. Nếu giữa bước 2 và bước 3 mà Node Die, MongoDB Transaction Auto-rollback giúp Doanh nghiệp không bị tính bill ảo, không thâm hụt số dư. System chốt `Session Transaction Committed.`

---
*Phiên bản: 1.0 - Ngày cập nhật: 2026-03*
