# [FIX] Strict design fidelity to cv-smart-ai-main + dark mode for web-candidate

## Overview

The `web-candidate` app was scaffolded toward the `cv-smart-ai-main` design (see superseded issue `20260529_redesign_web_candidate_ui.md`), but the current implementation is only an **approximation**. This issue requires bringing it to **exact visual parity** with the reference project — colors, icons, layout, structure, and Vietnamese copy must **not differ from the original** — and adds a **net-new dark mode** (the reference is light-only).

**Source of truth (read-only reference):** `/home/chuongpl/projects/cv-smart-ai-main/cv-smart-ai-main`

Three confirmed decisions drive this work:

1. **Dark mode behavior** — Light mode keeps **navy `#1E3A8A`** as primary (exact reference match). Dark mode uses **brighter blue `#2563EB`** as primary for legibility, with dark-adjusted versions of the reference's light-only treatments (`bg-blue-50`, `white/10` gradient overlays, `bg-black/25`). The existing `.dark` token block in `index.css` already encodes this.
2. **Fidelity scope** — Rewrite **every** public and candidate page to match the reference exactly (structure, layout, copy, icons, mock data). This includes the split-panel login with tabs + demo logins, the table-based applications view + detail sheet, `SkillGapCard` on job detail, `Stepper` in the apply flow, and the exact dashboard/profile/CV/settings sections.
3. **Component location** — Port the missing Radix-based UI primitives into the shared **`@smart-cv/ui`** package (reusable by `web-recruiter`/`web-admin`).

---

## Reproduction steps

1. `pnpm -F web-candidate dev` → open `http://localhost:3000`.
2. Compare each page side-by-side with the reference (`pnpm dev` in `cv-smart-ai-main`, or read its route files).
3. Observe the deviations enumerated in **Current behavior** below.
4. Toggle theme in the dashboard top bar → note dark mode is **not** available on public/auth pages and **does not persist** across reloads (FOUC on reload).

---

## Expected behavior

### Global rules (apply to all work)

- **The reference is the source of truth.** When in doubt about copy, spacing, icon, or color, open the corresponding reference file and replicate it exactly. Reference files are listed per item below.
- **Container widths:** public pages use `mx-auto max-w-7xl px-6` (currently `max-w-6xl`); dashboard `<main>` uses `p-6 max-w-[1600px] w-full mx-auto` (currently `p-4 md:p-6`). Match the reference.
- **Card styling:** the reference uses a `.card-surface` utility (white card, `1px` border, soft double shadow, `radius-xl`). Add this utility to `apps/web-candidate/src/index.css` (copy verbatim from reference `styles.css`) and use it instead of ad-hoc `border border-border bg-card` where the reference uses `card-surface`:
  ```css
  @layer utilities {
    .card-surface {
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      box-shadow: 0 1px 2px rgb(15 23 42 / 0.04), 0 1px 3px rgb(15 23 42 / 0.04);
    }
    .ai-gradient {
      background: linear-gradient(135deg, oklch(0.51 0.25 295 / 0.08), oklch(0.55 0.2 263 / 0.08));
    }
  }
  ```
- **Font:** Plus Jakarta Sans is already loaded via `@import` in `index.css` — keep it. (Optional parity: also add `preconnect` + stylesheet `<link>` to `index.html`.)
- **Icons:** use the exact `lucide-react` icon names the reference uses (listed per page). No substitutions.

---

### Phase 1 — Port missing primitives into `@smart-cv/ui`

`@smart-cv/ui` currently exports only `button`, `card`, `input`, `badge`. The reference uses 45 Radix-wrapped primitives. Port the following from `cv-smart-ai-main/src/components/ui/` into `packages/ui/src/components/ui/`, adapting imports to the package's `cn` (`../../lib/utils`) and re-exporting each from `packages/ui/src/index.ts`.

**Required (used by faithful pages):**

| Component | Reference file | Used by |
|-----------|---------------|---------|
| `select` | `ui/select.tsx` | job filters, applications filter, profile selects |
| `table` | `ui/table.tsx` | candidate applications list |
| `sheet` | `ui/sheet.tsx` | applications detail panel |
| `tabs` | `ui/tabs.tsx` | login candidate/employer toggle |
| `switch` | `ui/switch.tsx` | settings toggles |
| `progress` | `ui/progress.tsx` | dashboard "profile completion" bar |
| `dropdown-menu` | `ui/dropdown-menu.tsx` | dashboard user menu |
| `label` | `ui/label.tsx` | form field labels |
| `separator` | `ui/separator.tsx` | dividers |

**Optional (nice-to-have parity, can fall back to existing markup):** `avatar`, `textarea`, `tooltip`, `sonner` (toasts).

