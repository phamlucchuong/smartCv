# Web Candidate — Completion Design

**Date:** 2026-06-07  
**App:** `frontend/apps/web-candidate`  
**Approach:** One-pass — new company pages + i18n fixes built together

---

## 1. Scope

Four areas of work, all delivered in one pass:

1. New public route `/companies` — company list page
2. New public route `/companies/$companyId` — company detail page
3. i18n comprehensive pass — page titles, fix hardcoded strings, new translation keys
4. Minor UI completions — nav links, about page, job detail company link

---

## 2. Route Structure

### New routes

```
/companies              → src/routes/companies.tsx           (public)
/companies/$companyId   → src/routes/companies/$companyId.tsx (public)
```

### Navigation integration

- Nav header dropdown "Jobs": add "Companies" option linking to `/companies`
- Home page "Top Companies Spotlight" cards: replace `href="#"` with `Link to="/companies/$companyId"`
- Footer "Top Companies" link: `Link to="/companies"`
- Job detail page "View Company" button: `Link to="/companies/$companyId"`

### Mock data

- Shared mock array in a new file `src/data/mockCompanies.ts` — imported by both `/companies` and `/companies/$companyId`
- Same pattern as existing mock data (inline, no store changes needed)

---

## 3. Page: `/companies`

**Layout:** Hero banner + filter bar + grid 3 columns + pagination

### Structure

```
<hero banner — bg-primary solid, search input>
<filter bar — dropdowns: industry / size / location + result count>
<grid 3 col — CompanyCard × N>
<pagination — same pattern as home page job list>
```

### CompanyCard

Each card contains:
- Cover area: `bg-muted` (`h-[52px]`) — placeholder for company cover image
- Logo: square rounded, `border-2 border-background`, overlaps cover bottom edge
- Company name (bold)
- Rating + review count + location (muted, small)
- Industry tag badge
- Footer row: active job count (green) + "Xem hồ sơ →" link (primary color)

Clicking card or "Xem hồ sơ" navigates to `/companies/$companyId`.

### Filter bar

Three `<select>` dropdowns:
- **Ngành** (Industry): All, Fintech, AI/ML, SaaS, DevOps, Data, Design
- **Quy mô** (Size): All, <50, 50–200, 200–500, 500+
- **Địa điểm** (Location): All, Hồ Chí Minh, Hà Nội, Đà Nẵng, Remote

Result count shown on right: "Tìm thấy N công ty"

### Pagination

Same component pattern as home page job list (prev / page numbers / next).

---

## 4. Page: `/companies/$companyId`

**Layout:** Full-width, tabs (Tổng quan / Công việc)

### Header structure

```
<cover banner image>           h-[160px], src={company.coverUrl}, fallback bg-muted
  └─ <logo>                    absolute, bottom=-half_logo_height, left=20px
                               58×58px, rounded-xl, border-3 border-background
                               nửa trên đè lên banner, nửa dưới lộ ra trong info bar
<info bar — bg-background>
  ├─ padding-top for logo overlap
  ├─ company name + meta (industry · size · location · rating)
  ├─ action buttons: "Theo dõi" (outline) + "Xem việc làm (N)" (primary)
  └─ tabs: Tổng quan | Công việc (badge count)
```

Logo positioning (Tailwind):
```tsx
<div className="relative">
  {/* cover */}
  <img className="h-[160px] w-full object-cover bg-muted" src={coverUrl} />
  {/* logo — half on cover, half below */}
  <img
    className="absolute bottom-0 left-5 translate-y-1/2 h-[58px] w-[58px]
               rounded-xl border-[3px] border-background shadow-md object-cover bg-muted"
    src={logoUrl}
  />
</div>
```

### Tab: Tổng quan

Sections (top to bottom):

1. **Info chips row** — 🏢 size · 📍 location · 🌐 website · 💼 industry · 🇻🇳 country
2. **Về công ty** — company description paragraph
3. **Tại sao nên làm việc tại đây?** — 2×2 grid of benefit items
4. **Việc làm đang tuyển** — top 3 job preview cards + "Xem tất cả N việc →" link (switches active tab to "Công việc" via `useState` tab state)
5. **Doanh nghiệp tương tự** — grid 4 columns, each card: logo, name, industry tag, job count, "Xem →" link

### Tab: Công việc

- Search input + filter (salary range, location, job type)
- Full job list using same card UI as home page (`elevate-card`, salary, location, skills, Quick Apply)
- Filtered to current company's jobs only
- Client-side filter on mock array — no API calls

