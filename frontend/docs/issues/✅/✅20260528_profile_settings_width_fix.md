# [Fix] Profile and Settings pages narrower than the rest of the app

## Overview

The Profile (`/profile`) and Settings (`/settings`) pages use `max-w-5xl` (1024px) as their outer container width, while every other content page in the candidate portal uses `max-w-6xl` (1152px). This makes both pages appear visually narrower than the homepage and job detail page, creating an inconsistent layout.

The fix is a single-line change in each file: replace `max-w-5xl` with `max-w-6xl`.

---

## Reproduction steps

1. Open the candidate portal at `http://localhost:3000/`.
2. Sign in (or set `localStorage.isAuthenticated = 'true'`).
3. Navigate to `/profile` or `/settings`.
4. On a screen wider than ~1100px, compare the content width to the homepage — profile/settings content is visibly narrower.

---

## Expected behavior

`/profile` and `/settings` should use the same `max-w-6xl mx-auto` outer container as:
- `apps/web-candidate/src/routes/index.tsx` (line 172: `max-w-6xl`)
- `apps/web-candidate/src/routes/jobs/$jobId.tsx` (uses `max-w-6xl`)

---

## Current behavior

| Page | Current class | Rendered max-width |
|------|---------------|--------------------|
| `/profile` | `max-w-5xl` | ~1024px |
| `/settings` | `max-w-5xl` | ~1024px |
| `/` (homepage) | `max-w-6xl` | ~1152px |
| `/jobs/$jobId` | `max-w-6xl` | ~1152px |

---

## Impact scope

- [ ] Backend
- [x] Frontend
- [ ] Database
- [ ] E2E

**Affected files:**

| File | Line | Change |
|------|------|--------|
| `apps/web-candidate/src/routes/profile.tsx` | 47 | `max-w-5xl` → `max-w-6xl` |
| `apps/web-candidate/src/routes/settings.tsx` | 40 | `max-w-5xl` → `max-w-6xl` |

---

## Related code

| Location | Relevance |
|----------|-----------|
| `apps/web-candidate/src/routes/profile.tsx:47` | `<div className="max-w-5xl mx-auto px-4 md:px-6 py-8 pb-20 lg:pb-0">` |
| `apps/web-candidate/src/routes/settings.tsx:40` | `<div className="max-w-5xl mx-auto px-4 md:px-6 py-8">` |
| `apps/web-candidate/src/routes/index.tsx:172` | Reference: `max-w-6xl mx-auto` |
| `apps/web-candidate/src/routes/jobs/$jobId.tsx` | Reference: `max-w-6xl mx-auto` |

---

## Notes

- No layout changes required beyond the single class swap — the inner grid (`lg:grid-cols-[280px_1fr]` for profile, `lg:grid-cols-[220px_1fr]` for settings) is proportional and will simply have more breathing room at the wider breakpoint.
- No i18n, store, or route changes needed.
- No tests to update (no test runner configured per `CLAUDE.md`).