**Radix dependencies to add to `packages/ui/package.json`:**
`@radix-ui/react-select`, `@radix-ui/react-tabs`, `@radix-ui/react-switch`, `@radix-ui/react-progress`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-label`, `@radix-ui/react-separator`, `@radix-ui/react-dialog` (Sheet is built on Dialog), `@radix-ui/react-slot`. (Optional: `@radix-ui/react-avatar`, `@radix-ui/react-tooltip`.) `class-variance-authority`, `clsx`, `tailwind-merge` are already present.

> Note: `table` is plain styled markup (no Radix dep). `sheet` is a Dialog variant — port `dialog.tsx` too if not present, or inline the Dialog primitives `sheet.tsx` imports.

---

### Phase 2 — Mock data + ui-kit alignment

**2a. Create `apps/web-candidate/src/lib/mock-data.ts`** mirroring the reference `src/lib/mock-data.ts` exactly. Exports and shapes:

- `SCORE_COLOR(score)` → `score >= 70 ? "success" : score >= 50 ? "warning" : "danger"`
- `COMPANIES: string[]` — 7 Vietnamese tech companies (FPT Software, VNG, Tiki, MoMo, Techcombank, VNPay, …).
- `JOBS: Job[]` — **6 jobs**, exact ids/titles/companies/scores:
  | id | title | company | matchScore |
  |----|-------|---------|-----------|
  | j1 | Backend Java Developer | FPT Software | 76 |
  | j2 | Frontend React Developer | VNG | 84 |
  | j3 | Data Engineer | Tiki | 62 |
  | j4 | Business Analyst | Techcombank | 89 |
  | j5 | QA Automation Engineer | MoMo | 71 |
  | j6 | DevOps Engineer | VNPay | 68 |

  `Job` fields: `id, title, company, companyLogo?, location, salary, type ("Full-time"|"Part-time"|"Contract"|"Internship"), mode ("Onsite"|"Remote"|"Hybrid"), skills[], postedDays, matchScore?, description, responsibilities[], requirements[], benefits[], assessmentRequired?, experience, status?, applicants?, qualified?`.
- `APPLICATIONS: Application[]` — **5 applications**:
  | jobTitle | company | score | status |
  |----------|---------|-------|--------|
  | Backend Java Developer | FPT Software | 76 | Under Review |
  | Frontend React Developer | VNG | 84 | Qualified |
  | Business Analyst | Techcombank | 89 | Interview Scheduled |
  | Data Engineer | Tiki | 62 | Not Qualified |
  | QA Automation Engineer | MoMo | 71 | Pending Review |

  `Application` fields: `id, jobId, jobTitle, company, appliedDate, score, status, assessmentStatus ("Not Required"|"Pending"|"Submitted"|"Expired"), lastUpdate`.
- `CVS` — **3**: `cv1 NguyenMinhAnh_Backend.pdf` (PDF, `isDefault: true`, status "Parsed"), `cv2 NguyenMinhAnh_Fullstack.pdf` (PDF), `cv3 CV_English_2025.docx` (DOCX). Fields: `id, name, uploaded, type, status, isDefault`.
- `ASSESSMENTS` — **3**: Backend Technical Test (Technical, 60 min, "Not started"), General IQ Test (IQ, 30 min, "Submitted", 88), EQ Assessment (EQ, 25 min, "Submitted", 90). Fields: `id, title, job, type, duration, status, score?`.
- `CANDIDATES: Candidate[]` — 6 (scores 62–91), fields per reference.

> Copy the actual string values (descriptions, responsibilities, requirements, benefits, locations, salaries) verbatim from the reference `mock-data.ts`.

**2b. ui-kit components** (`apps/web-candidate/src/components/ui-kit/`):

- `AIScoreRing.tsx`, `AIInsightBox.tsx`, `StatusBadge.tsx`, `SkillGapCard.tsx`, `EmptyState.tsx` already exist — **verify each matches the reference source exactly** (props, labels, classes). In particular:
  - `AIScoreRing`: import `SCORE_COLOR` from `../lib/mock-data` (single source) rather than an inline copy.
  - `AIInsightBox`: wrapper must be `rounded-xl border border-ai/20 bg-ai-soft/60 p-4 ai-gradient` with `size-7 rounded-lg bg-ai text-ai-foreground` icon chip and `text-foreground/80` body.
  - `SkillGapCard`: labels "Phân tích kỹ năng" / "Kỹ năng phù hợp" (green check) / "Kỹ năng còn thiếu" (red X) / "Đề xuất bổ sung" (purple plus); `card-surface`; `gap-1.5` badge wrap.
  - `StatusBadge`: full status→tone map and tone classes per reference (`success/warning/danger/info/muted/ai/primary`), pill with leading dot.
- **Add `Stepper.tsx`** (missing) — port from reference `ui-kit/Stepper.tsx`. Props `{ steps: string[]; current: number }`; completed = green + check, active = primary + number, inactive = card + number; connectors colored by completion. Used by `candidate.jobs.$id.apply.tsx`.

---

### Phase 3 — Dark mode wiring (net-new)

The `.dark` token block already exists in `index.css` and is correct (navy primary in light, `#2563EB` brand-blue primary in dark). Wire it up site-wide:

