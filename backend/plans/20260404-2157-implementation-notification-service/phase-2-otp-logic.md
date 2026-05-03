# Phase 2: Triển khai Logic OTP (Generation & Validation)

## Mục tiêu
Tạo mã OTP ngẫu nhiên, lưu trữ tạm thời và xác thực khi người dùng gửi yêu cầu.

## Công việc cụ thể
1. **Phát triển OTP Generator**:
   - Viết hàm tạo mã 6 chữ số ngẫu nhiên.
   - Đảm bảo tính duy nhất và bảo mật cơ bản.
2. **Tích hợp Redis làm Storage**:
   - Key format: `otp:[method]:[identifier]` (ví dụ: `otp:email:test@gmail.com`).
   - TTL (Time-to-live): Mặc định 5 phút (có thể cấu hình qua `.env`).
3. **Triển khai hàm `VerifyOTP`**:
   - Lấy mã từ Redis dựa trên identifier.
   - So sánh với mã người dùng gửi lên.
   - Xóa mã trong Redis ngay sau khi xác thực thành công (One-time use).

## Kết quả mong đợi
- API `POST /otp/send` lưu được mã vào Redis.
- API `POST /otp/verify` trả về đúng kết quả (Success/Fail) dựa trên dữ liệu trong Redis.
