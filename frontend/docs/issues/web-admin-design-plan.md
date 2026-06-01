# Plan: Thiết kế Web Admin — Lấy từ `cv-smart-ai-main`

## Tổng quan

Migrate thiết kế admin từ `cv-smart-ai-main` vào `apps/web-admin` trong monorepo SmartCV-FE, chuyển đổi từ app Vite thuần sang stack chuẩn của monorepo (TanStack Router, TanStack Query, Tailwind v4, `@smart-cv/ui`).

---

## Phase 1 — Setup Infrastructure

### 1.1 Cập nhật `package.json` cho `web-admin`

Thêm các dependencies còn thiếu (hiện tại thiếu `@smart-cv/ui`, TanStack Router, recharts, v.v.):

```diff
dependencies:
  + "@smart-cv/ui": "workspace:*"
  + "@tanstack/react-query": "^5"
  + "@tanstack/react-router": "^1"
  + "lucide-react": "^0.475"
  + "recharts": "^2"
  + "sonner": "^2"
  + "zustand": "^5"
  + "clsx": "^2"
  + "tailwind-merge": "^2"

devDependencies:
  + "@tailwindcss/vite": "^4"
  + "@tanstack/router-plugin": "^1"
  + "tailwindcss": "^4"
```

### 1.2 Cập nhật `vite.config.ts`

Thêm `TanStackRouterVite`, `tailwindcss`, alias `@`:

```ts
plugins: [TanStackRouterVite(), react(), tailwindcss()]
resolve: { alias: { '@': './src' } }
server: { port: 3003 }
```

### 1.3 Tạo file style & root entry

- `src/index.css` — import Tailwind + copy design tokens từ `cv-smart-ai-main/src/styles.css` (màu primary navy, ai purple, semantic colors, font Plus Jakarta Sans)
- `src/main.tsx` — wrap `RouterProvider` + `QueryClientProvider`

### 1.4 Cấu trúc thư mục target

```
apps/web-admin/src/
├── routes/
│   ├── __root.tsx
│   ├── index.tsx              (redirect → /admin)
│   ├── signin.tsx
│   ├── admin.tsx              (layout)
│   ├── admin.index.tsx        (dashboard)
│   ├── admin.users.tsx
│   ├── admin.employer-verification.tsx
│   ├── admin.job-moderation.tsx
│   ├── admin.packages.tsx
│   ├── admin.payments.tsx
│   ├── admin.ai-config.tsx
│   ├── admin.settings.tsx
│   └── admin.audit-logs.tsx
├── components/
│   ├── layouts/
│   │   └── AdminLayout.tsx    (sidebar + header)
│   └── ui-kit/
│       └── StatusBadge.tsx
├── store/
│   └── auth.ts                (Zustand auth store)
├── index.css
└── main.tsx
```

---

## Phase 2 — Core Layout

### 2.1 `AdminLayout.tsx`

Copy và adapt `DashboardLayout.tsx` từ `cv-smart-ai-main`, bỏ role-switcher demo, thay bằng:
- Sidebar collapsible (w-16 / w-64)
- Logo SmartCV + icon Sparkles
- 9 nav items (xem bên dưới)
- Header: search bar, notification bell, user dropdown (Profile, Settings, Đăng xuất)

**Navigation menu:**

| Route | Label | Icon |
|-------|-------|------|
| `/admin` | Tổng quan | `LayoutDashboard` |
| `/admin/users` | Người dùng | `Users` |
| `/admin/employer-verification` | Xác minh NTD | `ShieldCheck` |
| `/admin/job-moderation` | Kiểm duyệt tin | `FileWarning` |
| `/admin/packages` | Gói dịch vụ | `Package` |
| `/admin/payments` | Thanh toán | `CreditCard` |
| `/admin/ai-config` | Cấu hình AI | `Brain` |
| `/admin/settings` | Hệ thống | `Settings` |
| `/admin/audit-logs` | Audit Logs | `ScrollText` |

### 2.2 `StatusBadge.tsx`

Copy nguyên từ `cv-smart-ai-main/src/components/ui-kit/StatusBadge.tsx` — mapping status → tone màu.

---

## Phase 3 — Pages (9 trang)

### 3.1 `admin.index.tsx` — Dashboard Tổng quan