1. **No-FOUC init script** in `apps/web-candidate/index.html` `<head>`, before the module script:
   ```html
   <script>
     (function () {
       try {
         var t = localStorage.getItem('theme');
         if (t === 'dark' || (!t && matchMedia('(prefers-color-scheme: dark)').matches)) {
           document.documentElement.classList.add('dark');
         }
       } catch (e) {}
     })();
   </script>
   ```
   (Default may be light-only if preferred — but persistence is required either way.)
2. **Shared theme helper** — add a small `useTheme` hook or `toggleTheme()` util (e.g. `apps/web-candidate/src/lib/theme.ts`) that toggles `document.documentElement.classList` **and writes `localStorage.theme`**. The current `DashboardLayout.toggleTheme` toggles the class but does **not** persist — fix it to persist.
3. **Theme toggle is site-wide**, not dashboard-only:
   - Add a `Sun`/`Moon` toggle button to `PublicLayout` header (next to the language/CTA cluster).
   - Add the same toggle to the auth pages (`signin.tsx`, `signup.tsx`) header/corner.
   - Keep the existing toggle in `DashboardLayout`.
4. **Dark-adjusted light-only treatments** — audit reference markup that hardcodes light values and make them theme-aware:
   - `bg-blue-50` (e.g. dashboard "Phỏng vấn" card, StatusBadge `info` tone) → use `bg-brand-blue/10` or a `dark:` override.
   - `bg-white/10` / `bg-white/20` gradient overlay panels (landing employer CTA, login right panel) → fine on the gradient in both modes; verify contrast.
   - `bg-black/25` (landing AI Screening Summary box) → verify legibility in dark; adjust to `bg-black/25 dark:bg-white/10` if needed.

---

### Phase 4 — Layout fidelity

#### 4a. `PublicLayout.tsx` — reference `src/components/layouts/PublicLayout.tsx`
- Container `mx-auto max-w-7xl px-6 h-16` (change from `max-w-6xl`).
- Nav uses `gap-1` items with `px-3 py-2 text-sm rounded-md`; active `text-primary font-medium`, inactive `text-muted-foreground hover:text-foreground` (current uses `gap-5` plain links — align to reference).
- Footer container `max-w-7xl px-6 py-10`; columns and copy already match — keep.
- **Add** the dark-mode toggle button to the right cluster (Phase 3).
- Logo, nav labels (`Tìm việc`, `Dành cho nhà tuyển dụng`, `Bảng giá`, `Về chúng tôi`), CTA (`Đăng nhập` ghost → `/signin`, `Bắt đầu ngay` → `/signup`) already match.

#### 4b. `DashboardLayout.tsx` — reference `src/components/layouts/DashboardLayout.tsx`
- **Sidebar nav must match the reference candidate nav exactly** (order, labels, icons):
  | # | to | label | icon |
  |---|-----|-------|------|
  | 1 | `/candidate` | Tổng quan | `LayoutDashboard` |
  | 2 | `/candidate/profile` | Hồ sơ của tôi | `User` |
  | 3 | `/candidate/cv` | CV của tôi | `FileText` |
  | 4 | `/candidate/jobs` | Tìm việc | `Search` |
  | 5 | `/candidate/recommended` | Việc gợi ý | `Sparkles` |
  | 6 | `/candidate/applications` | Đơn ứng tuyển | `ClipboardList` |
  | 7 | `/candidate/assessments` | Bài kiểm tra | `ClipboardCheck` |
  | 8 | `/candidate/notifications` | Thông báo | `Bell` |
  | 9 | `/candidate/settings` | Cài đặt | `Settings` |

  Current nav differs in order, labels (`Quản lý CV`, `Gợi ý việc`, `Hồ sơ`), icons (`FileDown`, `FileText` for applications), and is **missing** Assessments + Notifications and **includes** Wishlists (see Route reconciliation).
- Sidebar widths `w-64` / `w-16`, collapse button text `← Thu gọn` / `→` — already match.
- Top bar: search input (`Tìm kiếm...` per reference, currently `Tìm việc, công ty...`), then right cluster. **Use `DropdownMenu`** (Phase 1) for the user menu instead of the manual open/close state. Keep theme + language toggles (web-candidate additions). **Omit the role switcher** — web-candidate is a single-role (candidate) app; this is the one intentional, allowed deviation from the generic reference layout. Active nav state: `bg-primary text-primary-foreground`.
- `<main>` wrapper: `p-6 max-w-[1600px] w-full mx-auto`.

---

### Phase 5 — Public page fidelity

> Replicate each reference file exactly. Files map 1:1 unless noted.

