# [fix] Redesign trang 404 (NotFound) theo phong cách Ynex tối giản

## Overview

Thiết kế lại trang **404 / Not Found** của cả 3 app (`web-candidate`, `web-recruiter`, `web-admin`) theo mẫu **Ynex Error Page** (ảnh tham chiếu: `https://themeselection.com/wp-content/uploads/2024/08/09-Ynex-Error-React-Tailwind-Page.png`).

Thiết kế hiện tại dùng nền radial-gradient + blur blobs + card có viền + nhiều phần tử (label "Oops! Page Not Found", heading, sub-text, 3 nút/badge). Mẫu Ynex thì **tối giản**: nền phẳng, một con số "404" rất lớn, một dòng tiêu đề có emoji, một dòng mô tả, và **một nút duy nhất** "BACK TO HOME".

### Quyết định đã chốt (qua trao đổi)
- **Scope:** cả 3 app (candidate, recruiter, admin).
- **Nút:** chỉ **1 nút** "BACK TO HOME" như ảnh Ynex — **bỏ** nút "Go back" và badge tên app.
- **Text:** đưa qua **i18n** (thêm key EN + VI), không hardcode.
- **Dark mode:** dùng **theme token** (`bg-background`, `text-foreground`...) để trang tự đổi theo light/dark — nhất quán với theme toggle đã có trong app.

## Mô tả thiết kế đích (Ynex)

Bố cục căn giữa cả chiều ngang & dọc, nhiều khoảng trắng, không họa tiết nền:

```
                        4 0 4              ← rất lớn, đậm (font-black), màu foreground
        Oops 😱, The page you are looking for is not available.   ← đậm, cỡ vừa
     We are sorry for the inconvenience, The page you are
        trying to access has been removed or never existed.        ← sub-text, muted

                  [ ←  BACK TO HOME ]      ← nút primary (tím), chữ HOA, bo góc, text trắng
```

Chi tiết:
- **"404"**: con số rất lớn (vd `text-8xl md:text-9xl` hoặc lớn hơn), `font-black`, `tracking-tight`, màu `text-foreground` (đậm/đen ở light, sáng ở dark). Không dùng kiểu mờ `text-primary/15` như hiện tại.
- **Dòng tiêu đề**: đậm (`font-bold`/`font-semibold`), cỡ ~`text-lg`/`text-xl`, kèm emoji 😱. Text qua i18n.
- **Dòng mô tả**: `text-sm`/`text-base`, `text-muted-foreground`, căn giữa, max-width vừa phải (~`max-w-md`).
- **Nút "BACK TO HOME"**: `bg-primary text-primary-foreground`, bo góc (`rounded-lg`/`rounded-md`), padding thoải mái, chữ **HOA** (`uppercase`), kèm icon `ArrowLeft` ở đầu. Là `<Link>` của TanStack Router trỏ về trang chủ tương ứng từng app.
- Không còn: radial-gradient overlay, blur blobs, card viền/shadow, label "Oops! Page Not Found", nút "Go back", badge tên app.

### Đích điều hướng nút theo từng app
| App | Nút "BACK TO HOME" trỏ về |
|-----|---------------------------|
| web-candidate | `/` |
| web-recruiter | `/employer` |
| web-admin | `/admin` |

## Reproduction steps (hiện trạng)
1. Mở bất kỳ app nào trong 3 app.
2. Truy cập một URL không tồn tại (vd `/khong-ton-tai`).
3. `notFoundComponent` render trang 404 hiện tại (nền gradient + blob + card + 3 phần tử).

## Expected behavior
- Trang 404 hiển thị theo phong cách Ynex tối giản như mô tả trên, ở cả 3 app.
- Text lấy từ i18n, hỗ trợ EN/VI.
- Tự thích ứng light/dark mode qua theme token.
- Chỉ một nút "BACK TO HOME" trỏ đúng trang chủ từng app.

## Current behavior
- 3 app dùng chung 1 thiết kế cũ: nền `radial-gradient` + 2 blur blob, một `<p>` "404" cỡ lớn màu mờ `text-primary/15`, card `rounded-3xl border bg-card/85 shadow-xl backdrop-blur`, label uppercase "Oops! Page Not Found", heading "We couldn't find that page", sub-text, và 3 phần tử: nút Home/Dashboard, nút "Go back" (`window.history.back()`), badge tên app. Toàn bộ text **hardcode tiếng Anh**.