- **6 KPI cards**: Người dùng hoạt động, Ứng viên mới, NTD mới, Tin đăng hôm nay, Doanh thu tháng, Hàng đợi AI
- **2 charts** (recharts): AreaChart tăng trưởng người dùng + LineChart doanh thu
- **2 mini-tables**: NTD chờ duyệt + Giao dịch gần nhất

### 3.2 `admin.users.tsx` — Quản lý người dùng

- Table: Avatar, Tên, Email, Role (Ứng viên/NTD), Trạng thái, Actions
- Actions: Khóa / Mở khóa tài khoản
- `StatusBadge` cho trạng thái (Active / Locked)

### 3.3 `admin.employer-verification.tsx` — Xác minh NTD

- Table: Tên công ty, Người đại diện, Ngày đăng ký, Tài liệu, Trạng thái
- Actions: Duyệt / Từ chối
- Filter: Pending / Verified / Rejected

### 3.4 `admin.job-moderation.tsx` — Kiểm duyệt tin đăng

- Table: Tiêu đề, Công ty, Ngày đăng, Trạng thái
- Actions: Phê duyệt / Từ chối / Ẩn
- Filter theo trạng thái

### 3.5 `admin.packages.tsx` — Gói dịch vụ

- 3 card: Basic / Pro / Premium
- Mỗi card: tên gói, giá, danh sách tính năng, badge "Phổ biến nhất"
- Button chỉnh sửa giá

### 3.6 `admin.payments.tsx` — Thanh toán

- Table: Công ty, Gói, Số tiền, Ngày giao dịch, Trạng thái
- `StatusBadge`: Paid / Pending / Failed / Refunded
- Filter theo tháng

### 3.7 `admin.ai-config.tsx` — Cấu hình AI

- Form fields: Matching threshold (slider 0–100%), AI timeout (ms), Model selection (dropdown)
- Nút Save Config
- Section: Queue stats (jobs đang chờ)

### 3.8 `admin.settings.tsx` — Cài đặt hệ thống

- Tabs: CV Config / Redis / RabbitMQ / JWT
- Fields: max CV size, supported formats, Redis host/port, JWT expiry
- Nút Save

### 3.9 `admin.audit-logs.tsx` — Audit Logs

- Table: Thời gian, Actor (user), Hành động, Resource, Kết quả (Success/Failed)
- Filter theo ngày, loại action

---

## Phase 4 — Auth

### 4.1 `signin.tsx`

- Form đăng nhập (Email + Password)
- Nút "Đăng nhập"
- Link "Quên mật khẩu"
- Redirect về `/admin` khi thành công

### 4.2 Zustand auth store (`store/auth.ts`)

```ts
{ user, token, setAuth, clearAuth }
```

---

## Design Tokens (từ `cv-smart-ai-main/src/styles.css`)

```css
--primary: oklch(0.33 0.13 265)      /* #1E3A8A Navy */
--brand-blue: oklch(0.55 0.2 263)    /* #2563EB */
--ai: oklch(0.51 0.25 295)           /* #7C3AED Purple */
--success: oklch(0.62 0.17 145)
--warning: oklch(0.78 0.16 75)
--danger: oklch(0.58 0.22 27)
--background: #F8FAFC
--font-sans: "Plus Jakarta Sans", "Inter", system-ui
--radius: 0.75rem
```

`.card-surface` utility: border + shadow-sm + rounded-xl + bg-card

---

## Thứ tự thực hiện

| # | Task | File(s) |
|---|------|---------|
| 1 | Setup deps + vite config | `package.json`, `vite.config.ts` |
| 2 | Design tokens + CSS | `src/index.css` |
| 3 | Root + main entry | `__root.tsx`, `main.tsx` |
| 4 | AdminLayout + StatusBadge | `components/` |
| 5 | Route layout `admin.tsx` | `routes/admin.tsx` |
| 6 | Dashboard page | `admin.index.tsx` |
| 7 | Pages: users, employer-verification, job-moderation | 3 files |
| 8 | Pages: packages, payments | 2 files |
| 9 | Pages: ai-config, settings, audit-logs | 3 files |
| 10 | Sign-in page + auth store | `signin.tsx`, `store/auth.ts` |
