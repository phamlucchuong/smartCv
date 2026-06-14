# [TASK] Port toàn bộ thiết kế recruiter/employer từ cv-smart-ai-main sang web-recruiter

## Overview

`apps/web-recruiter` hiện chỉ là **scaffold trống**: không có router, không có routes, không có styles, thiếu hầu hết dependencies. Issue này yêu cầu port **toàn bộ** thiết kế employer portal từ reference project sang `web-recruiter`, đạt visual và functional parity hoàn toàn.

**Source of truth (read-only):** `/home/chuongpl/projects/smartCV/cv-smart-ai-main/cv-smart-ai-main`

**Nguyên tắc chung:**
- Reference là sự thật tuyệt đối về UI, copy, icons, layout. Không suy diễn, không sáng tạo thêm.
- Tất cả route và component port **nguyên văn** từ source, chỉ điều chỉnh import paths.
- Shared components (layout, ui-kit) được đặt trong `apps/web-recruiter/src/` thay vì lên `@smart-cv/ui` (tránh làm phức tạp shared package trong giai đoạn này).
- Pattern theo `web-candidate` đã triển khai.

---

## Trạng thái hiện tại (Gap Analysis)

| Yếu tố | web-recruiter | web-candidate (reference pattern) |
|---|---|---|
| TanStack Router | ❌ Không có | ✅ File-based routing |
| TanStack Query | ❌ Không có | ✅ QueryClientProvider |
| `@smart-cv/ui` | ❌ Không có trong deps | ✅ Import globals.css |
| `recharts` | ❌ Không có | ❌ Cũng không có (cần thêm) |
| `lucide-react` | ❌ Không có | ✅ Có |
| `zustand` | ❌ Không có | ✅ Có |
| `sonner` | ❌ Không có | ❌ Cũng không có (cần thêm) |
| Routes | ❌ Không có | ✅ 12 routes |
| `index.css` | ❌ Trống | ✅ Đầy đủ oklch tokens |
| `vite.config.ts` | ❌ Thiếu TanStack plugin, Tailwind plugin | ✅ Đầy đủ |
| Path alias `@/` | ❌ Không có | ✅ Có |
| Layout components | ❌ Không có | ✅ Có |
| UI-kit components | ❌ Không có | ✅ Có |
| Mock data | ❌ Không có | ✅ Có |

---

## Phase 1 — Project Infrastructure Setup

### 1.1 Cập nhật `apps/web-recruiter/package.json`

Thêm dependencies còn thiếu:

```json
{
  "dependencies": {
    "react": "^19.2.5",
    "react-dom": "^19.2.5",
    "@smart-cv/api": "workspace:*",
    "@smart-cv/i18n": "workspace:*",
    "@smart-cv/ui": "workspace:*",
    "@tanstack/react-query": "^5.66.0",
    "@tanstack/react-router": "^1.100.0",
    "lucide-react": "^0.475.0",
    "recharts": "^2.15.4",
    "sonner": "^2.0.7",
    "zustand": "^5.0.3"
  },
  "devDependencies": {
    "@tanstack/router-plugin": "^1.100.0",
    "@tailwindcss/vite": "^4.0.0",
    "tailwindcss": "^4.0.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.2"
    // ... giữ nguyên các devDeps hiện có
  }
}
```

Sau đó chạy: `pnpm install` từ root.

### 1.2 Cập nhật `apps/web-recruiter/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
  },
})
```

**File cần sửa:** `apps/web-recruiter/vite.config.ts`

### 1.3 Cập nhật `apps/web-recruiter/tsconfig.app.json`

Thêm path alias để `@/` trỏ về `src/`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**File cần sửa:** `apps/web-recruiter/tsconfig.app.json`

### 1.4 Viết lại `apps/web-recruiter/src/index.css`

Copy **nguyên văn** từ `apps/web-candidate/src/index.css` (đã hoàn thành theo issue `20260601_candidate_home_light_mode_colors.md`). Không thay đổi gì ngoài comment header.

**File cần sửa:** `apps/web-recruiter/src/index.css`

### 1.5 Viết lại `apps/web-recruiter/src/main.tsx`

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import '@smart-cv/i18n'
import '@smart-cv/ui/src/globals.css'
import './index.css'
import { routeTree } from './routeTree.gen'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
```

