# [Feature] Full UI Redesign of web-candidate to Match Reference Design

> **⚠️ SUPERSEDED by [`20260529_web_candidate_design_fidelity_and_dark_mode.md`](./20260529_web_candidate_design_fidelity_and_dark_mode.md).**
> The scaffolding described here (design tokens, route restructuring, layout/ui-kit components) has been implemented. The follow-up issue covers exact pixel fidelity to the reference plus a net-new dark mode. Refer to that issue for current work.

## Overview

Replace the current dark-navy/glass-morphism design of `apps/web-candidate` with the design language used in the reference project (`cv-smart-ai-main`). This covers:

1. **Design tokens** — adopt the reference's Tailwind v4 CSS variable palette for both light and dark themes, plus the Plus Jakarta Sans font.
2. **Route restructuring** — split flat routes into `_public.*` (public layout) and `candidate.*` (dashboard layout) groups.
3. **New layout components** — `PublicLayout.tsx` and `DashboardLayout.tsx`.
4. **New shared UI-kit components** — `AIScoreRing`, `AIInsightBox`, `StatusBadge`, `SkillGapCard`, `EmptyState`.
5. **Page-by-page visual redesign** — every existing page rebuilt to the reference's card-surface, navy-primary, light-background design.

---

## Reproduction steps

N/A — this is a full visual redesign. Current state:

1. Run `pnpm -F web-candidate dev`.
2. Open `http://localhost:3000` — dark navy background, yellow accent, glass-morphism cards.
3. Open any page (landing, signin, profile, applications, job detail).

Expected result after this issue is implemented: all pages match the reference visual style described below.

---

## Expected behavior

### 1. Design token migration (`apps/web-candidate/src/index.css`)

Replace all current CSS variables with the reference palette. The root `:root` block must define:

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

:root {
  --radius: 0.75rem;

  /* Core */
  --background: oklch(0.985 0.005 247);   /* #F8FAFC */
  --foreground: oklch(0.18 0.04 265);     /* #0F172A */
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.18 0.04 265);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.18 0.04 265);

  --primary: oklch(0.33 0.13 265);        /* #1E3A8A navy */
  --primary-foreground: oklch(0.99 0 0);

  --secondary: oklch(0.965 0.01 250);
  --secondary-foreground: oklch(0.25 0.07 265);

  --muted: oklch(0.965 0.01 250);
  --muted-foreground: oklch(0.55 0.03 257); /* #64748B */

  --accent: oklch(0.95 0.02 260);
  --accent-foreground: oklch(0.25 0.07 265);

  --destructive: oklch(0.58 0.22 27);     /* #DC2626 */
  --destructive-foreground: oklch(0.99 0 0);

  --border: oklch(0.92 0.012 255);        /* #E2E8F0 */
  --input: oklch(0.92 0.012 255);
  --ring: oklch(0.55 0.18 265);

  --sidebar: oklch(1 0 0);
  --sidebar-foreground: oklch(0.18 0.04 265);
  --sidebar-primary: oklch(0.33 0.13 265);
  --sidebar-primary-foreground: oklch(0.99 0 0);
  --sidebar-accent: oklch(0.965 0.01 250);
  --sidebar-accent-foreground: oklch(0.25 0.07 265);
  --sidebar-border: oklch(0.92 0.012 255);
  --sidebar-ring: oklch(0.55 0.18 265);

  /* Brand / semantic */
  --brand: oklch(0.33 0.13 265);
  --brand-foreground: oklch(0.99 0 0);
  --brand-blue: oklch(0.55 0.2 263);      /* #2563EB */
  --ai: oklch(0.51 0.25 295);             /* #7C3AED */
  --ai-foreground: oklch(0.99 0 0);
  --ai-soft: oklch(0.95 0.04 295);        /* #F3E8FF */
  --success: oklch(0.62 0.17 145);        /* #16A34A */
  --success-soft: oklch(0.95 0.07 145);   /* #DCFCE7 */
  --warning: oklch(0.78 0.16 75);         /* #F59E0B */
  --warning-soft: oklch(0.96 0.07 90);    /* #FEF3C7 */
  --danger: oklch(0.58 0.22 27);          /* #DC2626 */
  --danger-soft: oklch(0.95 0.04 25);     /* #FEE2E2 */
}