#### 5a. `_public.index.tsx` (landing) — ref `_public.index.tsx`
Sections, in order:
1. **Hero** (`max-w-7xl px-6 py-20 grid lg:grid-cols-2 gap-12 items-center`, bg `ai-gradient opacity-60`):
   - Badge: `Sparkles` + "Powered by AI Matching Engine" (`bg-ai-soft border border-ai/20`).
   - H1: `Tìm việc tốt hơn và tuyển dụng <span className="text-primary">thông minh hơn</span> với AI`.
   - Sub: "SmartCV giúp ứng viên biết mức độ phù hợp **trước khi ứng tuyển** và giúp nhà tuyển dụng sàng lọc CV nhanh hơn 10 lần bằng AI."
   - Buttons: "Tìm việc ngay" + `ArrowRight` (primary); "Đăng tuyển dụng" (outline).
   - Stats: "50,000+ việc làm", "200+ doanh nghiệp".
   - Right **AI Match Result** card: title "AI Match Result", job "Backend Java Developer" / "FPT Software", `AIScoreRing score={82}`, matched "Java/REST API/MySQL" (`bg-success-soft text-success`), missing "Spring Boot/Docker" (`bg-danger-soft text-danger`), AI box "5 việc khác phù hợp được gợi ý" + "Hãy cải thiện Spring Boot và Docker để tăng cơ hội."; top-right `Brain` + "AI Analysis" + "Live".
2. **Search bar** (`card-surface p-2 flex md:flex-row gap-2`, `-mt-6 z-10`): inputs "Vị trí, kỹ năng..." (`Search`), "Địa điểm" (`MapPin`), "Loại hình" (`Briefcase`), "Mức lương" (`DollarSign`); button "Tìm kiếm".
3. **AI Features** (`md:grid-cols-3 gap-6`): label "AI Features"; heading "Trí tuệ nhân tạo cho mọi bước tuyển dụng"; cards — `Brain` "AI CV Matching" (ai), `Zap` "AI Auto Screening" (primary), `Target` "Smart Job Recommendation" (success); each footer `Sparkles` "AI-powered"; cards `card-surface p-6 hover:shadow-md`.
4. **Featured Jobs** (`md:grid-cols-2 lg:grid-cols-3 gap-4`): heading "Việc làm nổi bật" + sub "Cập nhật mỗi ngày từ các công ty hàng đầu" + "Xem tất cả →"; cards from `JOBS` with `Building2` logo, salary (`DollarSign`), location (`MapPin`), "{postedDays} ngày trước" (`Clock`), first 3 skills + `+{n}`; `card-surface p-5 hover:shadow-md hover:border-primary/30`.
5. **Employer CTA** (`lg:grid-cols-2 gap-8`, `bg-gradient-to-br from-primary to-brand-blue text-primary-foreground`): heading "Tuyển dụng cùng SmartCV"; sub; 4 `CheckCircle2` items ("Giảm 80% thời gian sàng lọc thủ công", "Cấu hình quy tắc screening linh hoạt", "Pipeline ATS Kanban trực quan", "AI sinh câu hỏi phỏng vấn theo CV"); button "Start hiring with SmartCV" (`variant="secondary"`); right `white/10 backdrop-blur` "AI Screening Summary" with "42 Auto-qualified / 18 Manual review / 26 Auto-rejected" + "Avg match score: **68%**".

#### 5b. `signin.tsx` + `signup.tsx` — ref `login.tsx`
Rebuild as the reference **split 2-panel** (`min-h-screen grid lg:grid-cols-2 bg-background`):
- **Left (form):** logo (`size-9 rounded-lg bg-primary` + `Sparkles` + "SmartCV"); H "Chào mừng trở lại" (signup: "Tạo tài khoản"); sub "Đăng nhập để tiếp tục với SmartCV"; **Tabs** "Ứng viên" / "Nhà tuyển dụng" (`bg-secondary` segmented); Email field (`Mail` icon, default "minhanh@example.com"); Password field (`Lock` icon, "Quên mật khẩu?" link, default "demo1234"); button "Tiếp tục" (`w-full h-11`); divider "Hoặc đăng nhập nhanh demo"; quick-login `grid-cols-3`: "Ứng viên" / "NTD" / "Admin"; footer link "Chưa có tài khoản? Đăng ký ngay" (signup: "Đã có tài khoản? Đăng nhập").
- **Right (visual, `hidden lg:flex`):** `bg-gradient-to-br from-primary via-brand-blue to-ai p-12 text-primary-foreground`; tag "AI Recruitment Platform" (`Sparkles`); H "Hơn 1 triệu CV đã được phân tích bằng AI"; three `bg-white/10 backdrop-blur border border-white/20` boxes: `Brain` "AI CV Matching" / "Điểm phù hợp tức thời", `Target` "Smart Recommendation" / "Gợi ý việc làm thông minh", `Zap` "Auto Screening" / "Tự động sàng lọc CV".
- Preserve current auth behavior: any submit / quick-login sets `localStorage.isAuthenticated='true'` and navigates to `/candidate`; `signin` `beforeLoad` redirects authenticated users to `/candidate`. Add the dark-mode toggle (Phase 3) in a corner.