**File cần sửa:** `apps/web-recruiter/src/main.tsx`

---

## Phase 2 — Mock Data & Utilities

### 2.1 Tạo `apps/web-recruiter/src/lib/mock-data.ts`

Port **nguyên văn** từ `cv-smart-ai-main/src/lib/mock-data.ts`.

File chứa:
- Type `ApplicationStatus` (9 values)
- Type `JobStatus` (5 values)
- Interface `Job` (15+ fields)
- Interface `Candidate` (14+ fields)
- Const `COMPANIES` (7 công ty)
- Const `JOBS` (6 jobs: Backend Java/FPT, Frontend/VNG, Data Engineer/Tiki, BA/Techcombank, QA/MoMo, DevOps/VNPay)
- Const `CANDIDATES` (6 ứng viên với scores 62–91%)
- Function `SCORE_COLOR(score)` → `"success" | "warning" | "danger"`

**File cần tạo:** `apps/web-recruiter/src/lib/mock-data.ts`

### 2.2 Tạo `apps/web-recruiter/src/lib/utils.ts`

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Thêm `clsx` và `tailwind-merge` vào dependencies nếu chưa có trong `@smart-cv/ui` re-export.
Hoặc import `cn` trực tiếp từ `@smart-cv/ui`.

**File cần tạo:** `apps/web-recruiter/src/lib/utils.ts`

---

## Phase 3 — Layout Components

### 3.1 Tạo `apps/web-recruiter/src/components/layouts/DashboardLayout.tsx`

Port **nguyên văn** từ `cv-smart-ai-main/src/components/layouts/DashboardLayout.tsx`.

Chi tiết layout:
- **Sidebar** collapsible (w-16 collapsed / w-64 expanded)
  - Logo + "SmartCV" brand name
  - Nav items với active state: `bg-primary text-primary-foreground font-medium`
  - Hover state: `hover:bg-sidebar-accent`
  - Nút collapse: `← Thu gọn` / `→`
  - Dùng `bg-sidebar`, `border-sidebar-border` CSS vars
- **Header** (h-16, sticky top-0 z-30)
  - Search input với `Search` icon, `border-input bg-background`
  - Role switcher dropdown (Ứng viên / Nhà tuyển dụng / Quản trị viên)
  - Bell icon với danger dot
  - User avatar dropdown (avatar circle `bg-primary text-primary-foreground`)
- **Main** content: `flex-1 p-6 max-w-[1600px] w-full mx-auto` + `<Outlet />`

Export type `NavItem { to: string; label: string; icon: LucideIcon }`.

**File cần tạo:** `apps/web-recruiter/src/components/layouts/DashboardLayout.tsx`

### 3.2 Tạo `apps/web-recruiter/src/components/layouts/PublicLayout.tsx`

Port **nguyên văn** từ `cv-smart-ai-main/src/components/layouts/PublicLayout.tsx`.

Chi tiết:
- **Header**: Logo + nav links (Jobs, For employers, Pricing, About) + Login/Register buttons
- **Footer**: 4-column link sections
- `<Outlet />` ở giữa

**File cần tạo:** `apps/web-recruiter/src/components/layouts/PublicLayout.tsx`

---

## Phase 4 — UI-Kit Components

Tất cả port **nguyên văn** từ `cv-smart-ai-main/src/components/ui-kit/`.

### 4.1 AIScoreRing

**File nguồn:** `cv-smart-ai-main/src/components/ui-kit/AIScoreRing.tsx`

Props: `{ score: number; size?: number; thickness?: number; label?: string }`

Logic:
- SVG circular progress với `stroke-dashoffset` animation
- Màu: `score >= 70` → `text-success`, `score >= 50` → `text-warning`, `< 50` → `text-danger`
- Hiển thị phần trăm ở giữa vòng tròn

