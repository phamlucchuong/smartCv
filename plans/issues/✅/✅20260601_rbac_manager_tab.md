# [feat] RBAC Manager tab cho web-admin (matrix Resource × Permission theo Role)

## Overview

Thêm một tab/màn hình mới **RBAC Manager** (Phân quyền) vào `apps/web-admin` để quản trị viên cấu hình quyền (permission) của từng **Role** trên từng **Resource** trong hệ thống.

Mỗi resource có 4 quyền cơ bản theo mô hình CRUD (**Create / Read / Update / Delete**); một số resource có thêm quyền đặc thù (ví dụ `upload`, `download`, `export`, `approve`, `verify`, `refund`).

Màn hình dùng **layout matrix**: chọn 1 Role → hiển thị bảng với **hàng = Resource**, **cột = Permission** (C, R, U, D + các perm phụ), mỗi ô là một switch/checkbox bật/tắt. Ô không áp dụng cho resource đó hiển thị `—` (disabled).

**Scope của issue này: chỉ UI/design với mock data** (giống các trang admin hiện có như `admin.users.tsx`, `admin.settings.tsx`). Nút lưu chỉ cập nhật local state, **chưa wire API**. Việc tích hợp API tách thành issue riêng sau.

## Goals

- [ ] Thêm route `/admin/rbac` và mục nav "Phân quyền" (RBAC) vào `AdminLayout`.
- [ ] Panel trái: danh sách Role + nút tạo Role mới (custom).
- [ ] Panel phải: matrix Resource × Permission cho Role đang chọn.
- [ ] Hỗ trợ 3 role hệ thống cố định (không xóa được) + tạo/sửa/xóa custom role.
- [ ] Quyền cơ bản CRUD + perm phụ theo từng resource.
- [ ] Toàn bộ chuỗi hiển thị qua i18n (`admin_rbac_*`), có cả EN và VI.
- [ ] Light & dark mode hoạt động đúng (theme toggle đã có trong layout).

## Non-goals (Out of scope)

- Gọi API thật / lưu xuống backend (làm ở issue sau).
- Gán role cho user cụ thể (đó là phần của `admin.users.tsx`, không thuộc issue này).
- Phân quyền cấp field-level hoặc theo điều kiện (chỉ làm cấp resource × action).
- Audit log cho thay đổi permission (đã có trang `admin.audit-logs.tsx` riêng).

## UI/UX design

### Bố cục tổng thể

Trang nằm trong `AdminLayout` (sidebar + header sẵn có). Nội dung chia 2 cột:

```
┌───────────────────────────────────────────────────────────────────────┐
│ Phân quyền (RBAC)                                  [ + Tạo vai trò mới ] │
├──────────────────┬────────────────────────────────────────────────────┤
│  Roles           │  Vai trò: Recruiter           [System]   [Lưu] [Hủy] │
│  ──────────────  │  Mô tả: Nhà tuyển dụng...                            │
│  ▸ Admin   [Hệ.] │  ┌──────────────┬───┬───┬───┬───┬────────┬─────────┐ │
│  ▸ Recruiter ◀── │  │ Resource     │ C │ R │ U │ D │ upload │ download│ │
│  ▸ Candidate     │  ├──────────────┼───┼───┼───┼───┼────────┼─────────┤ │
│  ▸ Moderator (x) │  │ Users        │ ☑ │ ☑ │ ☑ │ ☐ │   —    │    —    │ │
│  ▸ ...           │  │ Jobs         │ ☑ │ ☑ │ ☐ │ ☐ │   —    │    —    │ │
│                  │  │ CVs          │ ☐ │ ☑ │ ☐ │ ☐ │   ☑    │    ☑    │ │
│                  │  │ Payments     │ ☐ │ ☑ │ ☐ │ ☐ │   —    │    ☑    │ │
│                  │  │ ...          │   │   │   │   │        │         │ │
│                  │  └──────────────┴───┴───┴───┴───┴────────┴─────────┘ │
└──────────────────┴────────────────────────────────────────────────────┘
```

