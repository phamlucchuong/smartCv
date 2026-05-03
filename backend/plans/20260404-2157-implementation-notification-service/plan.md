# Kế hoạch triển khai Notification Service

## Context snapshot

Repo: `/media/lucchuong/SSD1/DOANTOTNGHIEP/backend`

### Hiện trạng (Notification Service)
- **Ngôn ngữ**: Go
- **Cấu trúc**: Đã có khung layout (`cmd/server`, `internal/...`)
- **Phụ thuộc**:
    - **Gorm**: Đã cầu hình kết nối DB (PostgreSQL/MySQL tùy config URL).
    - **Redis**: Đã cấu hình kết nối, dùng cho caching/TTL.
- **Tình trạng**:
    - `main.go` đã khởi tạo server, DB, Redis nhưng logic nghiệp vụ (`email-sender`, `sms-sender`) chưa được triển khai (file rỗng).
    - Chưa có logic tạo và quản lý OTP.

## Mô tả công việc
Triển khai Notification Service trở thành một dịch vụ hoàn chỉnh để hỗ trợ xác thực và thông báo cho người dùng. Công việc bao gồm xây dựng hệ thống tạo mã OTP, tích hợp các nhà cung cấp dịch vụ gửi Email và SMS (Twilio).

## Goal của plans
1. Hoàn thiện dịch vụ Notification có khả năng chạy độc lập.
2. Cung cấp API để `user-service` có thể yêu cầu gửi OTP.
3. Hỗ trợ gửi OTP qua 2 kênh: Email và SMS (Twilio).
4. Đảm bảo mã OTP có thời hạn (TTL) và được lưu trữ an toàn trong Redis.

---

## Chi tiết các Phase

### Phase 1: Hoàn thiện khung REST API và cấu trúc Service
- **File**: `phase-1-api-structure.md`
- **Mục tiêu**: Đám bảo Server có thể tiếp nhận request và routing chính xác.
- **Nội dung**:
    - Định nghĩa các Route: `POST /api/v1/notifications/otp/send`, `POST /api/v1/notifications/otp/verify`.
    - Triển khai `Handler` và `Service` cơ bản cho Email và SMS.
    - Cấu hình lại `internal/server/routes.go` để đăng ký các service này.

### Phase 2: Triển khai Logic OTP (Generation & Validation)
- **File**: `phase-2-otp-logic.md`
- **Mục tiêu**: Tạo mã OTP ngẫu nhiên và quản lý vòng đời của mã.
- **Nội dung**:
    - Build `otp-service` (hoặc tích hợp vào notification service) để tạo mã 6 chữ số.
    - Sử dụng Redis để lưu trữ mã OTP theo key (ví dụ: `otp:email:user@example.com`) với thời gian hết hạn (ví dụ: 5 phút).
    - Triển khai logic kiểm tra mã OTP khi người dùng submit.

### Phase 3: Tích hợp Email Sender
- **File**: `phase-3-email-integration.md`
- **Mục tiêu**: Gửi được email thật đến người dùng.
- **Nội dung**:
    - Triển khai `internal/platform/email` sử dụng thư viện SMTP hoặc SDK (như SendGrid/Mailgun/Mailtrap).
    - Viết logic trong `internal/email-sender/service.go` để format template email chứa mã OTP.
    - Xử lý lỗi khi gửi email không thành công.

### Phase 4: Tích hợp SMS Sender (Twilio)
- **File**: `phase-4-sms-twilio-integration.md`
- **Mục tiêu**: Gửi được tin nhắn SMS chứa OTP thông qua Twilio.
- **Nội dung**:
    - Cài đặt Twilio SDK cho Go.
    - Triển khai `internal/sms-sender/service.go` để gọi API của Twilio.
    - Cấu hình credentials (Account SID, Auth Token, From Number) trong file `.env`.

### Phase 5: Testing và Kết nối hệ thống
- **File**: `phase-5-testing-and-integration.md`
- **Mục tiêu**: Đảm bảo toàn bộ luồng hoạt động trơn tru.
- **Nội dung**:
    - Viết Unit Test cho logic tạo/xác thực OTP.
    - Test tích hợp gửi Email/SMS thực tế (Sandbox mode).
    - (Tùy chọn) Chỉnh sửa `user-service` để gọi sang `notification-service` khi cần gửi OTP.

## Thứ tự thực hiện đề xuất
1. **Phase 1 & 2**: Xây dựng nền tảng và logic mã OTP trước.
2. **Phase 3**: Triển khai Email vì dễ test và debug hơn.
3. **Phase 4**: Triển khai SMS Twilio.
4. **Phase 5**: Kiểm thử tổng thể.