**File cần tạo:** `apps/web-recruiter/src/components/ui-kit/AIScoreRing.tsx`

### 4.2 AIInsightBox

**File nguồn:** `cv-smart-ai-main/src/components/ui-kit/AIInsightBox.tsx`

Props: `{ title: string; children: ReactNode }`

Style: `rounded-xl border border-ai/20 bg-ai-soft/60 p-4 ai-gradient`
Header: `Sparkles` icon trong badge tím + title text

**File cần tạo:** `apps/web-recruiter/src/components/ui-kit/AIInsightBox.tsx`

### 4.3 StatusBadge

**File nguồn:** `cv-smart-ai-main/src/components/ui-kit/StatusBadge.tsx`

Props: `{ status: ApplicationStatus | JobStatus | string }`

Map 20+ status values → semantic color (success/warning/danger/muted/primary):
- `"Qualified"` → success
- `"Under Review"` → warning
- `"Not Qualified"` / `"Rejected"` → danger
- `"Interview Scheduled"` / `"Interviewed"` → primary (blue)
- `"Active"` → success, `"Draft"` → muted, `"Closed"` → muted
- `"Paid"` → success, `"Pending"` → warning

Hiển thị inline dot indicator + text.

**File cần tạo:** `apps/web-recruiter/src/components/ui-kit/StatusBadge.tsx`

### 4.4 SkillGapCard

**File nguồn:** `cv-smart-ai-main/src/components/ui-kit/SkillGapCard.tsx`

Props: `{ matched: string[]; missing: string[]; suggested?: string[] }`

3 sections:
- Matched: nền `success-soft`, text `success`, icon `Check`
- Missing: nền `danger-soft`, text `danger`, icon `X`
- Suggested: nền `ai-soft`, text `ai`, icon `Plus`

**File cần tạo:** `apps/web-recruiter/src/components/ui-kit/SkillGapCard.tsx`

### 4.5 EmptyState

**File nguồn:** `cv-smart-ai-main/src/components/ui-kit/EmptyState.tsx`

Props: `{ icon: LucideIcon; title: string; description: string; actionLabel?: string; onAction?: () => void }`

Layout: centered, icon → title → description → optional button.

**File cần tạo:** `apps/web-recruiter/src/components/ui-kit/EmptyState.tsx`

### 4.6 Stepper

**File nguồn:** `cv-smart-ai-main/src/components/ui-kit/Stepper.tsx`

Props: `{ steps: string[]; current: number }`

Step circles:
- Done (index < current): `bg-success text-white` + `Check` icon
- Active (index === current): `bg-primary text-white` + số
- Pending (index > current): `border border-border text-muted-foreground` + số

Connecting lines: `bg-success` nếu done, `border border-border` nếu pending.
Labels ẩn trên mobile, hiện từ `sm:`.

**File cần tạo:** `apps/web-recruiter/src/components/ui-kit/Stepper.tsx`

---

## Phase 5 — Routes (File-based Routing)

Tất cả route port **nguyên văn** từ `cv-smart-ai-main/src/routes/`. Điều chỉnh:
- Import paths: `@/components/...`, `@/lib/mock-data`
- `from-primary to-brand-blue` gradient (đảm bảo token `--brand-blue` đã có trong `index.css`)

### 5.1 Root Layout — `__root.tsx`

```
apps/web-recruiter/src/routes/__root.tsx
```

Cấu trúc: `<RouterProvider>` root với `<Outlet />`. Không có UI riêng ở cấp này (layout giao cho từng route group).

### 5.2 Public Layout Group — `_public.tsx`

```
apps/web-recruiter/src/routes/_public.tsx
```

Port từ `cv-smart-ai-main/src/routes/_public.tsx` — import và render `PublicLayout`.

### 5.3 Employer Layout Group — `employer.tsx`

```
apps/web-recruiter/src/routes/employer.tsx
```

Port nguyên văn, khai báo `NAV` với 10 nav items:

