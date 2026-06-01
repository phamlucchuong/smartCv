# [feature] Làm cho toàn bộ button/input trong các tab Account (web-candidate) có thể tương tác (mock data)

## Overview

Các trang trong khu vực Account của web-candidate (`/profile`, `/cv`, `/assessments`, `/notifications`, `/settings`, `/applications`, `/wishlists`, `/job-suggestions`) hiện **phần lớn là tĩnh hoặc tương tác dở dang**: nhiều nút không có handler, input không sửa được/không lưu, bộ lọc & ô tìm kiếm không thực sự lọc, và nút upload CV không có `<input type="file">` thật.

Feature này làm cho **mọi button/input trong cả 8 tab có thể tương tác thật**, chỉ dùng **mock data** nhưng đầy đủ hành vi: nhập liệu thật, save/cancel sau khi chỉnh sửa, upload file CV đúng (validate type/size), filter + search hoạt động, và phản hồi người dùng rõ ràng.

### Quyết định đã chốt (qua trao đổi)
- **Phản hồi:** thêm **`sonner`** vào web-candidate + mount `<Toaster>` ở `__root.tsx`; mọi action (save/upload/apply/delete/mark-read...) hiện **toast** (nhất quán admin/recruiter).
- **Lưu trữ:** **persist** thay đổi qua **zustand + localStorage** (đổi tên/avatar/profile/settings/đã-đọc/wishlist... sống qua reload và đồng bộ với header).
- **UX sửa Profile:** **inline edit mode** (bấm "Edit Profile" → field thành input tại chỗ, có Save/Cancel).
- **Độ sâu Profile:** **full CRUD** — thêm/sửa/xóa cả Experience và Education, ngoài Basic Info, Skills, và upload CV.

## Impact scope
- [ ] Backend
- [x] Frontend (`apps/web-candidate`)
- [x] i18n (`packages/i18n`)
- [ ] Database
- [ ] E2E

---

## A. Hạ tầng dùng chung (làm trước)

### A1. Toast (`sonner`)
- Thêm `sonner` vào `apps/web-candidate/package.json` (đồng version với recruiter/admin: `^2.0.7`).
- Mount `<Toaster richColors />` trong `RootComponent` của `apps/web-candidate/src/routes/__root.tsx` (cạnh `<Outlet />`), giống admin `__root.tsx`.
- Dùng `import { toast } from 'sonner'` ở các trang. Toast tiếng theo i18n.

### A2. Store account có persist (zustand)
- Hiện `apps/web-candidate/src/store/useCandidateStore.ts` dùng `create(...)` thường, `user: mockUser` tĩnh, không có action cập nhật.
- **Mở rộng** store này (hoặc tạo store mới `useAccountStore`) **bọc `persist`** (`zustand/middleware`, key vd `smartcv_account`) chứa toàn bộ state account để sống qua reload + đồng bộ header:
  - `user` + `updateUser(partial)` — header (avatar/tên) đọc từ đây nên sửa Profile sẽ phản chiếu ngay.
  - `experiences[]`, `educations[]`, `skills[]` + add/update/remove.
  - `settings`: `{ email, notifications:{...}, privacy:{...} }` + setters.
  - `cvList[]` + `addCV(meta)`, `setDefaultCV(id)`, `removeCV(id)`.
  - `notifications[]` + `markAllRead()`, `markRead(id)`, (tùy chọn) `removeNotification(id)`.
  - `wishlist[]` (hoặc `removedWishlistIds`) + `removeFromWishlist(id)`.
  - `appliedJobIds[]` + `applyToJob(id)` (cho job-suggestions).
- Khởi tạo state mặc định từ mock data hiện đang khai báo trong từng file (di chuyển mock vào store hoặc seed lần đầu).
- **Lưu ý `isAuthenticated`**: giữ cơ chế cũ (`localStorage 'isAuthenticated'`), **không** trộn vào slice persist mới để tránh phá guard `_account.tsx`.