### Panel trái — Role list

- `card-surface`, danh sách các role dưới dạng item bấm chọn (active highlight giống nav: `bg-primary/10 text-primary border-primary/20`).
- Mỗi role hiển thị: tên role, badge `Hệ thống` nếu là role hệ thống.
  - **Lưu ý:** `StatusBadge` local **chỉ nhận prop `status`** (không có prop `tone`) và map cứng một enum status sang màu light-mode (không có biến thể `dark:`). Vì vậy **không** dùng `StatusBadge` cho badge này. Thay bằng một `<span>` dùng theme token (`bg-muted text-muted-foreground border border-border rounded-full px-2 py-0.5 text-xs`) hoặc component `Badge` từ `@smart-cv/ui` — để text i18n ("System"/"Hệ thống") và dark mode đều đúng.
- Role custom có icon nút **xóa** (trash) khi hover; role hệ thống **không** có nút xóa.
- Nút **"+ Tạo vai trò mới"** ở header phải (hoặc đầu panel trái) → mở `Dialog` (`@smart-cv/ui`) nhập tên + mô tả → thêm vào danh sách (local state), khởi tạo permission rỗng.
- Khi chọn role → panel phải load permission của role đó.

### Panel phải — Permission matrix

- Header: tên role đang chọn + badge loại role + ô nhập **mô tả** (textarea/input). Với role hệ thống, tên không sửa được; custom role thì sửa được.
- Bảng matrix dùng `<table>` + class `card-surface overflow-x-auto` (giống `admin.users.tsx`):
  - **Cột đầu**: tên Resource (sticky-left khi scroll ngang nếu khả thi).
  - **Các cột tiếp theo**: 4 cột cơ bản `C R U D`, sau đó các cột perm phụ (union của tất cả perm phụ xuất hiện trong danh sách resource: `upload`, `download`, `export`, `approve`, `verify`, `refund`).
  - Mỗi ô: dùng `Switch` (`@smart-cv/ui`, Radix-based — props thực tế: `checked`, `onCheckedChange`, `disabled`) hoặc checkbox. Ô không áp dụng cho resource đó → render `—` (`text-muted-foreground`, không tương tác).
  - Header cột có tooltip/label đầy đủ (C=Create, R=Read, U=Update, D=Delete...).
- Tiện ích hàng/cột (nice-to-have, không bắt buộc cho prototype):
  - Checkbox "chọn tất cả" ở đầu mỗi hàng resource (bật/tắt mọi perm áp dụng của resource đó).
  - Header mỗi cột có thể bấm để toggle toàn cột.
- Footer: nút **Lưu** (primary) + **Hủy/Reset** (outline). Hiện trạng prototype: cập nhật local state + toast `sonner` "Đã lưu (demo)".
- Role hệ thống **Admin** mặc định bật toàn bộ (full access); có thể để các switch ở trạng thái checked + disabled để thể hiện "super admin luôn full quyền" (tùy chọn — nêu rõ trong code comment).

### Trạng thái rỗng / loading

- Khi chưa chọn role: panel phải hiển thị empty state ("Chọn một vai trò để xem & chỉnh sửa quyền").

## Data model (mock, định nghĩa trong file route hoặc `lib/rbac-data.ts`)

```ts
type PermAction = 'create' | 'read' | 'update' | 'delete'
  | 'upload' | 'download' | 'export' | 'approve' | 'verify' | 'refund'

interface ResourceDef {
  key: string            // 'users', 'jobs', ...
  labelKey: string       // i18n key
  actions: PermAction[]  // các action áp dụng cho resource này (luôn gồm CRUD + perm phụ nếu có)
}

interface Role {
  id: string
  name: string
  description?: string
  system: boolean        // true = role hệ thống, không xóa/đổi tên
  // permissions: map resourceKey -> set các action đang bật
  permissions: Record<string, PermAction[]>
}
```

