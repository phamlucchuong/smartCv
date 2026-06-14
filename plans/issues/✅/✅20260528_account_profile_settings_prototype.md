# [Feature] Account Profile, Settings, and Authenticated Header Prototype

## Overview

Implement a fully rendered, static-data prototype for:

1. **Authenticated header state** — when `isAuthenticated` is `true`, replace the "Sign In" / "Join Now" buttons with an avatar chip (user initials + name). Hovering the chip opens a dropdown navigation menu.
2. **Account dropdown** — hover-triggered dropdown below the avatar chip containing navigation links and a sign-out action.
3. **Profile page** (`/profile`) — displays a mock user's basic info, work experience, education, and skills/CV sections.
4. **Settings page** (`/settings`) — tabbed/sidebar layout with four sections: Account (change password), Notifications (toggles), Privacy (toggles), Danger Zone.
5. **Stub routes** for `/applications`, `/wishlists`, `/job-suggestions` — minimal placeholder pages reachable from the dropdown (content can be empty grids with a "Coming soon" message).

All data is hardcoded (no API calls). Auth state is read from `localStorage.getItem('isAuthenticated')` (existing pattern from signin/signup).

---

## Reproduction steps

N/A — this is a greenfield feature. Entry paths:

1. Sign in via `/signin` (sets `localStorage.isAuthenticated = 'true'`)
2. Return to any page — header should now show avatar chip instead of auth buttons
3. Hover the avatar chip → dropdown opens
4. Click "My Profile" → `/profile`
5. Click "Settings" → `/settings`
6. Click "Sign Out" → clears auth, redirects to `/signin`

---

## Expected behavior

### Header — authenticated state (`__root.tsx`)

**When `localStorage.getItem('isAuthenticated') !== 'true'`** (unauthenticated):
- Show existing "Sign In" + "Join Now" buttons (unchanged).

**When `localStorage.getItem('isAuthenticated') === 'true'`** (authenticated):
- Hide "Sign In" and "Join Now" buttons.
- Show an **avatar chip**: `rounded-full bg-primary/20 border border-primary/30 flex items-center gap-2 px-3 py-1.5 cursor-pointer`
  - Left: avatar circle with user initials (`text-sm font-semibold text-primary`)
  - Right: user's first name (`text-sm font-medium theme-text-main`)
  - Trailing: `ChevronDown` icon (rotates 180° when dropdown is open)
- The chip is the hover trigger for the dropdown.
- Auth state is read once on mount via `useState(() => localStorage.getItem('isAuthenticated') === 'true')`. Sign-out clears localStorage and sets state to false (no page refresh needed).

### Account dropdown

Triggered by `onMouseEnter` on the avatar chip container `<div>` (close on `onMouseLeave` with 150ms delay to allow mouse to reach the dropdown).

**Layout**: absolute dropdown, `min-w-[220px]`, `top-full mt-2 right-0`, `bg-card border border-border rounded-xl shadow-xl z-50`, with `transition-opacity duration-150`.

**Structure** (top to bottom):
```
┌─────────────────────────────────┐
│  [Avatar 40px]  Nguyen Minh Anh │
│                minh.anh@...     │
├─────────────────────────────────┤
│  👤  My Profile                 │
│  ⚙   Settings                  │
│  📋  Applied Jobs               │
│  ♡   Wishlists                  │
│  ✨  Job Suggestions            │
├─────────────────────────────────┤
│  → Sign Out                     │
└─────────────────────────────────┘
```

- Header section: avatar (`w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary`), name (`font-semibold text-sm text-foreground`), email (`text-xs text-muted-foreground truncate`)
- Dividers: `<hr className="border-border my-1" />`
- Nav items: `flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted/60 transition-colors`; icon (`h-4 w-4 text-muted-foreground`)
- Sign Out row: `text-destructive hover:bg-destructive/10`

**Navigation items and routes:**

