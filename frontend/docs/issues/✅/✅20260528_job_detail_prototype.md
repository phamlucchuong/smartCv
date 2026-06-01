# [Feature] Implement Job Detail Page Prototype

## Overview

Implement a fully rendered, static-data prototype of the Job Detail page for the candidate portal (`apps/web-candidate`), based on the design specification in `docs/design/job_detail.md`.

The prototype uses hardcoded Vietnamese mock data (no API calls), supports both dark and light themes via the existing `theme-*` CSS variable system, and includes a navigation link update in `index.tsx` so that job cards route to the new page.

---

## Reproduction steps

N/A — this is a greenfield feature. The entry path is:

1. User opens the candidate portal homepage (`/`)
2. User clicks any job card in the "Featured & Hot Jobs" section
3. User is navigated to `/jobs/:jobId` (the new route)

---

## Expected behavior

**Route & file**
- New TanStack Router file-based route at `apps/web-candidate/src/routes/jobs/$jobId.tsx`
- Route path: `/jobs/$jobId` — the `$jobId` param is present in the URL but used only as a mock key (static data for the prototype)
- `routeTree.gen.ts` regenerates automatically via Vite plugin on save; do **not** edit it manually

**Homepage wiring (`index.tsx`)**
- Wrap each job card `<article>` in `<Link to="/jobs/$id">` using TanStack Router's `<Link>` component, where `$id` is a slug derived from the static job title (e.g. `"senior-nodejs"`)
- The mock jobs array in `index.tsx` should gain an `id` field used as the route param

**Job Detail page layout**
Full two-column desktop layout: `lg:grid-cols-[1fr_340px]`, `max-w-6xl mx-auto px-4 md:px-6`.

Sections (in order from top to bottom):

| # | Section | Key notes |
|---|---------|-----------|
| 1 | **Sticky mini action bar** (scroll-triggered) | Visible only when `scrollY` exceeds the hero card's bottom edge. Shows truncated job title + "Lưu tin" + "Ứng tuyển" buttons. Uses `sticky top-0 z-50` on the existing header — add a second sticky bar inside the page that overlays below the global navbar. |
| 2 | **Breadcrumb** | `Home > Tìm việc làm > [Job Title]`. Container: `py-3 border-b border-border bg-muted/30`. |
| 3 | **Job Hero Card** | Company logo (64×64, `rounded-xl`), Job title `<h1>`, company name (links to `#`, `text-primary`), location chip, posted-date label, salary/deadline/experience chips, "Ứng tuyển ngay" primary button + "Lưu tin" outline button, deadline warning line. |
| 4 | **Job Description Section** | `<Card>` with section title style `border-l-4 border-primary pl-3`, `<hr>`, bullet list body text. |
| 5 | **Candidate Requirements Section** | Same card/heading style as §4. Includes a skill badge row (`<Badge variant="secondary">`). |
| 6 | **Benefits Section** | `grid grid-cols-2 gap-2` of benefit chips with check icon. |
| 7 | **Working Location Section** | Address line + map placeholder (`rounded-xl bg-muted h-48`). |
| 8 | **Sidebar — Job Overview Card** | `sticky top-20`, 9 rows of icon + label + value pairs. |
| 9 | **Sidebar — Company Info Card** | Company logo (48×48), name, industry/size/country rows, "Xem trang công ty" outline button. |
| 10 | **Related Jobs Section** | Full-width below two-column layout. `grid gap-4 md:grid-cols-2 lg:grid-cols-3` of job cards reusing the card pattern from `index.tsx`. |

**Interaction states (static prototype)**
- **Apply button**: default → applied state toggle (local `useState`). Applied state: `bg-muted text-muted-foreground` + checkmark icon.
- **Save button**: unsaved ↔ saved toggle (local `useState`). Saved state: `border-primary text-primary bg-primary/5` + filled heart icon.
- **Sticky mini bar**: shown/hidden via `useEffect` + `IntersectionObserver` (or `scrollY` comparison) watching the hero card ref.

**Responsive behavior**
| Breakpoint | Behavior |
|---|---|
| Mobile `< md` | Single column. Sidebar stacks below main. Add a `fixed bottom-0` sticky apply bar: `bg-card border-t border-border p-3 flex items-center justify-between`. Hides on desktop. |
| Tablet `md–lg` | Single column. Sticky apply bar remains. Sidebar renders below content. |
| Desktop `lg+` | Two-column `lg:grid-cols-[1fr_340px]`. Sidebar `sticky top-20`. Sticky apply bar hidden. |