### Danh sách Resource & perm phụ (theo các domain admin hiện có)

| Resource key            | Label (VI)         | CRUD | Perm phụ                  |
|-------------------------|--------------------|------|---------------------------|
| `users`                 | Người dùng         | ✓    | —                         |
| `employer_verification` | Xác minh NTD       | ✓    | `verify`                  |
| `jobs`                  | Tin tuyển dụng     | ✓    | `approve`                 |
| `cvs`                   | Hồ sơ / CV         | ✓    | `upload`, `download`, `export` |
| `packages`              | Gói dịch vụ        | ✓    | —                         |
| `payments`              | Thanh toán         | ✓    | `refund`, `export`        |
| `ai_config`             | Cấu hình AI        | ✓    | —                         |
| `system_settings`       | Hệ thống           | ✓    | —                         |
| `audit_logs`            | Audit Logs         | ✓    | `export`                  |

> Union cột perm phụ trên toàn bảng: `verify`, `approve`, `upload`, `download`, `export`, `refund`.

### Role hệ thống mặc định (mock)

- `admin` — Quản trị viên (system, full quyền tất cả resource).
- `recruiter` — Nhà tuyển dụng (system, quyền hạn chế trên jobs/cvs/payments của họ).
- `candidate` — Ứng viên (system, chủ yếu read + upload/download CV).

Cộng thêm vài custom role demo (vd `moderator`) để minh hoạ tạo/xóa.

## i18n keys cần thêm

Thêm vào `packages/i18n/src/locales/en/common.json` và `packages/i18n/src/locales/vi/common.json` (theo prefix `admin_rbac_*`), ví dụ:

```
admin_nav_rbac                 -> "Permissions" / "Phân quyền"
admin_rbac_title               -> "Role & Permissions" / "Vai trò & Phân quyền"
admin_rbac_create_role         -> "Create role" / "Tạo vai trò mới"
admin_rbac_role_system_badge   -> "System" / "Hệ thống"
admin_rbac_role_name           -> "Role name" / "Tên vai trò"
admin_rbac_role_desc           -> "Description" / "Mô tả"
admin_rbac_col_resource        -> "Resource" / "Tài nguyên"
admin_rbac_perm_create         -> "Create" / "Tạo"
admin_rbac_perm_read           -> "Read" / "Xem"
admin_rbac_perm_update         -> "Update" / "Sửa"
admin_rbac_perm_delete         -> "Delete" / "Xóa"
admin_rbac_perm_upload         -> "Upload" / "Tải lên"
admin_rbac_perm_download       -> "Download" / "Tải xuống"
admin_rbac_perm_export         -> "Export" / "Xuất"
admin_rbac_perm_approve        -> "Approve" / "Duyệt"
admin_rbac_perm_verify         -> "Verify" / "Xác minh"
admin_rbac_perm_refund         -> "Refund" / "Hoàn tiền"
admin_rbac_empty               -> "Select a role to view & edit permissions" / "Chọn một vai trò để xem & chỉnh sửa quyền"
admin_rbac_save                -> "Save" / "Lưu"
admin_rbac_cancel              -> "Cancel" / "Hủy"
admin_rbac_saved_toast         -> "Permissions saved (demo)" / "Đã lưu phân quyền (demo)"
admin_rbac_delete_role         -> "Delete role" / "Xóa vai trò"
admin_res_users / admin_res_jobs / ...  -> nhãn cho từng resource
```

> Đặt key resource label dùng chung nếu đã có (vd nav đã có `admin_nav_users`), nhưng nên tạo `admin_res_*` riêng để label trong matrix độc lập với nav.

## Impact scope

- [ ] Backend
- [x] Frontend (`apps/web-admin`)
- [x] i18n (`packages/i18n`)
- [ ] Database
- [ ] E2E