> Reconciliation: the reference has a single `login.tsx`. web-candidate keeps separate `/signin` and `/signup` routes (existing auth flow). `signin.tsx` replicates the reference exactly; `signup.tsx` reuses the same two-panel shell with name + email + password fields.

#### 5c. `_public.jobs.index.tsx` — ref `_public.jobs.index.tsx`
`max-w-7xl px-6 py-8 grid lg:grid-cols-[280px_1fr] gap-6`:
- **Filter sidebar** (`card-surface p-5 sticky top-20`): "Bộ lọc" (`Filter`); inputs "Từ khoá", "Địa điểm"; **Selects** "Loại hình" (Full-time/Part-time/Contract), "Kinh nghiệm" (0-1/1-3/3-5/5+ năm), "Mức lương" (<15M/15-25M/25-40M/>40M), "Hình thức" (Onsite/Remote/Hybrid), "Công ty" (FPT Software/VNG/Tiki/MoMo); skill tag chips "Java/React/Python/AWS/Docker" (`rounded-full border hover:bg-accent`).
- **List:** heading "Tìm việc làm" + "{JOBS.length} việc làm phù hợp"; search input "Tìm kiếm..." (`Search`, `w-64`); job rows `card-surface p-5 flex gap-4 hover:border-primary/30` with `Building2` (`size-12`), title, company, salary (`text-success`, right), `MapPin`/`Clock`/mode badge, all skills; link `/jobs/$id`.

#### 5d. `_public.jobs.$id.tsx` — ref `_public.jobs.$id.tsx`
`max-w-7xl px-6 py-8 grid lg:grid-cols-[1fr_340px] gap-6`:
- **Main** (`space-y-6`): header card (`Building2 size-14`, `text-2xl` title, info row `MapPin`/`DollarSign`/`Briefcase`/`Clock`, `StatusBadge tone="ai"` "Yêu cầu bài test" if `assessmentRequired`); "Mô tả công việc"; "Trách nhiệm" (`CheckCircle2` text-success); "Yêu cầu" (`CheckCircle2` text-primary); "Quyền lợi" (`sm:grid-cols-2`, `Sparkles` text-ai); "Kỹ năng yêu cầu" (`rounded-full border bg-secondary`).
- **Sidebar** (`space-y-4 sticky top-20`): buttons card "Ứng tuyển ngay" (`size-lg`) + "Phân tích với CV của tôi" (outline, `Sparkles` text-ai); `AIInsightBox` title "AI Match Score" / "Đăng nhập và chọn CV để xem điểm phù hợp tự động."; "Về công ty" card; "Việc tương tự" (max 3).

#### 5e. `_public.about.tsx`, `_public.for-employers.tsx`, `_public.pricing.tsx`
Replicate the reference equivalents exactly (sections, copy, icons). (Current files are 13–14 line stubs.)

---

### Phase 6 — Candidate page fidelity

#### 6a. `candidate.index.tsx` — ref `candidate.index.tsx`
- Header: "Chào mừng quay lại, Minh Anh 👋" + "Tổng quan sự nghiệp và hoạt động gần đây của bạn".
- **4 metric cards** (`md:grid-cols-2 lg:grid-cols-4 gap-4`):
  1. `TrendingUp` (success) "Hoàn thành hồ sơ" **78%** + `Progress` bar (`h-1.5`) + link "Hoàn thiện hồ sơ" → `/candidate/profile`.
  2. "CV đã tải" `{CVS.length}/10` + "CV mặc định: …" + link "Quản lý CV" → `/candidate/cv`.
  3. "Bài test đang chờ" (count of "Not started") + "Backend Technical Test" + link "Làm ngay" → `/candidate/assessments`.
  4. **Gradient** `from-primary to-brand-blue` `Sparkles` "Việc phù hợp nhất" "Business Analyst" / "Techcombank • Match 89%" + link "Xem việc" → `/jobs/$id` (id j4).
- **Application summary** (`lg:grid-cols-3 gap-4`): left `lg:col-span-2 card-surface p-5` "Tổng quan đơn ứng tuyển" + "Xem tất cả →" + 4-col counts (Đạt yêu cầu/Đang xem xét/Chưa phù hợp) + `APPLICATIONS.slice(0,4)` rows (`AIScoreRing size=42 thickness=5` + `StatusBadge`); right column: `AIInsightBox` "AI Tips cải thiện CV" (3 bullets, exact copy) + "Việc gợi ý từ AI" card (`JOBS.slice(0,3)`, `AIScoreRing size=40 thickness=4`).