### A3. Helper upload file
- Hàm validate: chấp nhận `application/pdf`, `.doc`, `.docx`; tối đa **5MB**; trả về lỗi rõ ràng (toast) nếu sai type/quá lớn.
- Tạo metadata `{ id, name, type: 'PDF'|'DOC', uploaded: <ngày hôm nay>, status: 'Processing' → 'Parsed', isDefault }` thêm vào `cvList`.
- (Tùy chọn) `URL.createObjectURL(file)` để preview trong phiên.

### A4. Helper filter/search
- Hàm lọc danh sách theo `chip` + `query` (case-insensitive, bỏ dấu nếu khả thi) dùng chung cho applications/wishlists/job-suggestions.

> **Lưu ý component:** `@smart-cv/ui` **không export `Textarea`** → trường Bio dùng `<textarea>` native (style bằng class) hoặc `Input`. Các component có sẵn để dùng: `Button, Input, Label, Select, Switch, Dialog, Card, Badge, Separator`.

---

## B. Yêu cầu chi tiết theo từng tab

### B1. `/profile` (`_account.profile.tsx`) — hiện HOÀN TOÀN TĨNH
- **Edit mode (inline):** nút "Edit Profile" bật chế độ sửa. Basic Info (Full Name, Email, Phone, Location, Title, Bio) → input/textarea controlled. Hiện **Save** (ghi `updateUser`, toast "Đã lưu hồ sơ") + **Cancel** (khôi phục giá trị cũ, thoát edit).
- **Skills:** thêm skill (input + Enter/nút), xóa skill (x trên badge). Persist vào `skills[]`.
- **Work Experience — full CRUD:** thêm mục mới (form: title, company, type, dateRange, location, achievements[]), sửa, xóa từng mục. Persist `experiences[]`.
- **Education — full CRUD:** thêm/sửa/xóa (school, degree, dateRange). Persist `educations[]`.
- **CV upload:** vùng "Browse files" → `<input type="file">` thật (xem A3) + drag&drop; thêm vào `cvList`, toast.
- Số liệu (Applied/Saved/Profile views) có thể giữ tĩnh hoặc đọc từ store (Applied = `appliedJobIds.length`, Saved = `wishlist.length`).

### B2. `/settings` (`_account.settings.tsx`) — PARTIAL
- **Change Password:** 3 input controlled; validate (mật khẩu mới ≥ 8 ký tự, khớp confirm); "Update Password" → toast thành công / lỗi; clear field sau khi thành công.
- **Email:** input controlled (seed từ `settings.email`); "Update Email" → validate định dạng email, lưu store, toast.
- **Notifications / Privacy toggles:** đã chạy local — chuyển sang đọc/ghi store (persist) + toast nhẹ khi đổi (tùy chọn).
- **Delete Account:** thay `window.confirm` bằng `Dialog` xác nhận (`@smart-cv/ui`); xác nhận → `signOut()` + clear store account + điều hướng `/signin` + toast.

### B3. `/cv` (`_account.cv.tsx`) — PARTIAL
- **Upload thật:** nút "Chọn file" mở `<input type="file" accept=".pdf,.doc,.docx">` ẩn; vùng dropzone hỗ trợ drag&drop; validate (A3); thêm vào `cvList` + toast; cập nhật đếm `n/10`.
- **Nút thao tác:** Đặt mặc định (đã có — giữ + toast), Xóa (giữ — toast, chặn xóa CV mặc định như hiện tại), **Xem trước** (mở preview/objectURL hoặc toast "Chưa có bản xem trước"), **Phân tích lại** (giả lập: status → 'Processing' → 'Parsed' sau timeout, toast).
- **(Tùy chọn) Search/filter** danh sách CV nếu cần — không bắt buộc.
- Đọc `cvList` từ store (persist). *Giới hạn:* chỉ persist **metadata** CV, không persist nội dung file (xem Notes).