## Files to create / modify

**Tạo mới:**
- `apps/web-admin/src/routes/admin.rbac.tsx` — route + component chính (role list + matrix).
- `apps/web-admin/src/lib/rbac-data.ts` — mock data: resource defs + default roles (hoặc inline trong route nếu muốn gọn).
- (tùy chọn) `apps/web-admin/src/components/rbac/PermissionMatrix.tsx`, `RoleList.tsx`, `CreateRoleDialog.tsx` nếu tách component cho gọn.

**Sửa:**
- `apps/web-admin/src/components/layouts/AdminLayout.tsx` — thêm mục nav `{ to: '/admin/rbac', label: t('admin_nav_rbac'), icon: ShieldHalf | KeyRound | Lock }`. (Chọn icon từ `lucide-react`, ví dụ `KeyRound` hoặc `ShieldHalf`. Đặt vị trí hợp lý — đề xuất ngay dưới "Người dùng".)
- `apps/web-admin/src/routes/__root.tsx` — **mount `<Toaster />` từ `sonner`** (hiện `__root.tsx` chỉ render `<Outlet />`, chưa có Toaster nào trong app). Bắt buộc để `toast()` ở nút Lưu hiển thị được (AC #5).
- `packages/i18n/src/locales/en/common.json` & `.../vi/common.json` — thêm các key `admin_rbac_*`, `admin_res_*`, `admin_nav_rbac`.

`routeTree.gen.ts` tự sinh — **không sửa tay**.

## Component reuse

- `Button`, `Switch`, `Dialog`, `Input`, `Label`, `Table`, `Badge` từ `@smart-cv/ui` (đã có sẵn trong `packages/ui/src/components/ui/`). (Không cần `Tabs` cho thiết kế này.)
- **Không** dùng `StatusBadge` cho badge "Hệ thống" (xem lưu ý ở mục Panel trái — nó không có prop `tone` và hard-code màu light-mode). Dùng `Badge` của `@smart-cv/ui` hoặc `<span>` theme-token.
- `cn` từ `@/lib/utils`.
- `useTranslation` từ `@smart-cv/i18n`.
- `toast` từ `sonner` (đã là dependency).
- Style: class tiện ích `card-surface` (đã định nghĩa trong `index.css`).

## Acceptance criteria

1. Vào `/admin/rbac` thấy mục "Phân quyền" active trên sidebar.
2. Panel trái liệt kê 3 role hệ thống (có badge "Hệ thống", không có nút xóa) + ≥1 custom role.
3. Bấm "Tạo vai trò mới" → dialog → tạo được role custom mới, xuất hiện trong danh sách, xóa được.
4. Chọn role → matrix hiển thị đúng các resource (9 resource) với cột CRUD + perm phụ; ô không áp dụng hiển thị `—` và không bấm được.
5. Toggle switch trong ô cập nhật state; bấm "Lưu" hiện toast demo; "Hủy" revert thay đổi.
6. Toàn bộ label qua i18n, chuyển EN/VI bằng toggle trên header đổi đúng ngôn ngữ.
7. Hoạt động đúng ở cả light & dark mode; bảng scroll ngang được khi tràn (`overflow-x-auto`).
8. `pnpm -F web-admin lint` pass, không lỗi TypeScript.

## Notes

- Tham khảo pattern trang hiện có: `apps/web-admin/src/routes/admin.users.tsx` (table + StatusBadge), `admin.settings.tsx` (tab + field + nút save).
- Repo **chưa có** code RBAC nào trước đây (đã grep toàn bộ `apps/` và `cv-smart-ai-main/src`) → đây là nền tảng cho việc tích hợp API phân quyền sau này.
- Liên quan: `web-admin-design-plan.md` (kế hoạch tổng thể web-admin). Issue này là phần mở rộng ngoài 9 trang ban đầu.
