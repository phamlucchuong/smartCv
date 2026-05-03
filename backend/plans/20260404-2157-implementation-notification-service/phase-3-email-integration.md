# Phase 3: Tích hợp Email Sender

## Mục tiêu
Gửi email chứa mã OTP đến địa chỉ email của người dùng.

## Công việc cụ thể
1. **Thiết lập Email Provider (`internal/platform/email`)**:
   - Sử dụng thư viện `net/smtp` hoặc SDK bên thứ 3.
   - Hỗ trợ cấu hình SMTP Server, Port, Username, Password qua biến môi trường.
2. **Xây dựng Email Template**:
   - Tạo template HTML/Plain text đơn giản cho OTP.
   - Nội dung: "Mã xác thực của bạn là: {{.OTP}}. Mã có hiệu lực trong 5 phút."
3. **Triển khai Email Service logic**:
   - Nhận yêu cầu gửi, render template và gọi Provider để gửi mail.
   - Log trạng thái gửi (Thành công/Thất bại).

## Kết quả mong đợi
- Người dùng nhận được email thật chứa đúng mã OTP đã được tạo.