.dark {
  --background: oklch(0.12 0.03 265);
  --foreground: oklch(0.95 0.01 255);
  --card: oklch(0.17 0.03 265);
  --card-foreground: oklch(0.95 0.01 255);
  --popover: oklch(0.17 0.03 265);
  --popover-foreground: oklch(0.95 0.01 255);

  --primary: oklch(0.55 0.2 263);         /* brand-blue as primary in dark */
  --primary-foreground: oklch(0.99 0 0);

  --secondary: oklch(0.22 0.03 265);
  --secondary-foreground: oklch(0.85 0.01 255);

  --muted: oklch(0.22 0.03 265);
  --muted-foreground: oklch(0.60 0.03 257);

  --accent: oklch(0.22 0.03 265);
  --accent-foreground: oklch(0.85 0.01 255);

  --destructive: oklch(0.62 0.22 27);
  --destructive-foreground: oklch(0.99 0 0);

  --border: oklch(0.25 0.03 265);
  --input: oklch(0.25 0.03 265);
  --ring: oklch(0.55 0.2 263);

  --sidebar: oklch(0.15 0.03 265);
  --sidebar-foreground: oklch(0.90 0.01 255);
  --sidebar-primary: oklch(0.55 0.2 263);
  --sidebar-primary-foreground: oklch(0.99 0 0);
  --sidebar-accent: oklch(0.22 0.03 265);
  --sidebar-accent-foreground: oklch(0.85 0.01 255);
  --sidebar-border: oklch(0.25 0.03 265);
  --sidebar-ring: oklch(0.55 0.2 263);

  --ai-soft: oklch(0.22 0.06 295);
  --success-soft: oklch(0.20 0.06 145);
  --warning-soft: oklch(0.22 0.06 75);
  --danger-soft: oklch(0.22 0.06 27);
}
```

Font registration in `@theme inline`:
```css
--font-sans: "Plus Jakarta Sans", "Inter", ui-sans-serif, system-ui, sans-serif;
```

Remove all existing custom `.theme-*` utility classes and glass-morphism gradient helpers from `index.css`.

---

### 2. Route restructuring

**Current flat structure → new grouped structure:**

```
routes/
  _public.tsx              ← new: PublicLayout wrapper
  _public.index.tsx        ← renamed from index.tsx
  _public.jobs.index.tsx   ← new: public job search
  _public.jobs.$id.tsx     ← renamed from jobs/$jobId.tsx
  _public.about.tsx        ← renamed from about.tsx
  _public.for-employers.tsx ← new: employer marketing page
  _public.pricing.tsx      ← new: pricing page
  signin.tsx               ← keep at root (no layout wrapper)
  signup.tsx               ← keep at root (no layout wrapper)
  candidate.tsx            ← new: DashboardLayout wrapper
  candidate.index.tsx      ← new: candidate overview dashboard
  candidate.jobs.index.tsx ← moved from public jobs (with auth)
  candidate.jobs.$id.apply.tsx ← new: application flow
  candidate.profile.tsx    ← renamed from profile.tsx
  candidate.applications.tsx ← renamed from applications.tsx
  candidate.cv.tsx         ← renamed from cv-manager.tsx
  candidate.wishlists.tsx  ← renamed from wishlists.tsx
  candidate.recommended.tsx ← renamed from job-suggestions.tsx
  candidate.settings.tsx   ← renamed from settings.tsx
  candidate.notifications.tsx ← new