| Label | Icon | Route |
|-------|------|-------|
| My Profile | `UserRound` | `/profile` |
| Settings | `Settings` | `/settings` |
| Applied Jobs | `FileText` | `/applications` |
| Wishlists | `Heart` | `/wishlists` |
| Job Suggestions | `Sparkles` | `/job-suggestions` |
| Sign Out | `LogOut` | clears `localStorage.isAuthenticated`, sets local auth state to `false` |

### Mock user data

Define once in `useCandidateStore.ts` (or inline as a constant in a shared location). Used by both the header and the profile page:

```ts
const mockUser = {
  name: 'Nguyen Minh Anh',
  firstName: 'Minh Anh',
  email: 'minh.anh@example.com',
  phone: '0901 234 567',
  initials: 'NMA',
  title: 'Frontend Engineer',
  location: 'TP. Hồ Chí Minh',
  bio: 'Passionate frontend developer with 3 years of experience building scalable React applications.',
  avatarColor: 'bg-primary/20 text-primary',
}
```

### Zustand store additions (`useCandidateStore.ts`)

Add to the existing store:

```ts
isAuthenticated: boolean           // init: localStorage.getItem('isAuthenticated') === 'true'
signOut: () => void                // clears localStorage + sets isAuthenticated = false
```

The store reads auth state on init so all components can subscribe instead of reading localStorage directly.

### Profile page (`/profile`)

**Route file**: `apps/web-candidate/src/routes/profile.tsx`
**Guard**: `beforeLoad` — if not authenticated, `throw redirect({ to: '/signin' })`

**Two-column layout** `lg:grid-cols-[280px_1fr]`, `max-w-5xl mx-auto px-4 md:px-6 py-8`

**Left sidebar (sticky `top-20`)**:
```
┌────────────────────────────┐
│  [Avatar 80px]             │
│  Nguyen Minh Anh           │
│  Frontend Engineer         │
│  📍 TP. Hồ Chí Minh        │
│  ──────────────────────── │
│  📋 Applied: 12            │
│  ♡  Saved: 8              │
│  👁  Profile views: 34     │
│  ──────────────────────── │
│  [Edit Profile button]     │
└────────────────────────────┘
```

- Avatar: `w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary`
- Quick stats: three rows of `icon + label + value` pairs
- "Edit Profile": `<Button variant="outline" className="w-full">` (static, no action)

**Right main content** — four `<Card>` sections stacked vertically with `space-y-6`:

**Section 1 — Basic Info**:
- Section heading style: `text-lg font-semibold text-foreground border-l-4 border-primary pl-3`
- Fields displayed as read-only rows: Full Name, Email, Phone, Location, Title, Bio
- Each row: `flex items-start gap-3 py-2 border-b border-border last:border-0 text-sm`
- Label: `w-28 shrink-0 text-muted-foreground font-medium`
- Value: `text-foreground`

**Section 2 — Work Experience** (2 mock items):
```
┌─────────────────────────────────────────────┐
│  Frontend Engineer                           │
│  Nova Product Studio · Full-time            │
│  01/2024 – Present · TP. Hồ Chí Minh        │
│  • Built React + TypeScript SPAs...         │
│  • Improved performance by 40%...           │
├─────────────────────────────────────────────┤
│  Junior Frontend Developer                   │
│  Skyline Labs · Full-time                   │
│  06/2022 – 12/2023 · Hà Nội                 │
│  • Developed UI components in Vue.js...     │
└─────────────────────────────────────────────┘
```

Each item: company logo placeholder (initials in `w-10 h-10 rounded-lg bg-muted`), title (`font-semibold`), company + type (`text-sm text-muted-foreground`), date range + location (`text-xs text-muted-foreground`), bullet list of achievements.

**Section 3 — Education** (1 mock item):
```
┌─────────────────────────────────────────────┐
│  [Logo]  Đại học Bách Khoa TP.HCM           │
│          Cử nhân Kỹ thuật Phần mềm         │
│          2018 – 2022                        │
└─────────────────────────────────────────────┘
```