### B4. `/assessments` (`_account.assessments.tsx`) — luồng làm bài đã chạy
- Giữ luồng làm bài. **Bổ sung filter + search** (theo status: Chưa làm/Đang làm/Đã nộp/Hết hạn + ô tìm theo tên) cho nhất quán yêu cầu "filter & search".
- (Tùy chọn) điểm kết quả phản ánh số câu đúng đã chọn thay vì cố định 85/100.
- Trạng thái đã nộp/điểm có thể persist (tùy chọn).

### B5. `/notifications` (`_account.notifications.tsx`) — hiện TĨNH
- State hóa danh sách (đọc từ store).
- **"Đánh dấu tất cả đã đọc"** → `markAllRead()`, cập nhật badge đếm, toast.
- Bấm vào 1 thông báo → `markRead(id)` (mất dot xanh).
- (Tùy chọn) lọc theo type (job/application/system) + nút xóa từng cái.
- Persist trạng thái đã đọc.

### B6. `/applications` (`_account.applications.tsx`) — chips KHÔNG lọc
- **Chips lọc thật:** map chip → status (`Đang xử lý` → applied+under_review, `Phỏng vấn` → interview, `Từ chối` → rejected, `Tất cả` → hết). 
- **Search thật:** lọc theo title/company theo `query`.
- Số đếm header phản ánh kết quả đã lọc (vd "3 đơn ứng tuyển").
- Empty state khi không có kết quả.
- "Xem chi tiết" giữ Link sang `/jobs/$jobId`.

### B7. `/wishlists` (`_account.wishlists.tsx`) — chips KHÔNG lọc
- **Thêm field `category`** vào mock job (Công nghệ/Thiết kế/Marketing) để chip lọc đúng; `Tất cả` → hết.
- **Search thật** theo title/company.
- Bỏ tym (đã có) → cập nhật store `removeFromWishlist`, toast; đếm header cập nhật; empty state đã có.
- Persist danh sách đã bỏ.

### B8. `/job-suggestions` (`_account.job-suggestions.tsx`) — chips KHÔNG lọc
- **Chips lọc theo skill:** lọc job có `skills` chứa chip (`Tất cả` → hết).
- **Search thật** theo title/company.
- **"Ứng tuyển ngay"** → `applyToJob(id)`, đổi nút thành "Đã ứng tuyển" (disabled), toast; persist `appliedJobIds`.
- Empty state khi rỗng.

---

## C. i18n keys cần thêm (EN + VI)

Bổ sung vào `packages/i18n/src/locales/{en,vi}/common.json` (prefix gợi ý `account_*`), ví dụ:
```
account_save / account_cancel / account_edit_profile
account_saved_toast / account_upload_success / account_upload_invalid_type / account_upload_too_large
account_password_updated / account_password_mismatch / account_email_updated / account_email_invalid
account_marked_all_read / account_applied_toast / account_removed_from_wishlist
account_add_experience / account_add_education / account_add_skill
account_delete_account_confirm / account_no_results
... (đặt tên rõ ràng, đủ cả EN & VI)
```
> Tái sử dụng các key `account_*` đã có cho nhãn. Toast/label mới phải có cả 2 ngôn ngữ.

## Related code
- `apps/web-candidate/src/routes/_account.profile.tsx` — viết lại với edit mode + CRUD + upload.
- `apps/web-candidate/src/routes/_account.settings.tsx` — controlled inputs + validate + Dialog delete.
- `apps/web-candidate/src/routes/_account.cv.tsx` — input file thật + drag&drop + thao tác.
- `apps/web-candidate/src/routes/_account.notifications.tsx` — state hóa + mark read.
- `apps/web-candidate/src/routes/_account.applications.tsx` — filter + search thật.
- `apps/web-candidate/src/routes/_account.wishlists.tsx` — filter + search + category.
- `apps/web-candidate/src/routes/_account.job-suggestions.tsx` — filter + search + apply.
- `apps/web-candidate/src/routes/_account.assessments.tsx` — filter/search (+ tùy chọn chấm điểm).
- `apps/web-candidate/src/store/useCandidateStore.ts` — mở rộng + `persist` + actions.
- `apps/web-candidate/src/routes/__root.tsx` — mount `<Toaster />`; header đọc `user` từ store đã cập nhật.
- `apps/web-candidate/package.json` — thêm `sonner`.
- `packages/i18n/src/locales/{en,vi}/common.json` — keys mới.