| Route | Label | Icon |
|---|---|---|
| `/employer` | Tổng quan | LayoutDashboard |
| `/employer/verification` | Xác minh công ty | ShieldCheck |
| `/employer/jobs` | Tin tuyển dụng | Briefcase |
| `/employer/applicants` | Ứng viên | Users |
| `/employer/ats` | Bảng ATS | Trello |
| `/employer/cv-search` | Tìm kiếm CV | Search |
| `/employer/assessments` | Bài kiểm tra | ClipboardCheck |
| `/employer/billing` | Gói & Thanh toán | CreditCard |
| `/employer/notifications` | Thông báo | Bell |
| `/employer/settings` | Cài đặt | Settings |

### 5.4 Public Home — `_public.index.tsx`

Port từ `cv-smart-ai-main/src/routes/_public.index.tsx` — landing page dành cho tất cả (job seekers + employers). Xem chi tiết tại issue `20260601_candidate_home_light_mode_colors.md`.

### 5.5 For Employers Landing — `_public.for-employers.tsx`

Port từ `cv-smart-ai-main/src/routes/_public.for-employers.tsx`.

Nội dung:
- Hero: "Tuyển dụng nhanh hơn 10 lần với AI"
- CTA: "Bắt đầu miễn phí" + "Liên hệ tư vấn"
- 3 feature cards: AI Screening, ATS Kanban, Verified Company
- Stats section nếu có trong reference

### 5.6 Employer Dashboard — `employer.index.tsx`

Port từ `cv-smart-ai-main/src/routes/employer.index.tsx`.

Sections:
1. **Header row**: "Tổng quan tuyển dụng" + company name + verified badge
2. **6 KPI cards** (grid `md:grid-cols-3 lg:grid-cols-6`): Việc đang đăng, Ứng viên, Đạt yêu cầu, Cần review, Sử dụng gói, Chi tháng này
3. **Charts row** (grid `lg:grid-cols-3`):
   - Line chart "Đơn ứng tuyển theo ngày" (7 data points T2-CN) — span 2 cols
   - Bar chart "Phễu tuyển dụng" (Applied→Qualified→Interview→Offer→Accepted) — 1 col
4. **Bottom row** (grid `lg:grid-cols-3`):
   - Danh sách ứng viên gần đây với `AIScoreRing` + `StatusBadge` — span 2 cols
   - `AIInsightBox` screening summary + "Việc cần chú ý" card — 1 col

Dùng Recharts: `LineChart`, `BarChart`, `CartesianGrid`, `XAxis`, `YAxis`, `Tooltip`, `ResponsiveContainer`.

### 5.7 Company Verification — `employer.verification.tsx`

Port từ `cv-smart-ai-main/src/routes/employer.verification.tsx`.

Nội dung:
- Company info form: tên công ty, mã số thuế, email, website, quy mô, ngành, người liên hệ, SĐT
- Verified badge display (nếu đã xác minh)
- Upload giấy phép kinh doanh với trạng thái
- Save/Update buttons

### 5.8 Job Listings — `employer.jobs.index.tsx`

Port từ `cv-smart-ai-main/src/routes/employer.jobs.index.tsx`.

Cấu trúc:
- Header row: "Tin tuyển dụng" + "Đăng tin mới" button → link đến `/employer/jobs/new`
- Search input + filter selects (Trạng thái, Phòng ban, Địa điểm)
- Table từ `@smart-cv/ui`:
  - Columns: Vị trí (title + company), Trạng thái (`StatusBadge`), Ứng viên, Đạt YC, Ngưỡng AI, Đăng lúc, Hành động
- Dùng `JOBS` mock data

### 5.9 New Job Wizard — `employer.jobs.new.tsx`

Port từ `cv-smart-ai-main/src/routes/employer.jobs.new.tsx`.

4-step wizard với `Stepper` component:

**Step 1 — Thông tin cơ bản:**
- Vị trí, Phòng ban, Địa điểm, Loại hình (Full-time/Part-time/Contract/Internship)
- Hình thức (Onsite/Remote/Hybrid), Số lượng, Lương từ, Lương đến

