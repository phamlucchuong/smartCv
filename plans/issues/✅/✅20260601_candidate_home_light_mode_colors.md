# [TASK] Áp dụng mã màu từ candidate home page (cv-smart-ai-main) vào light mode của smartCv-fe

## Overview

Lấy toàn bộ design token màu sắc từ **source of truth** `cv-smart-ai-main/src/styles.css` và candidate home page `_public.index.tsx`, sau đó áp dụng chính xác vào light mode của `apps/web-candidate/src/index.css` trong smartCv-fe.

**Source of truth (read-only):** `/home/chuongpl/projects/smartCV/cv-smart-ai-main/cv-smart-ai-main`

---

## Màu sắc cần áp dụng (từ cv-smart-ai-main)

### CSS Variables (`:root` — light mode)

Tất cả biến dưới đây lấy nguyên từ `cv-smart-ai-main/src/styles.css` và dùng color space `oklch`:

#### Core Palette

| Variable | Giá trị oklch | Hex tương đương | Mục đích |
|---|---|---|---|
| `--background` | `oklch(0.985 0.005 247)` | `#F8FAFC` | Nền toàn trang |
| `--foreground` | `oklch(0.18 0.04 265)` | `#0F172A` | Text chính |
| `--card` | `oklch(1 0 0)` | `#FFFFFF` | Nền card |
| `--card-foreground` | `oklch(0.18 0.04 265)` | `#0F172A` | Text trên card |
| `--popover` | `oklch(1 0 0)` | `#FFFFFF` | Nền popover |
| `--popover-foreground` | `oklch(0.18 0.04 265)` | `#0F172A` | Text popover |

#### Primary & Secondary

| Variable | Giá trị oklch | Hex tương đương | Mục đích |
|---|---|---|---|
| `--primary` | `oklch(0.33 0.13 265)` | `#1E3A8A` | Navy — button, link, highlight chính |
| `--primary-foreground` | `oklch(0.99 0 0)` | `#FEFEFE` | Text trên nền primary |
| `--secondary` | `oklch(0.965 0.01 250)` | `#F1F5F9` | Nền secondary, tag kỹ năng |
| `--secondary-foreground` | `oklch(0.25 0.07 265)` | `#1E293B` | Text trên nền secondary |

#### Muted & Accent

| Variable | Giá trị oklch | Hex tương đương | Mục đích |
|---|---|---|---|
| `--muted` | `oklch(0.965 0.01 250)` | `#F1F5F9` | Nền nhạt (icon bg, placeholder) |
| `--muted-foreground` | `oklch(0.55 0.03 257)` | `#64748B` | Text phụ, caption |
| `--accent` | `oklch(0.95 0.02 260)` | `#EEF2FF` | Hover state, accent bg |
| `--accent-foreground` | `oklch(0.25 0.07 265)` | `#1E293B` | Text trên nền accent |

#### Destructive & Border

| Variable | Giá trị oklch | Hex tương đương | Mục đích |
|---|---|---|---|
| `--destructive` | `oklch(0.58 0.22 27)` | `#DC2626` | Lỗi, xóa, nguy hiểm |
| `--destructive-foreground` | `oklch(0.99 0 0)` | `#FEFEFE` | Text trên nền destructive |
| `--border` | `oklch(0.92 0.012 255)` | `#E2E8F0` | Border mặc định |
| `--input` | `oklch(0.92 0.012 255)` | `#E2E8F0` | Border input field |
| `--ring` | `oklch(0.55 0.18 265)` | ~`#3B5FC0` | Focus ring |

#### Brand Semantic Tokens (custom — không có trong globals.css hiện tại)