```

The `routeTree.gen.ts` is regenerated automatically by the Vite plugin when files are created/renamed.

---

### 3. New layout components

#### `apps/web-candidate/src/components/layouts/PublicLayout.tsx`

Sticky header (height 64px, `bg-card/80 backdrop-blur border-b`) containing:
- **Logo**: `size-8` rounded navy square with `<Sparkles>` icon + "SmartCV" bold text
- **Nav** (hidden on mobile): Tìm việc → `/jobs`, Dành cho nhà tuyển dụng → `/for-employers`, Bảng giá → `/pricing`, Về chúng tôi → `/about`
  - Active state: `text-primary font-medium`; inactive: `text-muted-foreground hover:text-foreground`
- **CTA buttons**: "Đăng nhập" (`variant="ghost" size="sm"` → `/signin`) + "Bắt đầu ngay" (`size="sm"` → `/signup`)

Footer (4-column `md:grid-cols-4`, `bg-card border-t`):
- Column 1: Logo + tagline "Nền tảng tuyển dụng ứng dụng AI hàng đầu Việt Nam."
- Column 2: Sản phẩm — Tìm việc, Gợi ý AI, Đánh giá CV, Bài kiểm tra
- Column 3: Nhà tuyển dụng — Đăng tin, AI Screening, ATS Board, CV Database
- Column 4: Hỗ trợ — Trung tâm trợ giúp, Liên hệ, Điều khoản, Chính sách
- Bottom bar: `© 2026 SmartCV. All rights reserved.`

#### `apps/web-candidate/src/components/layouts/DashboardLayout.tsx`

Left sidebar (sticky, `h-screen`, transition between `w-64` expanded / `w-16` collapsed):
- Logo at top (same as public header)
- Nav items: icon + label, `bg-primary text-primary-foreground` on active, `hover:bg-sidebar-accent` on inactive
- Collapse/expand button at bottom: "← Thu gọn" / "→"
- `bg-sidebar border-r border-sidebar-border`

Top bar (sticky, height 64px, `bg-card border-b`):
- Search input (left, max-width 384px) with `<Search>` icon
- Right cluster:
  - Theme toggle (dark/light)
  - Language switcher (EN/VI) — keep from current `__root.tsx`
  - Bell icon with red dot for notifications
  - User avatar chip → dropdown (Hồ sơ, Cài đặt, separator, Đăng xuất)

Candidate nav items:
```
{ to: "/candidate",           label: "Tổng quan",       icon: LayoutDashboard }
{ to: "/candidate/jobs",      label: "Tìm việc",        icon: Search }
{ to: "/candidate/applications", label: "Đơn ứng tuyển", icon: FileText }
{ to: "/candidate/cv",        label: "Quản lý CV",      icon: FileDown }
{ to: "/candidate/recommended", label: "Gợi ý việc",   icon: Sparkles }
{ to: "/candidate/wishlists", label: "Đã lưu",          icon: Bookmark }
{ to: "/candidate/profile",   label: "Hồ sơ",           icon: User }
{ to: "/candidate/settings",  label: "Cài đặt",         icon: Settings }
```

---

### 4. New UI-kit components

Create in `apps/web-candidate/src/components/ui-kit/`:

#### `AIScoreRing.tsx`

SVG circular progress (0–100%). Props: `score: number`, `size?: number` (default 80), `thickness?: number` (default 8), `label?: string`.

Color logic:
- `score >= 70` → `var(--color-success)`
- `score >= 50` → `var(--color-warning)`
- `score < 50` → `var(--color-danger)`

Score shown in center (`text-lg font-bold`). Optional label below in `text-xs text-muted-foreground`.

Full implementation (copy from reference `AIScoreRing.tsx`):
```tsx
import { cn } from "@smart-cv/ui";

const SCORE_COLOR = (s: number) => s >= 70 ? "success" : s >= 50 ? "warning" : "danger";