**Step 2 — Mô tả công việc:**
- Textarea mô tả, trách nhiệm, yêu cầu, phúc lợi
- Select kinh nghiệm (0-1/1-3/3-5/5+ năm), học vấn
- Input kỹ năng yêu cầu (tags)

**Step 3 — Quy tắc AI Screening:**
- Ngưỡng Đạt yêu cầu: ≥ 70% (configurable slider/input)
- Ngưỡng Cần review: 50–69%
- Dưới ngưỡng: Tự động từ chối
- `AIInsightBox` giải thích cách AI screening hoạt động

**Step 4 — Xem trước & Đăng:**
- Preview toàn bộ thông tin đã nhập
- "Lưu nháp" + "Đăng tuyển" buttons

### 5.10 Applicant List — `employer.applicants.tsx`

Port từ `cv-smart-ai-main/src/routes/employer.applicants.tsx`.

Full-featured table:
- Search: input tìm theo tên/kỹ năng
- Filters: Tin tuyển dụng, Trạng thái, Điểm AI (dropdown selects)
- Table columns:
  - Checkbox (bulk select)
  - Ứng viên: avatar initials circle `bg-primary/10` + tên + email
  - Vị trí ứng tuyển
  - AI Score: `AIScoreRing` (size=42, thickness=5)
  - Trạng thái: `StatusBadge`
  - Kỹ năng còn thiếu: list tags với `danger-soft` bg
  - Điểm test
  - Ngày ứng tuyển
  - Hành động: link "Xem" → `/employer/applicants/$id`
- Dùng `CANDIDATES` mock data

### 5.11 Applicant Detail — `employer.applicants.$id.tsx`

Port từ `cv-smart-ai-main/src/routes/employer.applicants.$id.tsx`.

5-tab interface (`Tabs` từ `@smart-cv/ui`):

**Tab 1 — Tổng quan:**
- Header: avatar, tên, title, email, phone, location
- AI score ring (size 80+)
- Current status badge + action buttons (Interview / Reject)
- Work experience list
- Skills matched/missing

**Tab 2 — CV:**
- PDF preview placeholder (`rounded-xl border bg-muted h-96 flex items-center justify-center`)

**Tab 3 — Phân tích AI:**
- Overall score progress breakdown:
  - Kỹ năng: X%
  - Kinh nghiệm: X%
  - Học vấn: X%
  - Từ khóa: X%
- `AIInsightBox` với AI recommendation text
- `SkillGapCard` với matched/missing/suggested skills

**Tab 4 — Kết quả kiểm tra:**
- Điểm tổng + breakdown theo category
- Progress bars cho từng hạng mục

**Tab 5 — Phỏng vấn:**
- `AIInsightBox` với tiêu đề "5 câu hỏi phỏng vấn gợi ý"
- Danh sách 5 câu hỏi (numbered list)
- "Copy tất cả" button

### 5.12 ATS Kanban Board — `employer.ats.tsx`

Port từ `cv-smart-ai-main/src/routes/employer.ats.tsx`.

6-column kanban:

| Cột | Màu header |
|---|---|
| Qualified | success |
| Interview Scheduled | primary |
| Interviewed | primary |
| Offer Sent | warning |
| Accepted | success |
| Rejected | danger |

Mỗi card ứng viên hiển thị:
- Avatar initials circle
- Tên + job applied
- `AIScoreRing` (size 38)
- Top 2 skills dưới dạng tags
- Dropdown "Chuyển sang..." với các cột còn lại

Layout: `flex gap-4 overflow-x-auto pb-4`. Mỗi cột: `min-w-[220px] w-[220px]`.

### 5.13 CV Database Search — `employer.cv-search.tsx`

Port từ `cv-smart-ai-main/src/routes/employer.cv-search.tsx`.

2-column layout (`lg:grid-cols-[280px_1fr]`):

**Sidebar filters:**
- Keywords input
- Skills (multi-select hoặc tags input)
- Kinh nghiệm (select range)
- Địa điểm (select)
- Lương mong muốn (range)
- Học vấn (select)
- Sẵn sàng đi làm (switch)
- "Tìm kiếm" button