> The current `candidate.index.tsx` uses 6 generic metric cards and a single recent-applications card — replace entirely with the above.

#### 6b. `candidate.profile.tsx` — ref `candidate.profile.tsx`
`space-y-6 max-w-5xl`: header "Hồ sơ của tôi" / sub + "Huỷ"/"Lưu thay đổi"; avatar card ("MA" `size-20`, "Nguyễn Minh Anh", "Backend Developer • Ho Chi Minh City", "Đổi ảnh"); sections (each `card-surface p-6`): **Thông tin cơ bản** (Họ và tên, Email, Số điện thoại, Địa điểm), **Mục tiêu nghề nghiệp** (Vị trí hiện tại, Số năm kinh nghiệm, Mức lương mong muốn, Địa điểm mong muốn, Loại hình), **Kỹ năng** (tag chips + "+ Thêm kỹ năng" dashed), **Kinh nghiệm làm việc** (experience card + "+ Thêm kinh nghiệm"), **Học vấn**. Exact values per reference.

#### 6c. `candidate.cv.tsx` — ref `candidate.cv.tsx`
`space-y-6`: header "CV của tôi" / "Tối đa 10 CV • Hỗ trợ PDF, DOCX"; upload area (`card-surface border-dashed border-2 border-primary/20 bg-primary/5`, `Upload` size-8, "Kéo thả CV vào đây hoặc bấm để chọn", "Chọn file"); main `lg:grid-cols-[1fr_1.5fr] gap-6`: left CV list (type badge `bg-danger/10 text-danger`, name, date, `StatusBadge`, `Star` "Mặc định" for default, selected `border-primary bg-primary/5`); right preview card (actions `Eye`/`Star`/`RefreshCw`/`Trash2`, `aspect-[3/4]` placeholder with `FileText`) + analysis card (parsed fields grid) + `AIInsightBox` "AI đánh giá chất lượng CV" ("Độ hoàn thiện: **82/100**" + 3 bullets).

> Note: the current `candidate.cv.tsx` is a 14-line stub; supersedes the simpler design in issue `20260528_cv_manager_screen.md` — match the reference layout instead.

#### 6d. `candidate.applications.tsx` — ref `candidate.applications.tsx`
`space-y-5`: header "Đơn ứng tuyển của tôi" + "{APPLICATIONS.length} đơn ứng tuyển" + **Select** filter (Tất cả trạng thái / Đạt yêu cầu / Đang xem xét). **Table** (`card-surface overflow-hidden`) with headers Công việc / Match Score / Trạng thái / Bài test / Cập nhật / Hành động; rows show job+company+date, `AIScoreRing size=42 thickness=5`, `StatusBadge` (status), `StatusBadge` (assessmentStatus), last update, "Chi tiết" (ghost) opening a **Sheet** (`sm:max-w-lg`): `AIScoreRing size=72` + `StatusBadge`; CV info box; **Timeline** (4 steps with `CheckCircle2` done / muted pending: "Đã nộp đơn", "AI đã phân tích", "{status}", "Phỏng vấn"); HR message box (`bg-ai-soft border-ai/20`, `Sparkles`).

> Replace the current card-grid applications view entirely.

#### 6e. `candidate.jobs.index.tsx` — ref `candidate.jobs.index.tsx`
`space-y-5`: header "Tìm việc làm" / "Sắp xếp theo AI match score" + **Select** sort (Phù hợp nhất (AI) / Mới nhất / Lương cao nhất); `AIInsightBox` "AI gợi ý sắp xếp"; job cards (`card-surface p-5`) with `Building2`, link `/candidate/jobs/$id`, salary (`text-success`), `AIScoreRing size=56 thickness=6`, matched-skills section (first 4, `bg-success-soft`) + "Thiếu 2 kỹ năng", buttons "Ứng tuyển" → `/candidate/jobs/$id/apply` + "Lưu" (`BookmarkPlus`), AI reason line (`text-ai`, `Sparkles`).

#### 6f. **NEW** `candidate.jobs.$id.index.tsx` — ref `candidate.jobs.$id.index.tsx` (currently missing)
`grid lg:grid-cols-[1fr_340px] gap-6`: main = header card + "Mô tả công việc" + "Trách nhiệm" (`CheckCircle2` success) + "Yêu cầu" (`CheckCircle2` primary); sidebar (`space-y-4 sticky top-20`) = "AI Match" card (`Sparkles` ai, `AIScoreRing size=120 thickness=10`, "Khá phù hợp với CV của bạn") + CV selector card ("CV đang phân tích", `FileText` "NguyenMinhAnh_Backend.pdf", "Đổi CV") + **`SkillGapCard`** (matched ["Java","REST API","MySQL"], missing ["Spring Boot","Docker"], suggested ["Kubernetes","Microservices"]) + `AIInsightBox` "Đánh giá AI" + buttons "Ứng tuyển ngay" (`size-lg`) + "Lưu việc làm".