| Variable | Giá trị oklch | Hex tương đương | Mục đích |
|---|---|---|---|
| `--brand` | `oklch(0.33 0.13 265)` | `#1E3A8A` | Alias của primary navy |
| `--brand-foreground` | `oklch(0.99 0 0)` | `#FEFEFE` | Text trên brand |
| `--brand-blue` | `oklch(0.55 0.2 263)` | `#2563EB` | Bright blue (CTA gradient, dark mode primary) |
| `--ai` | `oklch(0.51 0.25 295)` | `#7C3AED` | AI badge, AI-powered icon |
| `--ai-foreground` | `oklch(0.99 0 0)` | `#FEFEFE` | Text trên nền AI |
| `--ai-soft` | `oklch(0.95 0.04 295)` | `#F3E8FF` | Soft bg AI badge |
| `--success` | `oklch(0.62 0.17 145)` | `#16A34A` | Kỹ năng phù hợp, trạng thái tốt |
| `--success-soft` | `oklch(0.95 0.07 145)` | `#DCFCE7` | Soft bg success badge |
| `--warning` | `oklch(0.78 0.16 75)` | `#F59E0B` | Cảnh báo |
| `--warning-soft` | `oklch(0.96 0.07 90)` | `#FEF3C7` | Soft bg warning badge |
| `--danger` | `oklch(0.58 0.22 27)` | `#DC2626` | Kỹ năng còn thiếu, lỗi |
| `--danger-soft` | `oklch(0.95 0.04 25)` | `#FEE2E2` | Soft bg danger badge |

### Sidebar Tokens (cần cho dashboard layout)

| Variable | Giá trị oklch | Mục đích |
|---|---|---|
| `--sidebar` | `oklch(1 0 0)` | Nền sidebar |
| `--sidebar-foreground` | `oklch(0.18 0.04 265)` | Text trong sidebar |
| `--sidebar-primary` | `oklch(0.33 0.13 265)` | Primary trong sidebar |
| `--sidebar-primary-foreground` | `oklch(0.99 0 0)` | Text trên sidebar primary |
| `--sidebar-accent` | `oklch(0.965 0.01 250)` | Hover/active sidebar item |
| `--sidebar-accent-foreground` | `oklch(0.25 0.07 265)` | Text hover sidebar |
| `--sidebar-border` | `oklch(0.92 0.012 255)` | Border sidebar |
| `--sidebar-ring` | `oklch(0.55 0.18 265)` | Focus ring sidebar |

---

## CSS Utilities cần copy nguyên văn

Lấy từ `cv-smart-ai-main/src/styles.css`, thêm vào `@layer utilities` trong `index.css`:

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

**Lưu ý:** `.card-surface` được dùng rộng rãi trong `_public.index.tsx` để thay cho `border border-border bg-card`. Khi light mode active, card sẽ hiển thị nền trắng với border nhạt và double shadow nhẹ.

---

## Màu sắc đang dùng trong home page (_public.index.tsx)

### Tailwind classes trong home page