## Acceptance criteria
1. **Profile:** bật edit mode, sửa Basic Info → Save cập nhật (header avatar/tên đổi theo), Cancel hoàn tác; thêm/sửa/xóa được Experience, Education, Skills; reload vẫn giữ thay đổi.
2. **Settings:** đổi mật khẩu có validate + toast; đổi email có validate + lưu; toggle notifications/privacy lưu & sống qua reload; Delete Account mở Dialog xác nhận → đăng xuất.
3. **CV:** chọn/drag&drop file PDF/DOC/DOCX hợp lệ → thêm vào danh sách + toast; file sai type/>5MB bị từ chối + toast lỗi; đặt mặc định/xóa/phân tích lại hoạt động.
4. **Notifications:** "Đánh dấu tất cả đã đọc" và bấm từng cái cập nhật trạng thái + badge; reload giữ trạng thái đã đọc.
5. **Applications / Wishlists / Job-suggestions:** chips lọc đúng + ô search lọc đúng (kết hợp được); đếm/empty-state phản ánh kết quả; "Ứng tuyển ngay" đổi trạng thái + persist; bỏ tym persist.
6. Mọi button/input trong 8 tab **không còn** phần tử "chết" (không handler / không lọc / không nhập được).
7. Mọi action có toast phản hồi.
8. `pnpm -F web-candidate lint` không lỗi mới; `tsc --noEmit` sạch.

## Notes
- **Giới hạn upload CV:** localStorage chỉ lưu được **metadata** (tên/size/type/ngày), **không** lưu được nội dung file qua reload → sau reload preview bằng objectURL sẽ mất; chấp nhận được với prototype mock. Nêu rõ trong code.
- `@smart-cv/ui` **không có `Textarea`** → Bio/achievements dùng `<textarea>` native.
- Dùng `Switch` từ `@smart-cv/ui` thay cho toggle tự chế hiện tại ở settings (tùy chọn, để đồng bộ design) — hoặc giữ toggle hiện có.
- Liên quan: issue `20260602_candidate_account_sidebar_layout.md` (đã triển khai sidebar `_account.*`) và turn trước đã thêm 3 trang `/cv`, `/assessments`, `/notifications`. Issue này hoàn thiện tính tương tác cho toàn bộ khu account.
- Phạm vi **chỉ frontend + mock**: không gọi API thật (việc nối `@smart-cv/api` tách issue riêng).

## 2026/06/02: Close issue candidate account tabs interactivity
- **Background**: Candidate account area had many static controls and partial mock interactions across 8 tabs, causing dead buttons/inputs and non-persistent behavior.
- **Rejected options**: Keeping per-page isolated local state (inconsistent cross-tab sync), introducing real API integration (out of scope), and preserving native select filter UI in assessments (less coherent than account design language).
- **Decision**: Implemented persisted account domain state with zustand + localStorage, wired all major controls to real mock interactions, added toast feedback with `sonner`, upgraded profile/settings/cv/notifications/applications/wishlists/job-suggestions/assessments behavior, and refined assessments status filter as a harmonized combobox dropdown.
- **Impact**: Account tabs now support interactive workflows end-to-end with persistence and feedback, header/profile synchronization works, filtering/searching/actions are functional, and `web-candidate` lint/build pass.