#### 6g. `candidate.jobs.$id.apply.tsx` — ref `candidate.jobs.$id.apply.tsx`
Multi-step apply flow using the new **`Stepper`** ui-kit component. Replicate the reference steps, fields, and copy exactly.

#### 6h. `candidate.recommended.tsx` — ref `candidate.recommended.tsx`
`space-y-5 max-w-5xl`: header "Việc làm AI gợi ý cho bạn" / "5 việc phù hợp nhất dựa trên CV, kỹ năng và lịch sử ứng tuyển"; `AIInsightBox` "Vì sao bạn nhận được gợi ý này?" (exact copy with `NguyenMinhAnh_Backend.pdf` / Java, REST API, MySQL); job cards (`card-surface p-5 flex gap-4`) with `AIScoreRing size=64 thickness=6`, title + `Building2`/`MapPin`, "Ứng tuyển" button, reason box (`bg-ai-soft/60 border-ai/20`, `Sparkles` "Lý do gợi ý" + cyclic reason), first 4 skills. Reason strings (5, cyclic) verbatim per reference.

#### 6i. `candidate.settings.tsx` — ref `candidate.settings.tsx`
`max-w-3xl space-y-5`: "Cài đặt"; **Thông báo** card with 3 `Switch` toggles (defaultChecked) — "Email khi có việc mới phù hợp", "Email khi đơn ứng tuyển có cập nhật", "Thông báo bài test mới"; **Bảo mật** card — "Đổi mật khẩu" (outline), "Xoá tài khoản" (outline, `text-danger`).

#### 6j. **NEW** `candidate.assessments.tsx` — ref `candidate.assessments.tsx` (currently missing)
Replicate the reference assessments page (list of `ASSESSMENTS` with type/duration/status/score, `StatusBadge`, action buttons). Required because the dashboard + sidebar link to `/candidate/assessments`.

#### 6k. `candidate.notifications.tsx` — ref `candidate.notifications.tsx`
Replicate the reference notifications page exactly. (Current is a 13-line stub.)

---

### Route reconciliation summary

| Action | Route | Reason |
|--------|-------|--------|
| **Create** | `candidate.jobs.$id.index.tsx` | Reference job-detail page; missing |
| **Create** | `candidate.assessments.tsx` | In reference nav/dashboard; missing |
| **Rewrite** | all `_public.*` and `candidate.*` pages | Stubs → exact reference content |
| **Reconcile** | `candidate.wishlists.tsx` | **Not in reference.** Recommend removing from sidebar nav (to match reference exactly) but keeping the route to back the job "Lưu/Bookmark" save action, OR remove entirely. **Flag for confirmation.** |

`routeTree.gen.ts` regenerates automatically when route files change.

---

## Current behavior

- **Login** is a single centered card (no split panel, no candidate/employer tabs, no demo quick-logins, no gradient visual panel).
- **Landing hero** uses generic copy and no "AI Match Result" job-context card; missing the "Powered by AI Matching Engine" badge and the "Trí tuệ nhân tạo cho mọi bước tuyển dụng" section heading.
- **Applications** render as a card grid, not the reference **table + detail sheet** (no timeline, no HR message box).
- **Candidate job detail** (`/candidate/jobs/$id`) does not exist; no `SkillGapCard`, CV selector, or `AIScoreRing size=120`.
- **Dashboard overview** shows 6 generic metric cards instead of the reference's 4 (profile completion + progress, CVs, assessments, best-match gradient card) and lacks the application-summary + AI-tips two-column block.
- **Settings** does not use `Switch` toggles; **filters** use raw `<select>` instead of the styled `Select`.
- **Sidebar nav** differs in order, labels, and icons, and is missing Assessments + Notifications while including a non-reference Wishlists entry.
- **Container widths** are `max-w-6xl` (public) vs. reference `max-w-7xl`; dashboard `<main>` lacks `max-w-[1600px]`.
- **`.card-surface` / `.ai-gradient` utilities** are not defined; cards use ad-hoc `border border-border bg-card`.
- **Dark mode** toggle exists only in `DashboardLayout`, does **not persist** to `localStorage`, is **absent** on public/auth pages, and reloads cause a flash (no init script).
- **`@smart-cv/ui`** exports only `button/card/input/badge`; `Select/Table/Sheet/Tabs/Switch/Progress/DropdownMenu` are unavailable.
- **`Stepper`** ui-kit component and a shared **`mock-data.ts`** are missing.

---

## Impact scope

- [ ] Backend
- [x] Frontend
- [ ] Database
- [ ] E2E

**Affected files:**