**Theme compatibility**
Use the existing `theme-*` CSS variable classes (`theme-header-bg`, `theme-border`, `theme-surface-1`, `theme-text-main`, `theme-text-sub`, etc.) already defined in `apps/web-candidate/src/index.css` for elements that need to adapt to dark/light mode. For elements specified in `job_detail.md` with explicit design tokens (`border-border`, `bg-card`, `text-muted-foreground`, `text-primary`, etc.), use them as-is since those CSS variables are already wired to both themes in `packages/ui/src/globals.css`.

---

## Current behavior

- No `/jobs/$jobId` route exists. Navigating to `/jobs/anything` results in a 404/not-found state.
- Job cards on the homepage (`index.tsx`) do not navigate anywhere on click.
- `routeTree.gen.ts` contains no job routes.

---

## Impact scope

- [ ] Backend
- [x] Frontend
- [ ] Database
- [ ] E2E

**Affected files:**
- `apps/web-candidate/src/routes/jobs/$jobId.tsx` — **new file** (main deliverable)
- `apps/web-candidate/src/routes/index.tsx` — add `id` to mock jobs array, wrap cards in `<Link>`
- `apps/web-candidate/src/routeTree.gen.ts` — auto-regenerated by Vite plugin, do not edit
- `packages/i18n/src/locales/en/common.json` and `vi/common.json` — add translation keys for job detail strings

---

## Related code

| File | Relevance |
|------|-----------|
| `apps/web-candidate/src/routes/index.tsx` | Contains existing job cards and the `jobs` mock array to extend with `id` fields |
| `apps/web-candidate/src/routes/__root.tsx` | Global navbar structure; sticky mini bar should sit below the `<header>` element inside the new route |
| `apps/web-candidate/src/store/useCandidateStore.ts` | May need `savedJobs: string[]` and `toggleSavedJob(id)` added if save state should persist across navigation (optional for prototype) |
| `apps/web-candidate/src/index.css` | Defines all `theme-*` CSS classes for dark/light compatibility |
| `packages/ui/src/index.ts` | Exports `Card`, `CardContent`, `Button`, `Badge`, `Input`, `cn()` |
| `packages/ui/src/globals.css` | Defines CSS variables (`--color-primary`, `--color-border`, `--color-muted`, etc.) wired to both themes |
| `packages/i18n/src/locales/en/common.json` | Add job detail i18n keys |
| `docs/design/job_detail.md` | Full visual specification — section diagrams, token table, typography, spacing, responsive breakpoints |

---

## Mock data shape

Define the following type inline in `$jobId.tsx` (no API types needed for prototype):

```ts
interface JobDetailMock {
  id: string
  title: string
  company: string
  logoPlaceholder: string      // initials, e.g. "ABC"
  location: string
  postedAt: string
  salary: string
  deadline: string             // e.g. "30/06/2026"
  deadlineDaysLeft: number
  experience: string
  level: string
  headcount: number
  jobType: string              // "Toàn thời gian"
  probation: string            // "2 tháng"
  schedule: string             // "Hành chính"
  gender: string
  description: string[]        // bullet points
  requirements: string[]
  skills: string[]
  benefits: string[]
  address: string
  industry: string
  companySize: string
  country: string
}
```

Provide one fully populated `mockJob` constant in the file.

---

## Notes

- **No API integration** — this is a UI prototype only. All data is static.
- **No authentication gate** — clicking "Ứng tuyển ngay" toggles the button to an "applied" state locally; no redirect to `/signin` required for the prototype (can be added later).
- **TanStack Router param** — `const { jobId } = Route.useParams()` is available but unused in the prototype; include it for forward compatibility.
- **`routeTree.gen.ts` is auto-generated** — after creating `apps/web-candidate/src/routes/jobs/$jobId.tsx`, run `pnpm -F web-candidate dev` once to trigger regeneration.
- **No `jest`/`vitest` tests** — no test runner is configured in this repo per `CLAUDE.md`.
- Related design document: `docs/design/job_detail.md` (full visual spec)
- Related design document: `docs/design/web_candidat_design.md` (global design tokens and dark theme CSS classes)
