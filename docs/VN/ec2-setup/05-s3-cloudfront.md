# Bước 5: Cấu hình S3 + CloudFront

S3 lưu trữ các file tĩnh (HTML, JS, CSS) của 3 React app. CloudFront phân phối các file này đến người dùng nhanh hơn thông qua mạng CDN toàn cầu và cung cấp HTTPS miễn phí.

---

## 5.1 Cấu hình S3 Bucket

Bạn đã có S3 bucket. Bây giờ cần cấu hình nó để CloudFront có thể đọc file từ đó.

### Tạo cấu trúc thư mục trong S3

Trên **máy local**:

```bash
# Tạo 3 thư mục (prefix) trong bucket
# Thay "smartcv-frontend" bằng tên bucket thật của bạn

aws s3api put-object --bucket smartcv-frontend --key web-candidate/
aws s3api put-object --bucket smartcv-frontend --key web-recruiter/
aws s3api put-object --bucket smartcv-frontend --key web-admin/
```

### Tắt Block Public Access (để CloudFront có thể đọc)

> S3 sẽ **không** mở public trực tiếp — chỉ CloudFront mới có quyền đọc. Đây là cách làm đúng và an toàn nhất.

1. Vào AWS Console → **S3** → Click vào bucket của bạn
2. Chọn tab **Permissions**
3. Click **Edit** ở phần **Block public access**
4. **Bỏ tick** ô `Block all public access` → Save changes → Confirm

> **Lưu ý:** Bước này cho phép tạo bucket policy — bucket vẫn chưa public cho đến khi bạn thêm policy ở bước sau.

---

## 5.2 Tạo SSL Certificate cho CloudFront (bắt buộc ở us-east-1)

> **Quan trọng:** CloudFront **chỉ chấp nhận** certificate từ region `us-east-1` (N. Virginia). Dù bucket và EC2 của bạn ở `ap-southeast-1`, certificate này **phải** tạo ở `us-east-1`.

Trên máy local:

```bash
# Yêu cầu certificate (thay domain thật vào)
aws acm request-certificate \
  --domain-name "smartcv-chuongpl.io.vn" \
  --subject-alternative-names "*.smartcv-chuongpl.io.vn" \
  --validation-method DNS \
  --region us-east-1
```

Lệnh này trả về `CertificateArn` — lưu lại giá trị này.

### Xác thực domain ownership qua DNS

1. Vào AWS Console → **Certificate Manager** (ACM) → **Đổi region sang us-east-1** ở góc trên phải
2. Click vào certificate vừa tạo
3. Thấy trạng thái `Pending validation` và có bảng **Domains** với CNAME record cần tạo
4. Click **Create records in Route 53** (nếu dùng Route 53) HOẶC tự tạo CNAME record trên nhà cung cấp domain của bạn:

| Tên CNAME | Giá trị CNAME |
|-----------|---------------|
| `_abc123.smartcv-chuongpl.io.vn` | `_xyz456.acm-validations.aws.` |

5. Chờ 5–30 phút, trạng thái sẽ chuyển sang `Issued` (đã cấp)

---

## 5.3 Tạo CloudFront Distribution cho web-candidate

Làm bước này **3 lần** — một lần cho mỗi app. Bắt đầu với `web-candidate`.

### Tạo qua AWS Console

1. Vào **CloudFront** → **Create distribution**

2. **Origin**:
   - **Origin domain:** Click vào ô, chọn bucket S3 của bạn (ví dụ: `smartcv-frontend.s3.amazonaws.com`)
   - **Origin path:** `/web-candidate` ← quan trọng! Trỏ vào thư mục đúng
   - **Origin access:** Chọn **Origin access control settings (recommended)**
   - Click **Create new OAC** → đặt tên `smartcv-candidate-oac` → Create
   - AWS sẽ nhắc bạn cập nhật bucket policy sau — bỏ qua bây giờ

3. **Default cache behavior:**
   - **Viewer protocol policy:** Redirect HTTP to HTTPS
   - **Cache policy:** CachingDisabled (để test) → đổi sang CachingOptimized sau khi ổn định

4. **Settings:**
   - **Alternate domain names (CNAME):** `smartcv-chuongpl.io.vn` và `www.smartcv-chuongpl.io.vn`
   - **Custom SSL certificate:** Chọn certificate `*.smartcv-chuongpl.io.vn` vừa tạo ở bước 5.2
   - **Default root object:** `index.html`

5. **Custom error pages** (bắt buộc cho React SPA):
   - Click **Create custom error response**
   - HTTP error code: `403`
   - Response page path: `/index.html`
   - HTTP response code: `200`
   - Click Create
   - Làm tương tự cho code `404`

   > **Tại sao cần bước này?** React dùng client-side routing. Khi user truy cập `smartcv-chuongpl.io.vn/jobs/123` trực tiếp, S3 tìm file `jobs/123` → không có → trả 403/404. CloudFront phải redirect về `index.html` để React tự xử lý route.

6. Click **Create distribution**

7. **Cập nhật S3 Bucket Policy:**
   Sau khi tạo, CloudFront sẽ hiện thông báo "You must update the S3 bucket policy". Click **Copy policy** rồi:
   - Vào S3 → bucket → **Permissions** → **Bucket policy** → **Edit**
   - Dán policy vào → Save

### Lặp lại cho web-recruiter và web-admin

| App | Origin path | CNAME |
|-----|-------------|-------|
| web-recruiter | `/web-recruiter` | `recruiter.smartcv-chuongpl.io.vn` |
| web-admin | `/web-admin` | `admin.smartcv-chuongpl.io.vn` |

---

## 5.4 Cấu hình DNS trỏ về CloudFront

Sau khi tạo xong 3 CloudFront distributions, mỗi cái sẽ có một địa chỉ như `d1abc123.cloudfront.net`.

Tạo các CNAME record sau trên nhà cung cấp domain của bạn:

| Subdomain | Loại | Giá trị |
|-----------|------|---------|
| `@` (hoặc `smartcv-chuongpl.io.vn`) | CNAME / ALIAS | địa chỉ CloudFront của web-candidate |
| `www` | CNAME | địa chỉ CloudFront của web-candidate |
| `recruiter` | CNAME | địa chỉ CloudFront của web-recruiter |
| `admin` | CNAME | địa chỉ CloudFront của web-admin |

> **Nếu dùng apex domain** (`smartcv-chuongpl.io.vn` không có subdomain): Một số DNS provider không cho CNAME ở apex, dùng **ALIAS record** (Cloudflare, Route 53) hoặc đổi sang `www.smartcv-chuongpl.io.vn`.

---

## 5.5 Kiểm tra CloudFront hoạt động

Chờ CloudFront deploy xong (status chuyển từ `In Progress` sang `Deployed` — mất 5–15 phút).

```bash
# Test CloudFront distribution (dùng địa chỉ d1abc123.cloudfront.net trước)
curl -I https://d1abc123.cloudfront.net
# Phải thấy: HTTP/2 200

# Sau khi DNS cập nhật, test bằng domain thật
curl -I https://smartcv-chuongpl.io.vn
```

---

## Tóm tắt Bước 5

Sau bước này:
- [x] SSL certificate `*.smartcv-chuongpl.io.vn` đã cấp ở us-east-1
- [x] 3 CloudFront distributions đã tạo, mỗi cái trỏ vào đúng thư mục S3
- [x] React SPA routing đã cấu hình (custom error pages)
- [x] DNS đã trỏ subdomain về CloudFront

**Tiếp theo:** [Bước 6 — Build và Upload Frontend](./06-frontend-build.md)