| File | Change |
|------|--------|
| `packages/ui/src/components/ui/{select,table,sheet,tabs,switch,progress,dropdown-menu,label,separator,dialog}.tsx` | **New** — ported from reference |
| `packages/ui/src/index.ts` | Export the new primitives |
| `packages/ui/package.json` | Add Radix deps |
| `apps/web-candidate/index.html` | No-FOUC theme init script (+ optional font preconnect) |
| `apps/web-candidate/src/index.css` | Add `.card-surface` + `.ai-gradient` utilities (tokens already correct) |
| `apps/web-candidate/src/lib/mock-data.ts` | **New** — JOBS/APPLICATIONS/CVS/ASSESSMENTS/COMPANIES/CANDIDATES + `SCORE_COLOR` |
| `apps/web-candidate/src/lib/theme.ts` | **New** — persistent theme toggle helper |
| `apps/web-candidate/src/components/ui-kit/Stepper.tsx` | **New** — ported from reference |
| `apps/web-candidate/src/components/ui-kit/{AIScoreRing,AIInsightBox,StatusBadge,SkillGapCard,EmptyState}.tsx` | Verify exact parity |
| `apps/web-candidate/src/components/layouts/PublicLayout.tsx` | `max-w-7xl`, nav styling, add theme toggle |
| `apps/web-candidate/src/components/layouts/DashboardLayout.tsx` | Exact nav, `DropdownMenu`, persist theme, `max-w-[1600px]` main |
| `apps/web-candidate/src/routes/_public.index.tsx` | Rewrite to reference landing |
| `apps/web-candidate/src/routes/_public.{jobs.index,jobs.$id,about,for-employers,pricing}.tsx` | Rewrite to reference |
| `apps/web-candidate/src/routes/signin.tsx`, `signup.tsx` | Rebuild as reference split-panel login |
| `apps/web-candidate/src/routes/candidate.{index,profile,cv,applications,jobs.index,recommended,settings,notifications}.tsx` | Rewrite to reference |
| `apps/web-candidate/src/routes/candidate.jobs.$id.index.tsx` | **New** |
| `apps/web-candidate/src/routes/candidate.jobs.$id.apply.tsx` | Rewrite with `Stepper` |
| `apps/web-candidate/src/routes/candidate.assessments.tsx` | **New** |
| `apps/web-candidate/src/routes/candidate.wishlists.tsx` | Reconcile (see Route reconciliation) |
| `apps/web-candidate/src/routeTree.gen.ts` | Auto-regenerated |

---

## Related code

| Location | Relevance |
|----------|-----------|
| `cv-smart-ai-main/src/styles.css` | **Reference tokens + `.card-surface`/`.ai-gradient`** (already mirrored in `index.css` tokens) |
| `cv-smart-ai-main/src/components/layouts/{PublicLayout,DashboardLayout}.tsx` | Layout source of truth |
| `cv-smart-ai-main/src/components/ui-kit/*` | ui-kit source of truth (incl. `Stepper.tsx`) |
| `cv-smart-ai-main/src/components/ui/*` | 45 base primitives to port from |
| `cv-smart-ai-main/src/lib/{mock-data,utils}.ts` | Mock data + `SCORE_COLOR` + `cn` |
| `cv-smart-ai-main/src/routes/*` | Per-page source of truth |
| `apps/web-candidate/src/index.css` | Reference palette + `.dark` block already present |
| `apps/web-candidate/src/store/useCandidateStore.ts` | Auth state (`isAuthenticated`, `user`, `signOut`) used by guards and `DashboardLayout` |
| `packages/ui/src/lib/utils.ts` | `cn()` — target for ported components |
| `docs/issues/20260529_redesign_web_candidate_ui.md` | **Superseded** broad redesign issue |
| `docs/issues/20260528_cv_manager_screen.md` | Earlier CV page spec — superseded by reference `candidate.cv.tsx` layout |

---

## Notes

- **This issue supersedes `20260529_redesign_web_candidate_ui.md`.** The scaffolding from that issue is built; this issue closes the gap to exact fidelity and adds dark mode.
- **The reference is the authoritative spec.** Any detail not spelled out here must be copied verbatim from the corresponding reference file. "Must not differ from the original" is the acceptance bar.
- **Dark mode is an addition** the reference does not have. Light = navy primary (exact match); dark = `#2563EB` brand-blue primary (per confirmed decision; already encoded in the `.dark` tokens). Audit and theme-adjust the reference's hardcoded light-only values (`bg-blue-50`, `bg-black/25`, `white/10` overlays).
- **Single intentional layout deviation:** the dashboard omits the reference's role switcher because web-candidate is candidate-only.
- **No API integration** — all data is mock/static.
- **No test runner** is configured (`CLAUDE.md`).
- After adding/renaming routes, run `pnpm -F web-candidate dev` once to regenerate `routeTree.gen.ts`.
- After editing `packages/ui`, run `pnpm install` (new Radix deps) and verify all three apps still build (`pnpm build`).