| Class | Ánh xạ variable | Mục đích trong trang |
|---|---|---|
| `text-primary` | `--primary` (#1E3A8A) | Text highlight "thông minh hơn" trong h1 |
| `text-muted-foreground` | `--muted-foreground` (#64748B) | Text mô tả, caption, label nhỏ |
| `text-ai` | `--ai` (#7C3AED) | Badge "AI Features", icon Sparkles |
| `text-success` | `--success` (#16A34A) | CheckCircle2 icon, tag kỹ năng phù hợp |
| `text-danger` | `--danger` (#DC2626) | Tag kỹ năng còn thiếu |
| `bg-ai-soft` | `--ai-soft` (#F3E8FF) | Nền badge AI powered, AI insight box |
| `bg-success-soft` | `--success-soft` (#DCFCE7) | Nền tag kỹ năng phù hợp |
| `bg-danger-soft` | `--danger-soft` (#FEE2E2) | Nền tag kỹ năng còn thiếu |
| `bg-ai` | `--ai` (#7C3AED) | Nền icon Brain (AI Analysis card) |
| `bg-primary/10` | `--primary` 10% opacity | Nền icon Zap (AI Auto Screening) |
| `bg-muted` | `--muted` (#F1F5F9) | Nền icon company logo placeholder |
| `bg-secondary` | `--secondary` (#F1F5F9) | Nền tag kỹ năng trong job card |
| `text-secondary-foreground` | `--secondary-foreground` | Text tag kỹ năng trong job card |
| `border-ai/20` | `--ai` 20% opacity | Border AI badge, AI insight box |
| `border-success/20` | `--success` 20% opacity | Border tag kỹ năng phù hợp |
| `border-danger/20` | `--danger` 20% opacity | Border tag kỹ năng còn thiếu |
| `border-border` | `--border` (#E2E8F0) | Border mặc định, divider |
| `border-primary/30` | `--primary` 30% opacity | Border hover trên job card |
| `border-white/20` | trắng 20% opacity | Border trong Employer CTA (dark bg) |
| `bg-gradient-to-br from-primary to-brand-blue` | #1E3A8A → #2563EB | Employer CTA section gradient |
| `text-primary-foreground` | `--primary-foreground` | Text trong Employer CTA |
| `bg-white/10` | trắng 10% opacity | Stats boxes trong CTA |
| `ai-gradient` (utility) | gradient oklch AI | Hero section overlay (opacity-60) |
| `card-surface` (utility) | white card + border + shadow | Tất cả card (AI Match, job cards, search bar, feature cards) |

### Màu sắc Background theo section

| Section | Background | Class/Variable |
|---|---|---|
| Hero section | `ai-gradient` overlay 60% + `--background` (#F8FAFC) | `relative overflow-hidden` + `ai-gradient opacity-60` |
| Job search bar | `card-surface` (white) | `.card-surface` |
| AI Features | `--background` (#F8FAFC) | trang tự kế thừa |
| Job cards | `card-surface` (white) | `.card-surface` |
| Employer CTA | gradient `#1E3A8A → #2563EB` | `bg-gradient-to-br from-primary to-brand-blue` |
| Stats trong CTA | `white/10` blur | `bg-white/10` |

---

## Kế hoạch thực hiện

### Bước 1 — Cập nhật `@theme` block trong `packages/ui/src/globals.css`

Thêm mapping cho các custom token mới vào `@theme inline { ... }`:

```css
--color-brand: var(--brand);
--color-brand-foreground: var(--brand-foreground);
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
```

**File cần sửa:** `packages/ui/src/globals.css`

### Bước 2 — Thay thế `:root` trong `apps/web-candidate/src/index.css`

Thay toàn bộ khối `:root { ... }` hiện tại (đang là dark navy) bằng light mode token từ reference:

```css
:root {
  --radius: 0.75rem;

  --background: oklch(0.985 0.005 247);
  --foreground: oklch(0.18 0.04 265);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.18 0.04 265);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.18 0.04 265);

  --primary: oklch(0.33 0.13 265);
  --primary-foreground: oklch(0.99 0 0);
  --secondary: oklch(0.965 0.01 250);
  --secondary-foreground: oklch(0.25 0.07 265);
  --muted: oklch(0.965 0.01 250);
  --muted-foreground: oklch(0.55 0.03 257);
  --accent: oklch(0.95 0.02 260);
  --accent-foreground: oklch(0.25 0.07 265);
  --destructive: oklch(0.58 0.22 27);
  --destructive-foreground: oklch(0.99 0 0);
  --border: oklch(0.92 0.012 255);
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

  --brand: oklch(0.33 0.13 265);
  --brand-foreground: oklch(0.99 0 0);
  --brand-blue: oklch(0.55 0.2 263);
  --ai: oklch(0.51 0.25 295);
  --ai-foreground: oklch(0.99 0 0);
  --ai-soft: oklch(0.95 0.04 295);
  --success: oklch(0.62 0.17 145);
  --success-soft: oklch(0.95 0.07 145);
  --warning: oklch(0.78 0.16 75);
  --warning-soft: oklch(0.96 0.07 90);
  --danger: oklch(0.58 0.22 27);
  --danger-soft: oklch(0.95 0.04 25);
}
```

**File cần sửa:** `apps/web-candidate/src/index.css`

### Bước 3 — Cập nhật dark mode trong `apps/web-candidate/src/index.css`

Giữ nguyên hoặc điều chỉnh `.dark { ... }` hiện tại. Theo issue `20260529_web_candidate_design_fidelity_and_dark_mode.md`, dark mode dùng `--brand-blue` (#2563EB) làm primary thay vì navy:

```css
.dark {
  --background: oklch(0.12 0.03 265);
  --foreground: oklch(0.95 0.01 255);
  --card: oklch(0.16 0.03 265);
  --card-foreground: oklch(0.95 0.01 255);
  --primary: oklch(0.55 0.2 263);       /* brand-blue làm primary */
  --primary-foreground: oklch(0.99 0 0);
  --secondary: oklch(0.22 0.04 265);
  --secondary-foreground: oklch(0.85 0.01 255);
  --muted: oklch(0.22 0.04 265);
  --muted-foreground: oklch(0.65 0.02 255);
  --accent: oklch(0.22 0.04 265);
  --accent-foreground: oklch(0.85 0.01 255);
  --destructive: oklch(0.45 0.2 27);
  --destructive-foreground: oklch(0.99 0 0);
  --border: oklch(0.25 0.03 265);
  --input: oklch(0.25 0.03 265);
  --ring: oklch(0.55 0.2 263);
  --brand: oklch(0.55 0.2 263);
  --brand-blue: oklch(0.55 0.2 263);
  --ai: oklch(0.65 0.2 295);
  --ai-soft: oklch(0.22 0.05 295);
  --success: oklch(0.72 0.17 145);
  --success-soft: oklch(0.22 0.06 145);
  --warning: oklch(0.82 0.16 75);
  --warning-soft: oklch(0.22 0.06 75);
  --danger: oklch(0.65 0.22 27);
  --danger-soft: oklch(0.22 0.05 27);
}
```

### Bước 4 — Thêm CSS utilities vào `apps/web-candidate/src/index.css`

Copy nguyên văn từ `cv-smart-ai-main/src/styles.css`:

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

### Bước 5 — Xóa các custom vars cũ không còn dùng

Trong `index.css`, xóa các biến thuộc hệ thống dark navy cũ không còn cần thiết sau khi đã chuyển sang oklch token system:
- `--header-bg`, `--footer-bg`
- `--surface-1`, `--surface-2`, `--surface-soft`
- `--border-soft`
- `--text-main`, `--text-sub`, `--text-accent`
- `--shadow-elevate`, `--shadow-elevate-light`
- Xóa khối `body.theme-light { ... }` (không còn dùng toggle class nữa)

Xóa CSS utilities cũ nếu có:
- `.theme-header-bg`, `.theme-footer-bg`, `.theme-surface-*`, `.theme-border`, `.theme-text-*`

### Bước 6 — Cập nhật `@theme` trong `packages/ui/src/globals.css`

Đảm bảo `globals.css` expose đủ color token cho Tailwind, bao gồm `--color-sidebar-*` (hiện tại chưa có nếu dùng `@smart-cv/ui` package):

```css
@theme inline {
  /* ... existing tokens ... */
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}
```

---

## Acceptance Criteria

- [ ] Light mode (`prefers-color-scheme: light` hoặc mặc định) hiển thị background `#F8FAFC` thay vì navy
- [ ] `text-primary` ra màu navy `#1E3A8A`, không phải xanh dark cũ
- [ ] `text-muted-foreground` ra màu `#64748B` (readable trên nền trắng)
- [ ] Badge AI hiển thị nền `#F3E8FF` + text `#7C3AED`
- [ ] Tag kỹ năng phù hợp: nền `#DCFCE7` + text `#16A34A`
- [ ] Tag kỹ năng thiếu: nền `#FEE2E2` + text `#DC2626`
- [ ] `.card-surface` cho ra card trắng với border xám nhạt và double shadow nhẹ
- [ ] Employer CTA section có gradient `#1E3A8A → #2563EB`
- [ ] Dark mode vẫn hoạt động đúng (background dark, primary là `#2563EB`)
- [ ] Không còn màu navy `#111844` hay `#1f2833` xuất hiện ở light mode

---

## Files cần sửa

| File | Thay đổi |
|---|---|
| `packages/ui/src/globals.css` | Thêm `--color-brand-*`, `--color-ai-*`, `--color-success-*`, `--color-warning-*`, `--color-danger-*`, `--color-sidebar-*` vào `@theme inline` |
| `apps/web-candidate/src/index.css` | Thay `:root` bằng oklch light tokens; cập nhật `.dark`; thêm `.card-surface` + `.ai-gradient`; xóa custom vars cũ |

## Files không cần sửa

- `apps/web-candidate/src/routes/_public.index.tsx` — các Tailwind class đã đúng với reference, chỉ cần token đúng là hiển thị đúng
- `packages/ui/src/components/ui/*` — component không đổi
