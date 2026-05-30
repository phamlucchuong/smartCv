# Phase 4: Tích hợp SMS Sender (Twilio)

## Mục tiêu
Gửi tin nhắn SMS chứa mã OTP đến số điện thoại người dùng thông qua Twilio.

## Công việc cụ thể
1. **Cài đặt và cấu hình Twilio**:
   - Add dependency `github.com/twilio/twilio-go`.
   - Cấu hình `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` trong `.env`.
2. **Triển khai SMS Service**:
   - Viết logic gọi API Twilio Message Resource.
   - Xử lý các lỗi từ Twilio (ví dụ: số điện thoại không hợp lệ, hết số dư).
3. **Format tin nhắn**:
   - Nội dung: "SmartCV: Ma OTP cua ban la {{.OTP}}. Cam on ban!" (Nên dùng không dấu để đảm bảo tương thích tốt nhất).

## Kết quả mong đợi
- Tin nhắn SMS được gửi thành công đến số điện thoại người dùng.