## Impact scope
- [ ] Backend
- [x] Frontend (web-candidate, web-recruiter, web-admin)
- [x] i18n (`packages/i18n`)
- [ ] Database
- [ ] E2E

## Related code

**File chứa `NotFoundPage` (sửa cả 3):**
- `apps/web-candidate/src/routes/__root.tsx` — `function NotFoundPage()` (~dòng 403–439). **Đã** import `useTranslation`, `i18n` từ `@smart-cv/i18n` và `Button` từ `@smart-cv/ui`. Hiện dùng `min-h-[72vh]` (404 nằm trong layout có chrome/header).
- `apps/web-recruiter/src/routes/__root.tsx` — `function NotFoundPage()` (dòng 13–47). **Chưa** import i18n → cần thêm `import { useTranslation } from '@smart-cv/i18n'`. Hiện dùng `min-h-screen` (standalone, full màn hình).
- `apps/web-admin/src/routes/__root.tsx` — `function NotFoundPage()` (dòng 15–49). **Chưa** import i18n → cần thêm import. Hiện dùng `min-h-screen` standalone. Lưu ý file này còn render `<Toaster richColors />` trong root component — **giữ nguyên**, chỉ sửa `NotFoundPage`.

**File i18n (thêm key):**
- `packages/i18n/src/locales/en/common.json`
- `packages/i18n/src/locales/vi/common.json`
- (Cấu trúc key phẳng, namespace `common`, dùng `t('key')`.)

### i18n keys đề xuất

Thêm vào `en/common.json` và `vi/common.json`:

```
not_found_title    EN: "404"                                         VI: "404"
not_found_heading  EN: "Oops 😱, The page you are looking for is not available."
                   VI: "Rất tiếc 😱, trang bạn tìm không khả dụng."
not_found_desc     EN: "We are sorry for the inconvenience. The page you are trying to access has been removed or never existed."
                   VI: "Chúng tôi xin lỗi vì sự bất tiện này. Trang bạn truy cập đã bị gỡ hoặc chưa từng tồn tại."
not_found_back_home EN: "Back to home"                               VI: "Về trang chủ"
```

> Nút dùng `uppercase` ở CSS nên text giữ chữ thường trong i18n, để dịch hiển thị tự nhiên cả 2 ngôn ngữ.

## Implementation notes

- **Giữ nguyên chiều cao theo từng app**: candidate `min-h-[72vh]` (vì nằm trong layout có header/footer), recruiter & admin `min-h-screen` (standalone). Không đổi hành vi này để không phá layout sẵn có.
- **Recruiter & Admin**: phải thêm `import { useTranslation } from '@smart-cv/i18n'` và gọi `const { t } = useTranslation()` trong `NotFoundPage`. Candidate đã có sẵn.
- **Bỏ import thừa sau khi xóa phần tử cũ**: `Home`, `Search` (lucide-react) có thể không còn dùng → dọn import để lint sạch. Giữ `ArrowLeft` cho icon nút.
- Dùng `<Link to="...">` (TanStack Router) cho nút, không dùng `<a>`.
- Có thể tách thành component dùng chung không? → **Không bắt buộc** cho issue này; mỗi app sửa tại chỗ trong `__root.tsx` vì đích nút khác nhau. (Nếu muốn refactor về `@smart-cv/ui` thì tách issue riêng.)

## Acceptance criteria
1. Truy cập URL không tồn tại ở **cả 3 app** → hiện trang 404 phong cách Ynex (404 lớn đậm, 1 dòng tiêu đề + emoji, 1 dòng mô tả muted, 1 nút "BACK TO HOME"). Không còn gradient/blob/card/badge/nút "Go back".
2. Nút "BACK TO HOME" trỏ đúng: candidate→`/`, recruiter→`/employer`, admin→`/admin`.
3. Text hiển thị qua i18n; chuyển EN/VI bằng toggle đổi đúng ngôn ngữ.
4. Light & dark mode đều hiển thị đúng (dùng theme token).
5. `pnpm -F web-candidate lint`, `pnpm -F web-recruiter lint`, `pnpm -F web-admin lint` pass; không lỗi TypeScript, không import thừa.
6. `<Toaster richColors />` trong admin `__root.tsx` vẫn còn nguyên.

## Notes
- Không có issue 404 nào trước đây trong `docs/issues/`.
- Mẫu tham chiếu là Ynex (ThemeSelection) — chỉ lấy **bố cục & phong cách tối giản**, không cần khớp pixel-perfect font/màu của theme đó; dùng design token sẵn có của SmartCV (primary tím đã khớp với nút tím trong ảnh).
