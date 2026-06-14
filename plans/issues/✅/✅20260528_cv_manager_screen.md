# [Feature] CV Manager Screen and Dropdown Entry

## Overview

Add a **CV Manager** entry to the authenticated account dropdown in the header, and implement the corresponding `/cv-manager` page as a fully rendered, static-data prototype. The page lets candidates view their uploaded CVs, upload a new one, set a primary CV, and remove CVs from the list (all interactions are local-state only — no API calls).

---

## Reproduction steps

N/A — greenfield feature. Entry paths:

1. Sign in (sets `localStorage.isAuthenticated = 'true'`).
2. Hover the avatar chip in the header → account dropdown opens.
3. Click **CV Manager** → navigate to `/cv-manager`.

---

## Expected behavior

### 1. Account dropdown — new item (`__root.tsx`)

Add a **CV Manager** link between "Settings" and "Applied Jobs" in the authenticated dropdown (lines 288–295 of `__root.tsx`):

```tsx
<Link to="/cv-manager" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted/60 transition-colors">
  <FileDown className="h-4 w-4 text-muted-foreground" />
  {t('account_cv_manager')}
</Link>
```

Import: add `FileDown` to the existing lucide-react import in `__root.tsx`.

New dropdown order:
1. My Profile → `/profile`
2. Settings → `/settings`
3. **CV Manager → `/cv-manager`** ← new
4. Applied Jobs → `/applications`
5. Wishlists → `/wishlists`
6. Job Suggestions → `/job-suggestions`
7. ─────────────────
8. Sign Out

### 2. New i18n keys

**`packages/i18n/src/locales/en/common.json`**:
```json
"account_cv_manager": "CV Manager"
```

**`packages/i18n/src/locales/vi/common.json`**:
```json
"account_cv_manager": "Quản lý CV"
```

### 3. `/cv-manager` page

**Route file**: `apps/web-candidate/src/routes/cv-manager.tsx`

**Route definition**:
```tsx
export const Route = createFileRoute('/cv-manager')({
  beforeLoad: () => {
    if (localStorage.getItem('isAuthenticated') !== 'true') {
      throw redirect({ to: '/signin' })
    }
  },
  component: CvManagerPage,
})
```

**Outer container**: `max-w-6xl mx-auto px-4 md:px-6 py-8` (consistent with all other pages).

---

#### Page layout

```
┌─────────────────────────────────────────────────────────┐
│  Quản lý CV                                             │
│  3 CV đã tải lên                                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ↑  Kéo thả hoặc nhấn để tải CV lên            │   │
│  │     [Browse files]                              │   │
│  │  Hỗ trợ: PDF, DOCX · Tối đa 5 MB              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  CV Card │  │  CV Card │  │  CV Card │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
```

---

#### Upload area

```
┌──────────────────────────────────────────────────────────┐
│                  [Upload icon — h-8 w-8]                 │
│         Kéo thả file vào đây hoặc nhấn để chọn          │
│                  [Browse files button]                   │
│           Hỗ trợ: PDF, DOCX · Tối đa 5 MB              │
└──────────────────────────────────────────────────────────┘
```

Container: `border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center gap-3 text-muted-foreground text-center mb-8`

- Upload icon: `<Upload className="h-8 w-8 text-muted-foreground" />`
- Primary text: `text-base text-foreground font-medium`
- Secondary text: `text-sm text-muted-foreground`
- Button: `<Button variant="outline" size="sm">Browse files</Button>` (static, no action)

---

#### CV card grid

Grid: `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`

Each CV card:

```
┌──────────────────────────────────────┐
│  ┌──────────────────────────────┐    │
│  │                              │    │
│  │   [FileDown icon — large]    │    │
│  │   bg-muted/50 rounded-lg     │    │
│  │       h-32                   │    │
│  └──────────────────────────────┘    │
│                                      │
│  CV_NguyenMinhAnh_Frontend_2026.pdf  │
│  [PDF]  ·  245 KB                    │
│  Tải lên 3 ngày trước               │
│  [★ CV chính]  (if primary)         │
│  ────────────────────────────────    │
│  [Đặt làm CV chính]  [↓]  [✕]       │
└──────────────────────────────────────┘
```

**Card container**: `<Card className="border-border bg-card">` with `<CardContent className="p-4 space-y-3">`

**Document thumbnail placeholder**:
```tsx
<div className="rounded-lg bg-muted/50 h-32 flex flex-col items-center justify-center gap-2 text-muted-foreground border border-border">
  <FileDown className="h-8 w-8" />
  <span className="text-xs font-medium uppercase tracking-wide">{cv.fileType}</span>
</div>
```

**File info row**:
- File name: `text-sm font-semibold text-foreground truncate` (full filename truncated with ellipsis)
- File type badge + size: `inline-flex items-center gap-2`
  - Type badge: `<Badge variant="secondary" className="text-xs uppercase">{cv.fileType}</Badge>`
  - Size: `text-xs text-muted-foreground`