**Section 4 — Skills & CV**:
- Skills: wrapping `<Badge variant="secondary">` tags for each skill
- Mock skills: `['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'GraphQL', 'Node.js', 'Figma', 'Git']`
- CV Upload placeholder: dashed border box `border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-3 text-muted-foreground`; `Upload` icon + "Drag & drop or click to upload" text + `<Button variant="outline" size="sm">Browse files</Button>` (static)

**Mobile bottom padding**: `pb-20 lg:pb-0` (same pattern as job detail, since no fixed bar here just for consistency).

### Settings page (`/settings`)

**Route file**: `apps/web-candidate/src/routes/settings.tsx`
**Guard**: same `beforeLoad` redirect as `/profile`

**Layout**: `max-w-5xl mx-auto px-4 md:px-6 py-8`

**Desktop**: Two-column `lg:grid-cols-[220px_1fr]`
**Mobile**: Stacked; settings nav on top as horizontal tabs

**Left nav sidebar** (sticky `top-20`):
```
┌──────────────────────────┐
│ Settings                 │
│ ─────────────────────── │
│ ⚙  Account          ←   │  (active)
│ 🔔 Notifications         │
│ 🔒 Privacy               │
│ ⚠  Danger Zone          │
└──────────────────────────┘
```

Active item: `bg-primary/10 text-primary font-medium rounded-lg`
Inactive item: `text-foreground hover:bg-muted/60 rounded-lg`

**Right content** — one `<Card>` per section, only the active section is shown (local `useState` for `activeSection`):

**Account section**:
- Section heading: "Account Settings"
- Sub-section: "Change Password"
  - Three inputs: "Current Password", "New Password", "Confirm Password" (all `type="password"`, static)
  - `<Button className="mt-2">Update Password</Button>` (static, no action)
- Sub-section: "Email Address"
  - Email input pre-filled with mock email (static)
  - `<Button variant="outline">Update Email</Button>`

**Notifications section**:
- Section heading: "Notification Preferences"
- Four toggle rows (use a custom `<div>` with `<input type="checkbox" className="...">` styled as a toggle, or a simple `flex justify-between` with a boolean `useState`):

| Label | Sub-label | Default |
|-------|-----------|---------|
| Job Recommendations | Receive weekly curated job suggestions | ON |
| Application Updates | Get notified when employers view your profile | ON |
| New Messages | Notifications for recruiter messages | ON |
| Promotional Emails | Tips, resources and SmartCV updates | OFF |

Each toggle row: `flex items-center justify-between py-3 border-b border-border last:border-0`; label block on left, toggle switch on right (`w-10 h-6 rounded-full transition-colors`, active: `bg-primary`, inactive: `bg-muted`)

**Privacy section**:
- Section heading: "Privacy Settings"
- Three toggle rows:

| Label | Sub-label | Default |
|-------|-----------|---------|
| Public Profile | Allow recruiters to find your profile | ON |
| Show Salary Expectation | Display your salary expectation on profile | OFF |
| Activity Status | Show when you were last active | ON |

**Danger Zone section**:
- Section heading with red accent: `text-destructive`
- Single card with `border-destructive/30 bg-destructive/5`
- "Delete Account" block:
  - Warning text: "This action is permanent and cannot be undone. All your data, applications, and saved jobs will be deleted."
  - `<Button variant="destructive" className="mt-3">Delete Account</Button>` — clicking shows a simple confirmation `window.confirm()` dialog (static, no actual delete)

### Stub routes

**`/applications`**, **`/wishlists`**, **`/job-suggestions`**: each is a minimal page with:
- Route guard (redirect to `/signin` if unauthenticated)
- A page heading + a `<div className="flex flex-col items-center gap-4 py-20 text-muted-foreground">` placeholder with a relevant Lucide icon + "Coming soon" message + `<Link to="/"><Button variant="outline">Browse Jobs</Button></Link>`

