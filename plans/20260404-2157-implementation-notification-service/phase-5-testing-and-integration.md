# Phase 5: Testing và Kết nối hệ thống

## Mục tiêu
Đảm bảo tính ổn định và khả năng tích hợp của Notification Service.

## Công việc cụ thể
1. **Unit Testing**:
   - Test OTP generation (đúng độ dài, ngẫu nhiên).
   - Test verify logic (hết hạn, sai mã).
2. **Integration Testing**:
   - Chạy với Redis thật và SMTP Sandbox (như Mailtrap).
3. **Tài liệu hóa API**:
   - Cập nhật file README hoặc Postman collection.
4. **Kết nối với User Service**:
   - (Mô tả) `user-service` gọi `notification-service` qua REST API trong luồng Register/Forgot Password.

## Kết quả mong đợi
- Hệ thống hoạt động đồng bộ.
- Tỷ lệ gửi thành công > 95%.
