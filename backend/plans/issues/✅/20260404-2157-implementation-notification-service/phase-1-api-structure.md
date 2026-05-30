# Phase 1: Hoàn thiện khung REST API và cấu trúc Service

## Mục tiêu
Thiết lập các entry point cho Notification Service để các dịch vụ khác có thể tương tác.

## Công việc cụ thể
1. **Định nghĩa Request/Response DTOs**:
   - `SendOTPRequest`: `{ "to": "string", "method": "email|sms" }`
   - `VerifyOTPRequest`: `{ "to": "string", "code": "string" }`
2. **Cấu hình Router (`internal/server/routes.go`)**:
   - Đăng ký các route mới cho OTP.
3. **Triển khai Handler cơ bản**:
   - `internal/email-sender/handler.go`: Tiếp nhận request gửi mail.
   - `internal/sms-sender/handler.go`: Tiếp nhận request gửi sms.
4. **Wiring Dependencies**:
   - Inject DB và Redis vào các service trong `internal/server/server.go`.

## Kết quả mong đợi
- Server Go khởi chạy thành công trên cổng config.
- Gọi API `/api/v1/notifications/otp/send` trả về mã 200 (mặc dù chưa gửi được mail/sms thật).