---

## 5. i18n — Comprehensive Pass

### 5a. Page titles (all routes)

Use TanStack Router's `head` option on each `createFileRoute` to set `<title>` dynamically. Title format: `{page} — SmartCV`.

New i18n keys needed:

```json
"page_title_home": "Find Developer Jobs",
"page_title_companies": "Companies",
"page_title_company_detail": "{{name}} — SmartCV",
"page_title_job_detail": "{{title}} at {{company}}",
"page_title_signin": "Sign In",
"page_title_signup": "Join SmartCV",
"page_title_about": "About Us",
"page_title_profile": "My Profile",
"page_title_cv": "My CV",
"page_title_assessments": "Assessments",
"page_title_notifications": "Notifications",
"page_title_settings": "Settings",
"page_title_applications": "Applied Jobs",
"page_title_wishlists": "Wishlists",
"page_title_job_suggestions": "Job Suggestions"
```

### 5b. Fix hardcoded strings in existing pages

| File | Hardcoded strings to migrate |
|---|---|
| `_account.applications.tsx` | Chips: `Tất cả / Đang xử lý / Phỏng vấn / Từ chối`; status labels for all 5 statuses |
| `_account.assessments.tsx` | Status badges: `Not started / In progress / Submitted / Expired`; type labels |
| `_account.wishlists.tsx` | Chips: `Tất cả / Công nghệ / Thiết kế / Marketing` |
| `_account.job-suggestions.tsx` | Page header text, chips |
| `about.tsx` | All text content |

### 5c. New translation keys for company pages

```json
"company_list_title": "Companies Hiring Now",
"company_list_subtitle": "{{count}}+ companies actively hiring",
"company_list_search_placeholder": "Company name, industry, location...",
"company_list_filter_industry": "Industry",
"company_list_filter_size": "Company Size",
"company_list_filter_location": "Location",
"company_list_result_count": "Found {{count}} companies",
"company_list_view_profile": "View Profile",
"company_detail_tab_overview": "Overview",
"company_detail_tab_jobs": "Jobs",
"company_detail_follow": "Follow",
"company_detail_view_jobs": "View Jobs ({{count}})",
"company_detail_about": "About",
"company_detail_why_work_here": "Why Work Here?",
"company_detail_active_jobs": "Active Jobs",
"company_detail_view_all_jobs": "View all {{count}} jobs",
"company_detail_related": "Similar Companies",
"company_detail_view": "View",
"application_status_applied": "Applied",
"application_status_under_review": "Under Review",
"application_status_interview": "Interview",
"application_status_rejected": "Not a Fit",
"application_status_offer": "Offer Received"
```

Both `en/common.json` and `vi/common.json` updated.

---

## 6. Minor UI Completions

| Item | Change |
|---|---|
| Nav dropdown "Jobs" | Add "Companies" option → `/companies` |
| Home "Top Companies Spotlight" | Card links → `/companies/$companyId` |
| Footer "Top Companies" | `href="#"` → `Link to="/companies"` |
| Job detail "Xem thông tin công ty" | Button → `Link to="/companies/$companyId"` |
| `about.tsx` | Wrap with `useTranslation`, replace hardcoded VI text with `t()` keys, standardize layout (max-w-6xl, px-4) |

---

## 7. File Checklist

**New files:**
- `src/routes/companies.tsx`
- `src/routes/companies/$companyId.tsx`
- `src/data/mockCompanies.ts`

**Modified files:**
- `src/routes/__root.tsx` — nav Companies link
- `src/routes/index.tsx` — Top Companies card links
- `src/routes/jobs/$jobId.tsx` — company link, page title
- `src/routes/about.tsx` — i18n + layout
- `src/routes/_account.applications.tsx` — i18n
- `src/routes/_account.assessments.tsx` — i18n
- `src/routes/_account.wishlists.tsx` — i18n
- `src/routes/_account.job-suggestions.tsx` — i18n
- `src/routes/_account.profile.tsx` — page title
- `src/routes/_account.cv.tsx` — page title
- `src/routes/_account.notifications.tsx` — page title
- `src/routes/_account.settings.tsx` — page title
- `src/routes/signin.tsx` — page title
- `src/routes/signup.tsx` — page title
- `packages/i18n/src/locales/en/common.json` — new keys
- `packages/i18n/src/locales/vi/common.json` — new keys

---

## 8. Out of Scope

- Backend API integration (all data remains mock)
- Company follow/unfollow persistence (button renders, no state saved)
- Review tab on company detail page
