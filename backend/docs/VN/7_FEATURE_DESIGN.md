# THIẾT KẾ CÁC TÍNH NĂNG (FEATURE DESIGN) - SMARTCV

Tài liệu này đề cập đến các đặc tả và luồng UI/UX cũng như kết nối hệ thống trong việc triển khai các chức năng lõi của SmartCV.

## 1. Feature 1: Tính năng Cốt Lõi AI Bộ Chấm Điểm (AI Screener & Skill Gap)
**Mô tả:** Đây là tính năng trung tâm để người dùng cảm thấy "SmartCV" khác biệt so với các Job portal truyền thống.
### Các thành phần (UI/UX):
*   **Upload Widget:** Vùng kéo thả File CV (hỗ trợ .pdf, .docx). Có thanh progress bar upload hình visual đẹp. Lời khuyên 10MB limit.
*   **Result Modal/Page:** Khi ứng viên Apply xong, trạng thái `PENDING_REVIEW` hiển thị radar chart loading...
*   Sau khi có kết quả:
    *   **Score Badge:** Một vòng tròn % matching với 3 màu (Đỏ < 50, Vàng 50-69, Xanh >70).
    *   **Skill Gap Card:** Box hai cột minh họa. Cột 1: "Những kỹ năng nhà tuyển dụng yêu cầu". Cột 2: "Kinh nghiệm của bạn". Bôi đỏ nếu thiếu.
    *   **Recommender Button:** Nút Kêu gọi Hành động (Call-To-Action) tên là "Tìm Việc Phù Hợp Hơn" (Chỉ hiện nếu Score bị đỏ).
### Kết nối Tech:
*   Màn hình Frontend định kỳ polling (gọi lại API) 3 giây/lần hoặc dùng WebSocket của Golang để lắng nghe message `cv_processed`.
*   Spring AI đóng gói Prompt "Đóng vai chuyên gia tuyển dụng... phân tích... JSON" để gửi Llama 3 API.

## 2. Feature 2: Mô-đun Quản Trị Tuyển Dụng Dạng Kéo Thả (Kanban ATS)
**Mô tả:** Thay vì một danh sách (Table) rất nhàm chán của bảng Admin, Employer có hẳn công cụ quản lý trạng thái từng chiến dịch tuyển dụng.
### Các thành phần (UI/UX):
*   **Board View (Kanban):** Sử dụng các cột đại diện cho luồng Workflow chuẩn: **Qualified** -> **Under Review** -> **Interview Scheduled** -> **Offer Sent** -> **Accepted** (hoặc **Rejected** ở cuối).
*   **Drag and Drop Library:** Dùng thư viện `dnd-kit` hoặc `react-beautiful-dnd` trong React để xử lý việc nhấn giữ, nhấc một thẻ tên Ứng viên thả sang cột mới.
*   **Candidate Card:** Mỗi Card chứa Tên, Avatar ứng viên ngắn, Điểm số AI tự động gắn Badge góc phải.
*   **Action Drawer:** Khi click đúp vào Card ứng viên, một khung Sidebar (Drawer) mở ra ngang màn hình chứa trọn vẹn CV PDF dạng embed và Tab ghi chú (Note) bình luận của HR.
### Kết nối Tech:
*   Cập nhật `Application Status` tức thì dạng OnChange. Gateway bọc endpoint bảo mật bắt buộc Role HR/Employer.
*   Đồng thời kích hoạt `Mail notification queue`.

## 3. Feature 3: Tính Năng Mua Gói Đăng Job (Package Payment)
**Mô tả:** Cổng kiếm tiền của hệ thống đồ án.
### Các thành phần (UI/UX):
*   **Pricing Page (Bảng giá):** Sử dụng `Shadcn UI` layout chia 3 cột (Basic, Pro, Enterprise) bôi khối Highlight phần gói ưu chuộng nằm giữa.
*   **Checkout Logic:** Modal review đơn hàng. Xác nhận Thanh toán bằng QRCode / Test Mock Payment.
*   **Billing Dashboard:** Bảng `TanStack Table` hiển thị Lịch sử giao dịch (Mã đơn hàng, Ngày tháng, Lượng Job Post limit hiện tại, Trạng thái: Completed/Failed).
### Kết nối Tech:
*   Gọi Backend tạo Order_Id. Nếu là Mock Payment thì sau 3s tự Fake API thành công IPN Webhook.
*   Cơ sở dữ liệu MongoDB chạy **Multi-document Transaction API** để chốt số lượng limit Job mà ông HR này vừa mua thêm, không sai sót tài khoản (Concurrency control).

## 4. Feature 4: Generation - Mock Interviews AI (Sinh câu hỏi phỏng vấn)
**Mô tả:** Nhà tuyển dụng bị "bí" ý tưởng hỏi. Hệ thống AI đóng vai Mentor ra đề.
### Các thành phần (UI/UX):
*   Một nút thần thánh (Magic Button) hình ngôi sao sát khung CV của ứng tuyển viên: "AI Suggestion for Interviewing".
*   Khi Click -> Gọi Loading Skeleton đẹp.
*   Hiển thị List Array 5 câu Text sinh ra từ Spring AI.
### Kết nối Tech:
*   Prompt gửi cùng toàn bộ Text Parse từ CV của Ứng viên và Tiêu đề Job.
*   Khung trả lời AI tự động dùng `Marked` parser Markdown render sang HTML chuẩn đẹp trực tiếp màn hình React.

---
*Phiên bản: 1.0 - Ngày cập nhật: 2026-03*
