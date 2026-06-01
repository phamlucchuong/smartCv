# [feature] Sidebar layout cho khu vực Account của web-candidate (đồng bộ design admin/recruiter)

## Overview

Hiện tại web-candidate quản lý 8 trang cá nhân thông qua **combobox account-icon-hover** trên header landing. Các trang này (`/profile`, `/cv`, `/assessments`, `/notifications`, `/settings`, `/applications`, `/wishlists`, `/job-suggestions`) là route **phẳng (top-level)**, đều bọc trong **header + footer toàn cục** ở `__root.tsx`.

Feature này tạo một **sidebar dashboard layout** cho khu vực account của candidate, **dùng đúng layout & design của admin/recruiter** (sidebar collapsible có nhóm nav + header dashboard riêng), với **main content là chính các trang cũ** đang nằm trong combobox.

### Quyết định đã chốt (qua trao đổi)
- **URL strategy:** giữ nguyên URL cũ bằng **pathless layout route** (`_account.tsx` bọc `_account.profile.tsx`...). URL không đổi → **không vỡ** link cũ trong dropdown và mọi nơi khác.
- **Combobox account-icon-hover:** **giữ lại** trên header landing để truy cập nhanh vào khu account từ trang công khai.
- **Sidebar:** **chia nhóm** (giống recruiter) + thêm link **"Về trang chủ"**.
- **Header/footer toàn cục:** xem mục [Quyết định header/footer](#quyết-định-headerfooter) bên dưới.

### Quyết định header/footer
**Phương án chọn: ẩn header + footer công khai trên các trang account, chỉ dùng header của dashboard layout.**

Lý do:
1. **Tránh 2 header chồng nhau.** Pathless layout `_account` vẫn nằm trong `__root.tsx`, nên nếu không ẩn, trang sẽ render đồng thời header landing (cao 80px) **và** header dashboard (cao 64px) + footer dài ở cuối — vừa thừa, vừa rối.
2. **Nhất quán với admin/recruiter.** Cả 2 app kia đều cho khu dashboard một bộ "chrome" riêng (sidebar + header dashboard), không kèm header/footer marketing.
3. **Tập trung tác vụ.** Khu account là không gian làm việc cá nhân; bỏ footer marketing + thanh điều hướng job/resource giúp gọn gàng.

Cơ chế: `__root.tsx` đã có sẵn pattern `hideFooter` (ẩn footer ở `/signin`, `/signup`). Mở rộng thành cờ `isAccountArea` dựa trên danh sách pathname account để **ẩn cả header lẫn footer công khai** khi ở khu account. (Vì pathless route giữ URL `/profile`...`/settings`, việc nhận diện dựa trên danh sách pathname là hợp lý và đơn giản.)

## Expected behavior

- Truy cập `/profile`, `/cv`, `/assessments`, `/notifications`, `/settings`, `/applications`, `/wishlists`, `/job-suggestions`:
  - Hiển thị **sidebar bên trái** (collapsible w-64 ↔ w-16) với các nhóm mục + link "Về trang chủ".
  - **Header dashboard** phía trên content: ô tìm kiếm, toggle ngôn ngữ EN/VI, toggle theme sáng/tối, chuông thông báo, dropdown avatar (tên + đăng xuất).
  - **Không** còn header landing (80px) và footer marketing.
  - Mục sidebar tương ứng trang hiện tại được **highlight active**.
- URL **không đổi** so với hiện tại.
- Trang công khai (`/`, `/jobs/$jobId`, `/about`, `/signin`, `/signup`) **giữ nguyên** header + footer như cũ.
- Combobox account-icon-hover trên header landing **vẫn còn**, bấm vào mục nào điều hướng tới trang đó (giờ hiển thị trong sidebar layout).
- Light/dark mode và EN/VI hoạt động đồng bộ giữa header landing và header dashboard.

## Current behavior

- 8 trang account là route phẳng, bọc trong header landing + footer toàn cục (`__root.tsx`).
- Điều hướng giữa chúng chỉ qua combobox account-icon-hover (hover vào avatar).
- Không có sidebar, không có không gian dashboard riêng.

## Impact scope
- [ ] Backend
- [x] Frontend (`apps/web-candidate`)
- [x] i18n (`packages/i18n`)
- [ ] Database
- [ ] E2E

## Thiết kế chi tiết

### Cấu trúc route (pathless layout)

```
apps/web-candidate/src/routes/
  __root.tsx                    (sửa: ẩn chrome công khai khi ở khu account)
  _account.tsx                  (MỚI: layout route — render CandidateDashboardLayout + <Outlet/>)
  _account.profile.tsx          (đổi tên từ profile.tsx)          → /profile
  _account.cv.tsx               (đổi tên từ cv.tsx)               → /cv
  _account.assessments.tsx      (đổi tên từ assessments.tsx)      → /assessments
  _account.notifications.tsx    (đổi tên từ notifications.tsx)    → /notifications
  _account.settings.tsx         (đổi tên từ settings.tsx)         → /settings
  _account.applications.tsx     (đổi tên từ applications.tsx)     → /applications
  _account.wishlists.tsx        (đổi tên từ wishlists.tsx)        → /wishlists
  _account.job-suggestions.tsx  (đổi tên từ job-suggestions.tsx)  → /job-suggestions
  index.tsx, about.tsx, signin.tsx, signup.tsx, jobs/$jobId.tsx   (GIỮ NGUYÊN, công khai)
```

- `_account` là segment **pathless** (tiền tố `_`) → không tạo segment URL, nên URL các trang con **giữ nguyên** (`/profile`, `/cv`...).
- Khi đổi tên file, plugin TanStack Router sẽ tự cập nhật chuỗi trong `createFileRoute('/_account/profile')` (id mới) và **tự regenerate** `routeTree.gen.ts` khi chạy dev/build. **Không sửa tay** `routeTree.gen.ts`.
- **Lưu ý nội dung trang:** các trang hiện tự bọc container riêng (`max-w-6xl mx-auto px-4 md:px-6 py-8`). Khi nằm trong `<main className="p-6 max-w-[1600px] mx-auto">` của layout sẽ bị **double padding/max-width**. Cần điều chỉnh: bỏ wrapper page-level (max-width/padding ngoài cùng) ở các trang account, để layout `<main>` lo phần khung; hoặc thống nhất một quy ước. Phải rà từng trang khi di chuyển.

### `_account.tsx` — layout route

```tsx
export const Route = createFileRoute('/_account')({
  beforeLoad: () => {
    if (localStorage.getItem('isAuthenticated') !== 'true') {
      throw redirect({ to: '/signin' })
    }
  },
  component: AccountLayoutRoute,
})
```
- Gom logic guard auth vào layout (hiện mỗi trang account tự `beforeLoad` redirect — có thể giữ ở từng trang HOẶC dồn lên layout cho gọn; nếu dồn lên layout thì xóa `beforeLoad` trùng ở các trang con).
- `AccountLayoutRoute` render `<CandidateDashboardLayout nav={...} />`.

### `CandidateDashboardLayout.tsx` (MỚI)

Vị trí đề xuất: `apps/web-candidate/src/components/layouts/CandidateDashboardLayout.tsx`.

Sao chép cấu trúc & class từ `apps/web-recruiter/src/components/layouts/DashboardLayout.tsx` (sidebar collapsible + nhóm nav có thể đóng/mở + header dashboard), **bỏ** phần phụ thuộc `useRecruiterStore`, thay bằng cơ chế theme/lang của candidate (xem mục [Đồng bộ theme/ngôn ngữ](#đồng-bộ-themengôn-ngữ)).

Thành phần:
- **Sidebar**: logo SmartCV (link `/`), nav nhóm, nút thu gọn (collapse). Dùng class theme token: `bg-sidebar`, `text-sidebar-foreground`, `bg-sidebar-accent`, `border-sidebar-border`, active = `bg-primary/10 text-primary border-primary/20`.
- **Header dashboard**: ô search, toggle EN/VI, toggle theme, chuông, dropdown avatar (`account_my_profile` → /profile, `account_sign_out` → signOut + về /signin). Avatar dùng `user.initials`/`user.name` từ `useCandidateStore`.
- **Main**: `<main className="flex-1 p-6 max-w-[1600px] w-full mx-auto"><Outlet /></main>`.

### Nhóm sidebar đề xuất

Link đầu (đứng riêng, không nhóm):
| Mục | i18n key | Route | Icon |
|-----|----------|-------|------|
| Về trang chủ | `candidate_back_to_home` | `/` | `Home` |

Nhóm **Hồ sơ** (`candidate_sidebar_group_profile`):
| Mục | i18n key | Route | Icon |
|-----|----------|-------|------|
| Trang cá nhân | `account_my_profile` | `/profile` | `UserRound` |
| CV của tôi | `account_my_cv` | `/cv` | `FileUp` |

Nhóm **Hoạt động** (`candidate_sidebar_group_activity`):
| Mục | i18n key | Route | Icon |
|-----|----------|-------|------|
| Việc đã ứng tuyển | `account_applied_jobs` | `/applications` | `FileText` |
| Danh sách yêu thích | `account_wishlists` | `/wishlists` | `Heart` |
| Gợi ý việc làm | `account_job_suggestions` | `/job-suggestions` | `Sparkles` |
| Bài kiểm tra | `account_assessments` | `/assessments` | `ClipboardCheck` |

Nhóm **Khác** (`candidate_sidebar_group_other`):
| Mục | i18n key | Route | Icon |
|-----|----------|-------|------|
| Thông báo | `account_notifications` | `/notifications` | `Bell` |
| Cài đặt | `account_settings` | `/settings` | `Settings` |

> Các key `account_*` đã tồn tại trong `common.json` (EN+VI). Chỉ cần thêm key nhóm + "về trang chủ".

### i18n keys cần thêm (EN + VI)

```
candidate_back_to_home          EN: "Back to home"        VI: "Về trang chủ"
candidate_sidebar_group_profile EN: "Profile"             VI: "Hồ sơ"
candidate_sidebar_group_activity EN: "Activity"           VI: "Hoạt động"
candidate_sidebar_group_other   EN: "Other"               VI: "Khác"
candidate_sidebar_collapse      EN: "Collapse"            VI: "Thu gọn"
candidate_search_placeholder    EN: "Search..."           VI: "Tìm kiếm..."
```

## Lưu ý kỹ thuật quan trọng (đã xác minh trong code)

### 1. candidate thiếu hạ tầng mà admin/recruiter có
- **Không có alias `@`** trong `vite.config.ts` (candidate dùng import tương đối). → Hoặc (a) thêm alias `@` vào `vite.config.ts` + `tsconfig` cho đồng bộ admin/recruiter, hoặc (b) dùng import tương đối trong layout mới. **Đề xuất (a)** để copy code recruiter dễ hơn.
- **Không có `cn` util** và thư mục `components/`. → Import `cn` từ **`@smart-cv/ui`** (package này đã export `cn`); tạo mới thư mục `src/components/layouts/`.
- candidate **không có** `clsx`/`tailwind-merge` trong deps — **không cần thêm**, vì dùng `cn` từ `@smart-cv/ui`.

### 2. Thiếu dark-mode sidebar tokens trong candidate `index.css`  ⚠️
- `@smart-cv/ui` globals.css **đã map** utility màu sidebar (`--color-sidebar: var(--sidebar)`...), nên class `bg-sidebar`/`text-sidebar-foreground`/`bg-sidebar-accent`/`border-sidebar-border` **chạy được**.
- `apps/web-candidate/src/index.css` định nghĩa `--sidebar-*` **chỉ trong `:root`** (light), **KHÔNG có trong block `.dark`**. → Ở dark mode sidebar sẽ dùng giá trị sáng (sidebar trắng) → **sai màu**.
- **Cần thêm** vào block `.dark` của `apps/web-candidate/src/index.css` (lấy giá trị từ `apps/web-recruiter/src/index.css`):
  ```css
  --sidebar: oklch(0.14 0.03 265);
  --sidebar-foreground: oklch(0.92 0.01 255);
  --sidebar-primary: oklch(0.55 0.2 263);
  --sidebar-primary-foreground: oklch(0.99 0 0);
  --sidebar-accent: oklch(0.2 0.04 265);
  --sidebar-accent-foreground: oklch(0.9 0.01 255);
  --sidebar-border: oklch(0.25 0.03 265);
  --sidebar-ring: oklch(0.55 0.2 263);
  ```

### 3. Đồng bộ theme/ngôn ngữ
- recruiter `DashboardLayout` lấy theme từ `useRecruiterStore`. candidate **không có** store theme — `__root.tsx` quản theme/lang bằng `useState` + `localStorage` (`smartcv_theme`, `smartcv_lang`) và một `useEffect` toggle `document.documentElement.classList('dark')`.
- Vì header landing (chứa nút toggle hiện tại) bị **ẩn** ở khu account, header dashboard mới phải có nút toggle riêng **ghi cùng nguồn sự thật**, nếu không theme/lang sẽ lệch giữa 2 khu.
- **Đề xuất:** đưa `theme` + `language` vào **`useCandidateStore`** (hoặc store UI mới), refactor `__root.tsx` dùng store đó, rồi `CandidateDashboardLayout` đọc/ghi cùng store. Effect áp dụng `.dark` vẫn nằm ở `RootComponent` (luôn mount, bọc cả khu account) nên theme tiếp tục được áp dụng kể cả khi header landing ẩn.
- Lưu ý đồng bộ key localStorage: hiện `toggleLanguage` ghi `smartcv_lang`, `toggleTheme` ghi `smartcv_theme` — giữ đúng key này.

### 4. Guard auth
- 8 trang account hiện đã tự `beforeLoad` redirect `/signin` nếu chưa đăng nhập. Nếu dồn guard lên `_account.tsx` thì xóa bản trùng ở trang con (tránh lặp).

## Related code

- `apps/web-candidate/src/routes/__root.tsx` — header landing + footer + combobox account-icon-hover + state theme/lang. Sửa: thêm cờ `isAccountArea` để ẩn chrome công khai ở khu account; (đề xuất) chuyển theme/lang sang store.
- `apps/web-candidate/src/routes/{profile,cv,assessments,notifications,settings,applications,wishlists,job-suggestions}.tsx` — đổi tên thành `_account.*`, điều chỉnh container.
- `apps/web-candidate/src/components/layouts/CandidateDashboardLayout.tsx` — MỚI.
- `apps/web-candidate/src/routes/_account.tsx` — MỚI (layout route).
- `apps/web-candidate/src/store/useCandidateStore.ts` — (đề xuất) thêm theme/language.
- `apps/web-candidate/src/index.css` — thêm dark-mode sidebar tokens.
- `apps/web-candidate/vite.config.ts` + `tsconfig*.json` — (đề xuất) thêm alias `@`.
- `packages/i18n/src/locales/{en,vi}/common.json` — thêm key `candidate_sidebar_*`, `candidate_back_to_home`, `candidate_search_placeholder`.
- **Tham chiếu (không sửa):** `apps/web-recruiter/src/components/layouts/DashboardLayout.tsx`, `apps/web-recruiter/src/routes/employer.tsx`.

## Acceptance criteria
1. Vào 8 trang account → thấy sidebar (nhóm Hồ sơ / Hoạt động / Khác + "Về trang chủ") và header dashboard; **không** còn header landing + footer marketing.
2. URL của 8 trang **giữ nguyên** như trước; combobox account-icon-hover trên header landing vẫn điều hướng đúng vào các trang đó.
3. Mục sidebar active đúng theo trang hiện tại; sidebar thu gọn/mở rộng được; nhóm đóng/mở được.
4. Toggle theme & ngôn ngữ ở header dashboard **đồng bộ** với phần còn lại (chuyển sang trang công khai vẫn giữ đúng theme/lang).
5. Dark mode: sidebar đổi màu đúng (đã thêm dark-mode `--sidebar-*`), không bị nền trắng.
6. Trang công khai (`/`, `/jobs/$jobId`, `/about`, `/signin`, `/signup`) **không** bị ảnh hưởng (vẫn header + footer cũ).
7. Chưa đăng nhập mà vào trang account → redirect `/signin`.
8. `pnpm -F web-candidate lint` không phát sinh lỗi mới; `tsc --noEmit` sạch; `routeTree.gen.ts` được plugin regenerate (không sửa tay).

## Notes
- Liên quan: `web-admin-design-plan.md` (kế hoạch admin), và turn trước đã bổ sung 3 trang candidate (`/cv`, `/assessments`, `/notifications`) + 3 mục dropdown tương ứng — chính các trang này nay được đưa vào sidebar.
- Không tách `DashboardLayout` chung vào `@smart-cv/ui` trong issue này (admin/recruiter hiện mỗi app một bản copy); candidate cũng tạo bản copy riêng để nhất quán hiện trạng. Refactor gộp layout dùng chung nên tách issue riêng nếu cần.
- Pathless layout là lựa chọn ít rủi ro nhất vì **không đổi URL** → không phải sửa bất kỳ `<Link>`/redirect nào trỏ tới các trang account.

## 2026/06/02: Close issue candidate account sidebar layout
- **Background**: Candidate account pages were flat routes under public header/footer and lacked a dashboard shell consistent with recruiter/admin.
- **Rejected options**: Kept flat per-page layout (high duplication), migrated to `/account/*` URL prefix (breaking existing links), and kept floating collapse control in scroll content (unstable position when nav grows).
- **Decision**: Implemented pathless `_account` layout with preserved URLs, shared theme/language state via candidate store, hidden public chrome in account area, dark sidebar tokens, fixed/pinned sidebar collapse control, removed back-to-home item per final UX request, globally hid scrollbars, and resolved monorepo lint/build errors.
- **Impact**: Account UX is now dashboard-based and consistent, URL compatibility preserved, lint is clean across workspaces, and monorepo build passes.