**Results panel:**
- Candidate cards: tên, title, location, experience, top skills, AI fit score badge
- Một số card bị blur với lock icon (premium feature demo)
- "Xem CV" + "Mời ứng tuyển" buttons

### 5.14 Assessments — `employer.assessments.tsx`

Port từ `cv-smart-ai-main/src/routes/employer.assessments.tsx`.

Header + "Tạo bài kiểm tra" button + Table:

| Column | Detail |
|---|---|
| Tên bài test | text |
| Loại | Technical / IQ / EQ badge |
| Thời gian | X phút |
| Số câu hỏi | số |
| Áp dụng cho | tên job |
| Hành động | Sửa / Xóa buttons |

### 5.15 Billing — `employer.billing.tsx`

Port từ `cv-smart-ai-main/src/routes/employer.billing.tsx`.

Sections:
1. **Current plan card** (gradient `from-primary to-brand-blue`): tên gói, usage bars (tin tuyển dụng còn lại, ứng viên còn lại, CV search còn lại)
2. **Plan comparison** (3 cards: Basic / **Pro** featured / Premium)
   - Pro card: `border-2 border-primary shadow-md`
   - Mỗi card: giá/tháng, feature list với `CheckCircle2`
3. **Payment history** table: Invoice ID, Gói, Số tiền, Trạng thái (`StatusBadge`), Ngày, Tải hóa đơn

### 5.16 Notifications — `employer.notifications.tsx`

Port từ `cv-smart-ai-main/src/routes/employer.notifications.tsx`.

List of notification items:
- Avatar + title + description + timestamp
- Unread indicator dot
- Hover: `hover:bg-accent`

### 5.17 Settings — `employer.settings.tsx`

Port từ `cv-smart-ai-main/src/routes/employer.settings.tsx`.

Simple form:
- Họ và tên (input)
- Email (input, disabled)
- "Lưu thay đổi" button

---

## Phase 6 — Auth Routes

### 6.1 Login — `login.tsx`

Port từ `cv-smart-ai-main/src/routes/login.tsx` (nếu có) hoặc xây dựng theo pattern:
- Split-panel: left side branding, right side form
- Tabs: "Ứng viên" / "Nhà tuyển dụng"
- Demo login buttons (điền sẵn credential)
- Form: email + password + "Đăng nhập" button
- Link đến register

### 6.2 Register — `register.tsx` (nếu có trong reference)

Kiểm tra `cv-smart-ai-main/src/routes/` xem có `register.tsx` không, port nếu có.

---

## Phase 7 — Zustand Store

### 7.1 Tạo `apps/web-recruiter/src/store/useRecruiterStore.ts`

```typescript
import { create } from 'zustand'

interface RecruiterStore {
  // Theme
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  // Sidebar
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void
}

export const useRecruiterStore = create<RecruiterStore>((set) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme }),
  sidebarCollapsed: false,
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
}))
```

**File cần tạo:** `apps/web-recruiter/src/store/useRecruiterStore.ts`

---

## Cấu trúc file cuối cùng