export function AIScoreRing({ score, size = 80, thickness = 8, label }: Props) {
  const radius = (size - thickness) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const colorVar = SCORE_COLOR(score) === "success"
    ? "var(--color-success)"
    : SCORE_COLOR(score) === "warning" ? "var(--color-warning)" : "var(--color-danger)";
  return (
    <div className="inline-flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} stroke="var(--color-border)"
            strokeWidth={thickness} fill="none" />
          <circle cx={size/2} cy={size/2} r={radius} stroke={colorVar}
            strokeWidth={thickness} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset} fill="none"
            style={{ transition: "stroke-dashoffset 600ms ease" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center" style={{ color: colorVar }}>
          <span className="text-lg font-bold leading-none">{score}%</span>
        </div>
      </div>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </div>
  );
}
```

#### `AIInsightBox.tsx`

Light purple container (`bg-ai-soft/60 border-ai/20 rounded-xl p-4`) with Sparkles icon header and body slot.

```tsx
export function AIInsightBox({ title = "AI Insight", children, className }: Props) {
  return (
    <div className={cn("rounded-xl border border-ai/20 bg-ai-soft/60 p-4", className)}>
      <div className="mb-2 flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-ai text-ai-foreground">
          <Sparkles className="size-4" />
        </div>
        <span className="text-sm font-semibold text-ai">{title}</span>
      </div>
      <div className="text-sm text-foreground/80 leading-relaxed">{children}</div>
    </div>
  );
}
```

#### `StatusBadge.tsx`

Inline pill badge with a colored dot + label. Status-to-tone map:

| Status | Tone |
|--------|------|
| Qualified, Accepted, Offer Sent | success |
| Under Review, Pending Review | warning |
| Interview Scheduled, Interviewed | info (brand-blue) |
| Not Qualified, Rejected | danger |
| Draft, Closed | muted |

CSS classes by tone:
- `success`: `bg-success-soft text-success border-success/20`
- `warning`: `bg-warning-soft text-warning border-warning/20`
- `danger`: `bg-danger-soft text-danger border-danger/20`
- `info`: `bg-blue-50 text-brand-blue border-brand-blue/20`
- `muted`: `bg-muted text-muted-foreground border-border`
- `ai`: `bg-ai-soft text-ai border-ai/20`

#### `SkillGapCard.tsx`

Compact card showing three skill lists: matched (green check), missing (red X), suggested (plus). Props: `matched: string[]`, `missing: string[]`, `suggested?: string[]`.

#### `EmptyState.tsx`

Centered placeholder: icon slot, title (`text-base font-medium`), description (`text-sm text-muted-foreground`), optional CTA button. Used for empty job lists, empty applications, etc.

---

### 5. Page-by-page redesign

#### 5a. Landing page (`_public.index.tsx`)

**Hero section** (two-column on `lg:`, full-width on mobile):
- Left column:
  - "AI Matching" chip badge (`bg-ai-soft text-ai text-xs rounded-full px-3 py-1`)
  - H1: "Tìm việc tốt hơn và tuyển dụng thông minh hơn với AI" (`text-4xl md:text-5xl font-extrabold`)
  - Sub-text: "Nền tảng kết nối ứng viên và nhà tuyển dụng với công nghệ AI"
  - CTA row: "Tìm việc ngay" (`size="lg"` primary) + "Dành cho nhà tuyển dụng" (`size="lg" variant="outline"`)
  - Stats row: 50,000+ việc làm · 200+ công ty
- Right column:
  - Mock "AI Match Result" card (`bg-card border rounded-2xl p-5 shadow-lg`):
    - `AIScoreRing score={82} size={96}` + label "Điểm phù hợp"
    - Matched skills: React, TypeScript, Node.js (green check badges)
    - Missing skills: Docker, AWS (red X badges)
    - "Xem chi tiết" button (`variant="outline" size="sm"`)

**Search bar** (below hero, `bg-card border rounded-2xl p-4 shadow-sm`):
- 4 inputs in a row on `lg:` (1-col on mobile): Vị trí / Kỹ năng, Địa điểm, Loại công việc (Select), Mức lương (Select)
- "Tìm kiếm" button (primary, full-width on mobile)

**AI Features** (3-column grid, `md:grid-cols-3`):
- Card 1: Brain icon (purple) — "AI Job Matching" — Phân tích hồ sơ và gợi ý việc làm phù hợp nhất
- Card 2: Zap icon (blue) — "Auto Screening" — Lọc ứng viên tự động, tiết kiệm 80% thời gian
- Card 3: Target icon (green) — "Smart Recommendations" — Gợi ý cải thiện CV theo yêu cầu

**Featured Jobs** (3-column grid, `md:grid-cols-3`):
- Section header: "Việc làm nổi bật" + "Xem tất cả →"
- 6 job cards (mock data), each showing:
  - Company logo placeholder (initials, `bg-primary/10 text-primary rounded-lg size-10`)
  - Job title, company name, location
  - Salary range
  - Skills badges (up to 3, `bg-secondary text-secondary-foreground text-xs rounded-md px-2 py-0.5`)
  - `AIScoreRing score={…} size={48}` in top-right corner
  - "Ứng tuyển" button (`variant="outline" size="sm"`)

**Employer CTA** (full-width, `bg-primary` gradient to `brand-blue`, white text):
- Left: H2 "Tuyển dụng thông minh hơn với AI", 4 bullet points (80% time savings, ATS Kanban, AI screening, AI interview questions)
- Right: mock "AI Screening Summary" box (dark card): Tự động đủ điều kiện: 12, Cần xem xét: 8, Không phù hợp: 5
- CTA: "Đăng tuyển dụng ngay" (`bg-white text-primary`)

Remove from current home page: Stats cards section, Popular categories, Top companies spotlight, Salary insights, Career momentum, Testimonials, "How SmartCV works", Career resources/blog hub, FAQ.

#### 5b. Authentication pages (`signin.tsx`, `signup.tsx`)

Replace current split-panel with a centered single-card layout:
- `min-h-screen bg-background flex items-center justify-center p-4`
- Card: `w-full max-w-md bg-card border rounded-2xl p-8 shadow-sm`
- Logo at top-center
- Form title + sub-text
- Form fields (standard `Input` components with labels)
- Primary submit button (full-width)
- Footer link to other auth page
- Remove: animation classes (`auth-swap-*`), feature list panel, gradient background

#### 5c. Job detail (`_public.jobs.$id.tsx`)

Keep two-column layout but apply new tokens:
- Remove dark glass card, use `bg-card border rounded-2xl`
- Add `AIScoreRing score={…} size={80}` + `AIInsightBox` in sidebar
- `StatusBadge` for job status (Active/Closed)
- Breadcrumb: `text-muted-foreground text-sm`
- All backgrounds → `bg-background` / `bg-card`

#### 5d. Candidate dashboard overview (`candidate.index.tsx`) — new page

6-column metric cards (3-col on `md:`, 2-col on `sm:`):
- Đơn ứng tuyển (count: 12, icon: FileText, primary)
- Đã lưu (count: 8, icon: Bookmark, warning)
- Điểm hồ sơ (87%, icon: TrendingUp, success)
- Việc phù hợp (24, icon: Sparkles, ai)
- Lượt xem (156, icon: Eye, muted)
- Phỏng vấn sắp tới (2, icon: Calendar, info)

Recent applications table (last 5):
- Company, title, applied date, `AIScoreRing size={40}`, `StatusBadge`

`AIInsightBox` below with text "Hồ sơ của bạn phù hợp 78% với 24 vị trí đang tuyển."

#### 5e. Profile (`candidate.profile.tsx`)

Clean card-surface layout:
- Page header: "Hồ sơ của tôi" + "Chỉnh sửa" button
- Personal info card (avatar initials + name/title/location)
- Work experience cards with `card-surface` pattern
- Education cards
- Skills section with `SkillGapCard` (matched/missing from a target job)
- CV upload section (same dashed-border upload area as current)

Remove: sticky sidebar with stats, glass card backgrounds.

#### 5f. Applications (`candidate.applications.tsx`)

Replace current filter chips and card grid:
- Search input + status filter (use `<Select>` instead of custom chips)
- Job cards in `md:grid-cols-2 lg:grid-cols-3` with:
  - Company initials avatar
  - Title, salary, location, skills
  - `AIScoreRing score={…} size={48}`
  - `StatusBadge status={…}` (replaces custom colored badges)
  - Applied date

Remove: custom `inline-flex` colored status spans — fully replaced by `StatusBadge`.

#### 5g. CV Manager (`candidate.cv.tsx`)

Already specified in `20260528_cv_manager_screen.md`. Apply new tokens:
- Replace `border-white/10` and `bg-[#1f2833]` references with `border-border` and `bg-card`
- Upload area: `border-2 border-dashed border-border rounded-xl` (same as existing spec, tokens already correct)
- CV cards: `bg-card border-border` (no dark override needed with new tokens)

#### 5h. Wishlists (`candidate.wishlists.tsx`)

Saved job cards in 3-column grid:
- Same card structure as featured jobs on landing page
- Add `AIScoreRing` per card
- Empty state: `EmptyState icon={Bookmark} title="Chưa lưu việc nào" description="Nhấn biểu tượng tim trên các việc làm để lưu lại"`

#### 5i. Job Suggestions / Recommended (`candidate.recommended.tsx`)

AI-curated job grid with `AIInsightBox` at top explaining match rationale + job cards with `AIScoreRing`.

#### 5j. Settings (`candidate.settings.tsx`)

Card-surface grouped sections (Account, Notifications, Privacy, Danger Zone):
- `bg-card border rounded-2xl p-6`
- Each setting row: label + description (left) + control (right)

---

### 6. Tailwind CSS variable registration

In `apps/web-candidate`'s Tailwind config (or `index.css`'s `@theme inline` block), register the new tokens so Tailwind classes like `bg-ai-soft`, `text-ai`, `border-success/20` work:

```css
@theme inline {
  --color-brand-blue: var(--brand-blue);
  --color-ai: var(--ai);
  --color-ai-foreground: var(--ai-foreground);
  --color-ai-soft: var(--ai-soft);
  --color-success: var(--success);
  --color-success-soft: var(--success-soft);
  --color-warning: var(--warning);
  --color-warning-soft: var(--warning-soft);
  --color-danger: var(--danger);
  --color-danger-soft: var(--danger-soft);
  --font-sans: "Plus Jakarta Sans", "Inter", ui-sans-serif, system-ui, sans-serif;
}
```

---

## Current behavior

- All pages use a dark navy/glass-morphism theme (`#111844`, `#1f2833` backgrounds).
- No AI match score visualization exists.
- Authenticated pages use the same flat header/footer nav as public pages (no dashboard sidebar).
- Font is not Plus Jakarta Sans.
- CSS variables use a dark-first scheme inconsistent with the reference light palette.

---

## Impact scope

- [ ] Backend
- [x] Frontend
- [ ] Database
- [ ] E2E

**Affected files:**

| File | Change |
|------|--------|
| `apps/web-candidate/src/index.css` | Full CSS variable replacement + font import |
| `apps/web-candidate/src/routes/__root.tsx` | Replace with thin router root (no layout) |
| `apps/web-candidate/src/routes/_public.tsx` | **New** — `PublicLayout` wrapper |
| `apps/web-candidate/src/routes/_public.index.tsx` | **New** — redesigned landing page |
| `apps/web-candidate/src/routes/_public.jobs.index.tsx` | **New** — public job search |
| `apps/web-candidate/src/routes/_public.jobs.$id.tsx` | **New** — job detail (from `jobs/$jobId.tsx`) |
| `apps/web-candidate/src/routes/_public.about.tsx` | Rename + restyle |
| `apps/web-candidate/src/routes/signin.tsx` | Redesign auth form |
| `apps/web-candidate/src/routes/signup.tsx` | Redesign auth form |
| `apps/web-candidate/src/routes/candidate.tsx` | **New** — `DashboardLayout` wrapper |
| `apps/web-candidate/src/routes/candidate.index.tsx` | **New** — dashboard overview |
| `apps/web-candidate/src/routes/candidate.profile.tsx` | Redesign (from `profile.tsx`) |
| `apps/web-candidate/src/routes/candidate.applications.tsx` | Redesign (from `applications.tsx`) |
| `apps/web-candidate/src/routes/candidate.cv.tsx` | Restyle (from `cv-manager.tsx`) |
| `apps/web-candidate/src/routes/candidate.wishlists.tsx` | Redesign (from `wishlists.tsx`) |
| `apps/web-candidate/src/routes/candidate.recommended.tsx` | Redesign (from `job-suggestions.tsx`) |
| `apps/web-candidate/src/routes/candidate.settings.tsx` | Redesign (from `settings.tsx`) |
| `apps/web-candidate/src/components/layouts/PublicLayout.tsx` | **New** |
| `apps/web-candidate/src/components/layouts/DashboardLayout.tsx` | **New** |
| `apps/web-candidate/src/components/ui-kit/AIScoreRing.tsx` | **New** |
| `apps/web-candidate/src/components/ui-kit/AIInsightBox.tsx` | **New** |
| `apps/web-candidate/src/components/ui-kit/StatusBadge.tsx` | **New** |
| `apps/web-candidate/src/components/ui-kit/SkillGapCard.tsx` | **New** |
| `apps/web-candidate/src/components/ui-kit/EmptyState.tsx` | **New** |
| `apps/web-candidate/src/routeTree.gen.ts` | Auto-regenerated on file changes |

---

## Related code

| Location | Relevance |
|----------|-----------|
| `apps/web-candidate/src/routes/__root.tsx` | Current root — language switcher and theme toggle logic must be preserved in `DashboardLayout` topbar |
| `apps/web-candidate/src/store/useCandidateStore.ts` | Auth state (`isAuthenticated`) drives route guards in `candidate.tsx` `beforeLoad` |
| `apps/web-candidate/src/index.css` | Current dark-first CSS vars to be fully replaced |
| `packages/ui/src/globals.css` | Shared token definitions — ensure no conflicts with new web-candidate tokens |
| `cv-smart-ai-main/src/styles.css` | **Reference** — exact CSS variable values (lines 1–120) |
| `cv-smart-ai-main/src/components/layouts/PublicLayout.tsx` | **Reference** — exact header/footer markup |
| `cv-smart-ai-main/src/components/layouts/DashboardLayout.tsx` | **Reference** — exact sidebar/topbar markup |
| `cv-smart-ai-main/src/components/ui-kit/AIScoreRing.tsx` | **Reference** — copy as-is, adapt imports |
| `cv-smart-ai-main/src/components/ui-kit/AIInsightBox.tsx` | **Reference** — copy as-is, adapt imports |
| `cv-smart-ai-main/src/components/ui-kit/StatusBadge.tsx` | **Reference** — copy as-is, adapt imports |
| `cv-smart-ai-main/src/routes/_public.index.tsx` | **Reference** — landing page sections |
| `docs/issues/20260528_cv_manager_screen.md` | Prior issue for CV Manager — the `candidate.cv.tsx` page; token references now use new palette |

---

## Notes

- **Incremental implementation order** (to minimize broken states):
  1. CSS tokens (`index.css`) — all pages immediately adopt new palette
  2. UI-kit components — prerequisites for page redesigns
  3. Layout components (`PublicLayout`, `DashboardLayout`)
  4. Route restructuring — rename files, add wrappers
  5. Page redesigns — one page at a time, starting with landing
- **No API changes** — all data stays as mock/static; only visual layer changes.
- **routeTree.gen.ts** regenerates automatically when route files are added/renamed; run `pnpm -F web-candidate dev` after any route file change.
- **Existing i18n keys** remain valid; no key renames required. New pages may add keys following the `web-candidate` namespace.
- **Dark theme** is derived from the reference palette (not the current dark), so the theme toggle will produce a coherent dark variant of the new light design rather than reverting to the old navy glass-morphism style.
- The reference project path (`/home/chuongpl/projects/cv-smart-ai-main/cv-smart-ai-main`) is available as a local read-only reference throughout implementation.