- Upload date: `text-xs text-muted-foreground`
- Primary badge (shown only on the primary CV):
  `<span className="inline-flex items-center gap-1 text-xs font-medium text-primary"><Star className="h-3 w-3 fill-current" /> CV chính</span>`

**Action buttons row**: `flex items-center gap-2 pt-2 border-t border-border`
- **Set as primary**: `<Button size="sm" variant={cv.isPrimary ? 'default' : 'outline'} className="flex-1 text-xs h-8">` — `cv.isPrimary ? 'CV chính ✓' : 'Đặt làm CV chính'`. Clicking updates `isPrimary` on the clicked CV and clears it on all others (local `useState`).
- **Download**: `<Button size="sm" variant="ghost" className="h-8 w-8 p-0"><Download className="h-4 w-4" /></Button>` (static, no action).
- **Delete**: `<Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"><X className="h-4 w-4" /></Button>` — removes the card from the local `useState` array.

---

#### Mock data

Define inline at the top of `cv-manager.tsx`:

```ts
interface CVFile {
  id: string
  name: string
  fileType: 'PDF' | 'DOCX'
  size: string
  uploadedAt: string
  isPrimary: boolean
}
```

| id | name | fileType | size | uploadedAt | isPrimary |
|----|------|----------|------|------------|-----------|
| `cv-1` | CV_NguyenMinhAnh_Frontend_2026.pdf | PDF | 245 KB | Tải lên 3 ngày trước | **true** |
| `cv-2` | CV_NguyenMinhAnh_Fullstack.pdf | PDF | 312 KB | Tải lên 2 tuần trước | false |
| `cv-3` | CV_NguyenMinhAnh_v1.docx | DOCX | 128 KB | Tải lên 1 tháng trước | false |

State: `const [cvFiles, setCvFiles] = React.useState<CVFile[]>(initialCvFiles)`

**Set as primary** handler:
```ts
const setPrimary = (id: string) =>
  setCvFiles((prev) => prev.map((cv) => ({ ...cv, isPrimary: cv.id === id })))
```

**Delete** handler:
```ts
const deleteCv = (id: string) =>
  setCvFiles((prev) => prev.filter((cv) => cv.id !== id))
```

---

#### Empty state (shown when all CVs are deleted)

```tsx
<div className="flex flex-col items-center gap-4 py-16 text-muted-foreground">
  <FileDown className="h-10 w-10" />
  <p className="text-base">Chưa có CV nào được tải lên</p>
  <p className="text-sm">Tải lên CV của bạn để bắt đầu ứng tuyển</p>
</div>
```

---

#### Lucide icons required

`FileDown`, `Upload`, `Download`, `X`, `Star` — all from `lucide-react`.

---

## Current behavior

- No `CV Manager` item exists in the account dropdown.
- No `/cv-manager` route exists — navigating to it returns a 404/not-found state.

---

## Impact scope

- [ ] Backend
- [x] Frontend
- [ ] Database
- [ ] E2E

**Affected files:**

| File | Change |
|------|--------|
| `apps/web-candidate/src/routes/__root.tsx` | Add `FileDown` import + new `<Link to="/cv-manager">` dropdown item |
| `apps/web-candidate/src/routes/cv-manager.tsx` | **New file** — full CV manager page |
| `apps/web-candidate/src/routeTree.gen.ts` | Auto-regenerated by Vite plugin on save |
| `packages/i18n/src/locales/en/common.json` | Add `"account_cv_manager": "CV Manager"` |
| `packages/i18n/src/locales/vi/common.json` | Add `"account_cv_manager": "Quản lý CV"` |

---

## Related code

| Location | Relevance |
|----------|-----------|
| `apps/web-candidate/src/routes/__root.tsx:284–303` | Existing dropdown nav items — insert new item after Settings (line 289) |
| `apps/web-candidate/src/routes/profile.tsx:129–140` | CV upload placeholder already in Skills & CV section — same dashed-border style |
| `apps/web-candidate/src/routes/wishlists.tsx` | Pattern for auth-guarded page with card grid and delete-from-list interaction |
| `apps/web-candidate/src/index.css` | `theme-*` classes; light-mode overrides for `bg-[#1f2833]` and `border-white/10` |
| `packages/ui/src/globals.css` | Semantic tokens (`bg-card`, `border-border`, `bg-muted`, `text-muted-foreground`) |

---

## Notes

- **No API integration** — all CV data is a hardcoded `useState` array. Upload, download, and delete are purely visual/local-state interactions.
- **Set as primary is exclusive** — setting one CV as primary automatically unsets all others. Implemented via a `.map()` replace in local state.
- **routeTree.gen.ts** is auto-generated — after creating `cv-manager.tsx`, run `pnpm -F web-candidate dev` once to trigger regeneration.
- **No tests** — no test runner configured per `CLAUDE.md`.
- The profile page (`/profile`) already has a "Skills & CV" upload placeholder — the CV Manager is the dedicated, more capable replacement for that placeholder. They coexist in the prototype.
