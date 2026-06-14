# [Feature] Implement /wishlists, /job-suggestions, and /applications Screens

## Overview

Replace the three "Coming soon" placeholder pages with fully rendered, static-data prototype screens. All three pages are already guarded by auth redirects and registered in the route tree — only the component bodies need to be replaced.

Each page shares:
- `max-w-6xl mx-auto px-4 md:px-6 py-8` outer container (matches homepage and job detail)
- A **page header** with title + subtitle count
- A **filter bar**: static search input + filter chips (no actual filtering logic — prototype only)
- A **job card grid**: `grid gap-4 md:grid-cols-2 lg:grid-cols-3`
- An **empty state** (used only when `filterChips` selection conceptually yields nothing — always rendered in the prototype using all mock data)
- Auth guard: already in place via `beforeLoad` in each file

---

## Reproduction steps

N/A — greenfield replacement. Entry paths:
1. Sign in and open the account dropdown from the header
2. Click **Wishlists**, **Job Suggestions**, or **Applied Jobs**

---

## Expected behavior

### Shared job card shape

All three pages use a card modelled on the homepage job card (`index.tsx` lines 236–259), adapted with per-page extra fields. Base card:

```
┌──────────────────────────────────────────────┐
│  [Logo]  Job Title                           │
│          Company Name                        │
│  💰 Salary    📍 Location                    │
│  [Skill] [Skill] [Skill]                     │
│  ─────────────────────────────────────────   │
│  🕐 Posted X days ago    [Page-specific CTA] │
└──────────────────────────────────────────────┘
```

Card container: `rounded-2xl border border-white/10 bg-[#1f2833]/95 p-5` (matches homepage — uses the same hardcoded dark-theme classes that get overridden by `body.theme-light` rules in `index.css`).

---

### Page 1: `/wishlists` — Saved Jobs

**Route file**: `apps/web-candidate/src/routes/wishlists.tsx`

**Page header**:
```
Danh sách yêu thích
6 việc làm đã lưu
```
- Title: `text-2xl font-bold theme-text-main`
- Subtitle count: `text-sm text-muted-foreground mt-1`

**Filter bar** (static, decorative only):
- Search input: `<Input placeholder="Tìm trong danh sách..." />`, `max-w-sm`
- Filter chips (single `useState` for selected chip, no actual filtering):
  `["Tất cả", "Công nghệ", "Thiết kế", "Marketing"]`
  Active chip: `bg-primary text-primary-foreground rounded-full px-4 py-1.5 text-sm`
  Inactive chip: `border border-border text-foreground rounded-full px-4 py-1.5 text-sm hover:bg-muted/50`

**Mock data** (6 items, define inline in the file):

```ts
interface WishlistJob {
  id: string
  title: string
  company: string
  initials: string
  salary: string
  location: string
  skills: string[]
  postedAt: string
  savedAt: string   // display label, e.g. "Lưu 3 ngày trước"
}
```

| id | title | company | salary | location | skills | savedAt |
|----|-------|---------|--------|----------|--------|---------|
| `senior-nodejs` | Senior Node.js Backend Developer | NexusTech Solutions | $2,500 – $3,500 | TP. HCM (Hybrid) | Node.js, TypeScript, AWS | Lưu 1 ngày trước |
| `frontend-react-nextjs` | Frontend Engineer (React + Next.js) | Nova Product Studio | $2,000 – $2,800 | Hà Nội (Onsite) | React, Next.js, Tailwind | Lưu 2 ngày trước |
| `devops-aws-kubernetes` | DevOps Engineer (AWS/Kubernetes) | CloudBridge Tech | $2,700 – $3,600 | Remote (VN) | Kubernetes, Terraform, AWS | Lưu 3 ngày trước |
| `mobile-react-native` | Mobile Engineer (React Native) | BluePixel Ventures | $1,900 – $2,700 | TP. HCM (Hybrid) | React Native, TypeScript | Lưu 5 ngày trước |
| `data-engineer-python-spark` | Data Engineer (Python/Spark) | DataNova Analytics | $2,300 – $3,200 | Hà Nội (Hybrid) | Python, Spark, BigQuery | Lưu 1 tuần trước |
| `product-designer-ux-ui` | Product Designer (UX/UI) | PixelCraft Studio | $1,600 – $2,400 | Đà Nẵng (Onsite) | Figma, Design System | Lưu 1 tuần trước |

**Card extras** (right side of the card footer row):
- A **filled heart button** (saved state). Clicking removes the job from the list (remove from local `useState` array — the list shrinks live).
- `savedAt` label shown in place of the "posted" timestamp.
- CTA: heart button only (no "Quick Apply").