```
apps/web-recruiter/src/
├── main.tsx                                    ← Viết lại
├── index.css                                   ← Copy từ web-candidate
├── lib/
│   ├── mock-data.ts                            ← Port từ reference
│   └── utils.ts                               ← cn() utility
├── components/
│   ├── layouts/
│   │   ├── DashboardLayout.tsx                 ← Port từ reference
│   │   └── PublicLayout.tsx                   ← Port từ reference
│   └── ui-kit/
│       ├── AIScoreRing.tsx                     ← Port từ reference
│       ├── AIInsightBox.tsx                   ← Port từ reference
│       ├── StatusBadge.tsx                    ← Port từ reference
│       ├── SkillGapCard.tsx                   ← Port từ reference
│       ├── EmptyState.tsx                     ← Port từ reference
│       └── Stepper.tsx                        ← Port từ reference
├── store/
│   └── useRecruiterStore.ts                   ← Tạo mới
└── routes/
    ├── __root.tsx                              ← Tạo mới
    ├── _public.tsx                             ← Port từ reference
    ├── _public.index.tsx                      ← Port từ reference
    ├── _public.for-employers.tsx              ← Port từ reference
    ├── login.tsx                              ← Port từ reference
    ├── employer.tsx                           ← Port từ reference
    ├── employer.index.tsx                     ← Port từ reference
    ├── employer.verification.tsx              ← Port từ reference
    ├── employer.jobs.index.tsx                ← Port từ reference
    ├── employer.jobs.new.tsx                  ← Port từ reference
    ├── employer.applicants.tsx                ← Port từ reference
    ├── employer.applicants.$id.tsx            ← Port từ reference
    ├── employer.ats.tsx                       ← Port từ reference
    ├── employer.cv-search.tsx                 ← Port từ reference
    ├── employer.assessments.tsx               ← Port từ reference
    ├── employer.billing.tsx                   ← Port từ reference
    ├── employer.notifications.tsx             ← Port từ reference
    └── employer.settings.tsx                  ← Port từ reference
```

---

## Dependencies cần thêm vào root `package.json` (nếu chưa có)

Kiểm tra `pnpm-workspace.yaml` xem `recharts` và `sonner` đã được catalog chưa. Nếu chưa, thêm vào `apps/web-recruiter/package.json` trực tiếp như trên.

---

## Thứ tự thực hiện

1. Phase 1 (Infrastructure) → chạy `pnpm install` → verify `pnpm -F web-recruiter dev` bật được server trống
2. Phase 2 (Mock data + utils) → verify import không lỗi TypeScript
3. Phase 3 (Layouts) → verify render không crash
4. Phase 4 (UI-kit) → verify từng component render đúng
5. Phase 5.1–5.3 (root + _public.tsx + employer.tsx layout groups) → verify routing hoạt động
6. Phase 5.4 (Public home landing) → verify visual parity với reference
7. Phase 5.6 (Employer dashboard) → verify charts render, KPI cards đúng
8. Phase 5.7–5.17 (Remaining routes) → từng route một
9. Phase 6 (Auth)
10. Phase 7 (Store)

---

## Acceptance Criteria

- [ ] `pnpm -F web-recruiter dev` khởi động không lỗi ở `localhost:3001`
- [ ] Route `/` render public landing page giống reference
- [ ] Route `/employer` render dashboard với 6 KPI cards + 2 charts + candidate list
- [ ] Route `/employer/jobs` render table với dữ liệu mock
- [ ] Route `/employer/jobs/new` render 4-step wizard với Stepper
- [ ] Route `/employer/applicants` render table đầy đủ cột, filter hoạt động
- [ ] Route `/employer/applicants/c1` render 5-tab detail với AIScoreRing, SkillGapCard, AIInsightBox
- [ ] Route `/employer/ats` render 6-column kanban, cards hiển thị đúng
- [ ] Route `/employer/cv-search` render 2-column layout với filters
- [ ] Route `/employer/billing` render current plan gradient card + 3 plan cards + payment table
- [ ] Sidebar collapse/expand hoạt động
- [ ] Role switcher chuyển route đúng
- [ ] Light mode hiển thị background `#F8FAFC`, primary navy `#1E3A8A`
- [ ] `AIScoreRing` màu đúng theo threshold (≥70 green, ≥50 amber, <50 red)
- [ ] `StatusBadge` màu đúng cho tất cả status values
- [ ] Không có lỗi TypeScript (`tsc --noEmit`)

---

## Notes

- `routeTree.gen.ts` được TanStack Router plugin **tự động sinh** khi `vite dev` chạy lần đầu — không tạo thủ công.
- `recharts` không có trong monorepo hiện tại — cần add vào `apps/web-recruiter/package.json` (không cần thêm vào shared packages).
- `sonner` dùng cho toast notifications khi submit form (optional, thêm nếu reference dùng).
- Các Radix UI primitives (Select, Table, Sheet, Tabs, Dialog, DropdownMenu) đã có sẵn trong `@smart-cv/ui` — import trực tiếp.