### Route files to create

| File | Route | Guard |
|------|-------|-------|
| `apps/web-candidate/src/routes/profile.tsx` | `/profile` | redirect to `/signin` if !auth |
| `apps/web-candidate/src/routes/settings.tsx` | `/settings` | redirect to `/signin` if !auth |
| `apps/web-candidate/src/routes/applications.tsx` | `/applications` | redirect to `/signin` if !auth |
| `apps/web-candidate/src/routes/wishlists.tsx` | `/wishlists` | redirect to `/signin` if !auth |
| `apps/web-candidate/src/routes/job-suggestions.tsx` | `/job-suggestions` | redirect to `/signin` if !auth |

---

## Current behavior

- Header always shows "Sign In" and "Join Now" buttons regardless of auth state.
- No avatar button, no dropdown menu.
- No `/profile`, `/settings`, `/applications`, `/wishlists`, `/job-suggestions` routes.
- `useCandidateStore` has no auth or user state.

---

## Impact scope

- [ ] Backend
- [x] Frontend
- [ ] Database
- [ ] E2E

**Affected files:**

| File | Change |
|------|--------|
| `apps/web-candidate/src/routes/__root.tsx` | Add auth state check; conditionally render avatar chip + dropdown vs. auth buttons |
| `apps/web-candidate/src/store/useCandidateStore.ts` | Add `isAuthenticated`, `signOut()`, and `mockUser` constant |
| `apps/web-candidate/src/routes/profile.tsx` | **New** — full profile page |
| `apps/web-candidate/src/routes/settings.tsx` | **New** — settings page with four sections |
| `apps/web-candidate/src/routes/applications.tsx` | **New** — stub |
| `apps/web-candidate/src/routes/wishlists.tsx` | **New** — stub |
| `apps/web-candidate/src/routes/job-suggestions.tsx` | **New** — stub |
| `apps/web-candidate/src/routeTree.gen.ts` | Auto-regenerated by Vite plugin |
| `packages/i18n/src/locales/en/common.json` | Add account/profile/settings i18n keys |
| `packages/i18n/src/locales/vi/common.json` | Add same keys in Vietnamese |

---

## Related code

| File | Relevance |
|------|-----------|
| `apps/web-candidate/src/routes/__root.tsx:101` | Header element; existing dropdown pattern (job/resource menus) can be reused for the account dropdown |
| `apps/web-candidate/src/routes/signin.tsx:8-13` | `beforeLoad` guard pattern for redirecting authenticated users |
| `apps/web-candidate/src/store/useCandidateStore.ts` | Zustand store to extend with auth state |
| `apps/web-candidate/src/routes/jobs/$jobId.tsx` | Reference for section heading style, card layout, and two-column pattern |
| `apps/web-candidate/src/index.css` | `theme-*` CSS classes for dark/light compatibility |
| `packages/ui/src/globals.css` | Semantic design tokens (`bg-card`, `border-border`, `text-primary`, etc.) |

---

## Notes

- **No API integration** — all user data is a hardcoded `mockUser` constant. No form submissions actually persist data.
- **Auth persistence**: `isAuthenticated` in `localStorage` is the only persisted auth signal. User data (name, email) is always the hardcoded mock — no per-user storage.
- **Dropdown trigger**: Use `onMouseEnter` / `onMouseLeave` on a wrapper `<div ref>` (same pattern as the existing job/resource dropdown menus in `__root.tsx`). Add a 150ms close delay so the user can move their mouse from the chip into the dropdown without it closing.
- **No tests** — no test runner is configured per `CLAUDE.md`.
- **`routeTree.gen.ts`** is auto-regenerated — after creating new route files, run `pnpm -F web-candidate dev` once.
- Related design document: `docs/design/web_candidat_design.md` (global design tokens and CSS classes)