**Empty state** (shown when all items are removed via the heart button):
```
┌──────────────────────────────────────────────┐
│              ♡  (large icon)                 │
│    Chưa có việc làm nào được lưu             │
│    [Browse Jobs]                             │
└──────────────────────────────────────────────┘
```
`flex flex-col items-center gap-4 py-24 text-muted-foreground`

---

### Page 2: `/job-suggestions` — Job Suggestions

**Route file**: `apps/web-candidate/src/routes/job-suggestions.tsx`

**Page header**:
```
Gợi ý việc làm
Dựa trên hồ sơ và kỹ năng của bạn
```

**Filter bar** (static):
- Search input: `<Input placeholder="Lọc gợi ý..." />`, `max-w-sm`
- Skill-based filter chips (reflect `mockUser.title = 'Frontend Engineer'`):
  `["Tất cả", "React", "TypeScript", "Next.js", "Node.js"]`
  Same chip style as wishlists.

**Mock data** (6 items):

```ts
interface SuggestedJob {
  id: string
  title: string
  company: string
  initials: string
  salary: string
  location: string
  skills: string[]
  postedAt: string
  matchReason: string   // e.g. "Phù hợp với kỹ năng React của bạn"
  matchScore: number    // 70–98, shown as "98% phù hợp"
}
```

| id | title | company | salary | location | matchReason | matchScore |
|----|-------|---------|--------|----------|-------------|------------|
| `frontend-react-nextjs` | Frontend Engineer (React + Next.js) | Nova Product Studio | $2,000 – $2,800 | Hà Nội (Onsite) | Phù hợp với kỹ năng React, Next.js | 98 |
| `senior-nodejs` | Senior Node.js Backend Developer | NexusTech Solutions | $2,500 – $3,500 | TP. HCM (Hybrid) | Phù hợp với kỹ năng TypeScript | 85 |
| `fullstack-python-react` | Fullstack Developer (Python/React) | Skyline Labs | $2,200 – $3,000 | Đà Nẵng (Remote) | Bao gồm React trong tech stack | 80 |
| `engineering-manager` | Engineering Manager | ScaleOne Labs | $4,000 – $5,500 | Remote (APAC) | Phù hợp với lộ trình sự nghiệp | 74 |
| `mobile-react-native` | Mobile Engineer (React Native) | BluePixel Ventures | $1,900 – $2,700 | TP. HCM (Hybrid) | Phù hợp với kỹ năng React Native | 72 |
| `product-designer-ux-ui` | Product Designer (UX/UI) | PixelCraft Studio | $1,600 – $2,400 | Đà Nẵng (Onsite) | Liên quan đến công việc hiện tại | 70 |

**Card extras** (added to base card):
- **Match score badge** in the top-right corner of the card: `rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary` → "98% phù hợp"
- **Match reason tag** below the skills row: `text-xs text-muted-foreground inline-flex items-center gap-1` with a `Sparkles` icon
- CTA button: `<Button size="sm">Ứng tuyển ngay</Button>` (static, no action)

---

### Page 3: `/applications` — Applied Jobs

**Route file**: `apps/web-candidate/src/routes/applications.tsx`

**Page header**:
```
Việc đã ứng tuyển
5 đơn ứng tuyển
```

**Filter bar** (static):
- Search input: `<Input placeholder="Tìm việc đã ứng tuyển..." />`, `max-w-sm`
- Status filter chips:
  `["Tất cả", "Đang xử lý", "Phỏng vấn", "Từ chối"]`
  Same chip style as other pages.

**Mock data** (5 items):

```ts
type ApplicationStatus = 'applied' | 'under_review' | 'interview' | 'rejected' | 'offer'

interface AppliedJob {
  id: string
  title: string
  company: string
  initials: string
  salary: string
  location: string
  skills: string[]
  appliedAt: string     // display label, e.g. "Ứng tuyển 3 ngày trước"
  status: ApplicationStatus
}
```

**Status badge styles** (rendered as `<span className="rounded-full px-2.5 py-1 text-xs font-medium">`):

| Status value | Label | Badge classes |
|---|---|---|
| `applied` | Đã ứng tuyển | `bg-secondary text-secondary-foreground` |
| `under_review` | Đang xem xét | `bg-primary/15 text-primary` |
| `interview` | Phỏng vấn | `bg-purple-500/10 text-purple-600` |
| `rejected` | Không phù hợp | `bg-destructive/10 text-destructive` |
| `offer` | Nhận offer | `bg-green-500/10 text-green-700` |

Mock applications:

| id | title | company | salary | location | status | appliedAt |
|----|-------|---------|--------|----------|--------|-----------|
| `frontend-react-nextjs` | Frontend Engineer (React + Next.js) | Nova Product Studio | $2,000 – $2,800 | Hà Nội | `offer` | Ứng tuyển 2 tuần trước |
| `senior-nodejs` | Senior Node.js Backend Developer | NexusTech Solutions | $2,500 – $3,500 | TP. HCM | `interview` | Ứng tuyển 1 tuần trước |
| `devops-aws-kubernetes` | DevOps Engineer (AWS/Kubernetes) | CloudBridge Tech | $2,700 – $3,600 | Remote | `under_review` | Ứng tuyển 5 ngày trước |
| `fullstack-python-react` | Fullstack Developer (Python/React) | Skyline Labs | $2,200 – $3,000 | Đà Nẵng | `rejected` | Ứng tuyển 3 tuần trước |
| `mobile-react-native` | Mobile Engineer (React Native) | BluePixel Ventures | $1,900 – $2,700 | TP. HCM | `applied` | Ứng tuyển 2 ngày trước |

**Card extras**:
- **Status badge** is placed prominently in the top-right corner of the card header (next to the bookmark area, replacing the ghost button).
- **Applied date** replaces "posted X ago" in the footer.
- No CTA button — replace "Quick Apply" with a `<Link to="/jobs/$jobId">` → `<Button size="sm" variant="outline">Xem chi tiết</Button>` (navigates to the job detail page).

---

## Shared implementation notes

### Filter bar component layout
```
<div className="flex flex-col sm:flex-row gap-3 mb-6">
  <Input placeholder="..." className="max-w-sm h-10 border-white/10 bg-[#1f2833]/70" />
  <div className="flex gap-2 flex-wrap">
    {chips.map(chip => <button key={chip} ...>{chip}</button>)}
  </div>
</div>
```

### Card company logo placeholder
`<div className="w-10 h-10 rounded-xl border border-white/10 bg-[#111844] flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">`
Initials are derived from the company name initials (e.g., `"NPS"` for "Nova Product Studio").

### Width
All three pages use `max-w-6xl mx-auto px-4 md:px-6 py-8` (matching homepage and job detail — also fixes the `max-w-5xl` currently in the stubs per issue `20260528_profile_settings_width_fix.md`).

---

## Current behavior

All three routes render a minimal "Coming soon" placeholder:
- `wishlists.tsx:14–24` — `Heart` icon + "Coming soon" text + "Browse Jobs" button
- `job-suggestions.tsx:14–24` — `Sparkles` icon + "Coming soon" text
- `applications.tsx:14–24` — `FileText` icon + "Coming soon" text

---

## Impact scope

- [ ] Backend
- [x] Frontend
- [ ] Database
- [ ] E2E

**Affected files:**

| File | Change |
|------|--------|
| `apps/web-candidate/src/routes/wishlists.tsx` | Replace component body with full page |
| `apps/web-candidate/src/routes/job-suggestions.tsx` | Replace component body with full page |
| `apps/web-candidate/src/routes/applications.tsx` | Replace component body with full page |
| `packages/i18n/src/locales/en/common.json` | Add page-level i18n keys if needed |
| `packages/i18n/src/locales/vi/common.json` | Add page-level i18n keys if needed |

No new routes — `routeTree.gen.ts` does **not** need to be regenerated.

---

## Related code

| Location | Relevance |
|----------|-----------|
| `apps/web-candidate/src/routes/index.tsx:236–259` | Base job card pattern (HTML structure + classes) to reuse |
| `apps/web-candidate/src/routes/jobs/$jobId.tsx` | Section heading style, related-jobs card mini variant |
| `apps/web-candidate/src/store/useCandidateStore.ts:15–25` | `mockUser` export — used by job-suggestions page to show "based on your profile" context |
| `apps/web-candidate/src/index.css` | `theme-*` classes + light mode overrides for `bg-[#1f2833]` / `border-white/10` |
| `docs/issues/20260528_profile_settings_width_fix.md` | Related: width fix changes `max-w-5xl` → `max-w-6xl` in the same set of stub pages |

---

## Notes

- **No API integration** — all data is hardcoded mock arrays defined at the top of each file.
- **No actual filtering** — the search input and filter chips are purely visual (no `Array.filter` logic). The selected chip updates a local `useState` but the grid always renders the full mock array in the prototype.
- **Wishlists remove interaction**: clicking the heart button on a saved job card removes it from the `useState` array so the list shrinks. This is the only interactive data mutation across the three pages.
- **No tests** — no test runner configured per `CLAUDE.md`.
- The `purple-500` and `green-500` Tailwind classes used for interview/offer status badges are raw Tailwind values (no custom token). This is acceptable for a prototype since neither color is in the SmartCV design token set.
