# Bước 7: CI/CD với GitHub Actions

Từ bước này trở đi, mỗi khi bạn push code lên GitHub, hệ thống sẽ tự động:
- **Backend thay đổi** → build Docker image → push ECR → SSH vào EC2 → deploy
- **Frontend thay đổi** → build React → upload S3 → xóa CloudFront cache

Bạn không cần SSH thủ công nữa.

---

## 7.1 Cấp thêm quyền cho IAM User

IAM User `smartcv-deploy` (tạo ở Bước 1) cần thêm quyền SSH vào EC2 thông qua SSM (không cần mở port 22 ra internet):

1. Vào **IAM** → **Users** → `smartcv-deploy` → **Add permissions**
2. Attach policy: `AmazonSSMManagedInstanceCore`

Ngoài ra, đảm bảo EC2 instance cũng được gắn policy này qua IAM Role (đã làm ở Bước 3.5, thêm policy `AmazonSSMManagedInstanceCore` vào role `EC2-ECR-ReadOnly`).

---

## 7.2 Lưu Secrets vào GitHub

GitHub Secrets là nơi lưu thông tin nhạy cảm (credentials, keys) — chúng được mã hóa và chỉ GitHub Actions mới đọc được.

### Cách thêm Secret

1. Vào repository GitHub của bạn
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Thêm từng secret theo bảng dưới

### Danh sách Secrets cần tạo

| Secret Name | Giá trị | Lấy từ đâu |
|-------------|---------|------------|
| `AWS_ACCESS_KEY_ID` | Access Key ID của IAM User | Bước 1.2 |
| `AWS_SECRET_ACCESS_KEY` | Secret Access Key của IAM User | Bước 1.2 |
| `AWS_REGION` | `ap-southeast-1` | Region của bạn |
| `AWS_ACCOUNT_ID` | ID tài khoản AWS | Chạy `aws sts get-caller-identity --query Account --output text` |
| `EC2_INSTANCE_ID` | ID của EC2 instance | Trong EC2 Console (dạng `i-0abc123...`) |
| `S3_BUCKET_NAME` | `smartcv-frontend` | Tên bucket S3 |
| `CF_DIST_ID_CANDIDATE` | Distribution ID CloudFront candidate | CloudFront Console |
| `CF_DIST_ID_RECRUITER` | Distribution ID CloudFront recruiter | CloudFront Console |
| `CF_DIST_ID_ADMIN` | Distribution ID CloudFront admin | CloudFront Console |

---

## 7.3 Tạo Workflow Deploy Backend

Tạo file workflow cho backend:

```bash
mkdir -p .github/workflows
```

Tạo file `.github/workflows/backend-deploy.yml`:

```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - '.github/workflows/backend-deploy.yml'

jobs:
  deploy:
    name: Build, Push to ECR, Deploy to EC2
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Set up JDK 21 (để build Java services)
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: maven

      - name: Build and push API Gateway
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        run: |
          cd backend/api-gateway
          docker build -t $ECR_REGISTRY/smartcv/api-gateway:latest .
          docker push $ECR_REGISTRY/smartcv/api-gateway:latest

      - name: Build and push User Service
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        run: |
          cd backend/user-service
          docker build -t $ECR_REGISTRY/smartcv/user-service:latest .
          docker push $ECR_REGISTRY/smartcv/user-service:latest

      - name: Build and push Job Service
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        run: |
          cd backend/job_service
          docker build -t $ECR_REGISTRY/smartcv/job-service:latest .
          docker push $ECR_REGISTRY/smartcv/job-service:latest

      - name: Build and push Application Service
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        run: |
          cd backend/application_service
          docker build -t $ECR_REGISTRY/smartcv/application-service:latest .
          docker push $ECR_REGISTRY/smartcv/application-service:latest

      - name: Build and push Notification Service (Go)
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        run: |
          cd backend/notification-service
          docker build -t $ECR_REGISTRY/smartcv/notification-service:latest .
          docker push $ECR_REGISTRY/smartcv/notification-service:latest

      - name: Build and push AI Engine Service
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        run: |
          cd backend/ai_engine_service
          docker build -t $ECR_REGISTRY/smartcv/ai-engine-service:latest .
          docker push $ECR_REGISTRY/smartcv/ai-engine-service:latest

      - name: Deploy to EC2 via SSM
        run: |
          aws ssm send-command \
            --instance-ids "${{ secrets.EC2_INSTANCE_ID }}" \
            --document-name "AWS-RunShellScript" \
            --parameters 'commands=[
              "cd /home/ubuntu/apps/smartcv/backend",
              "git pull origin main",
              "aws ecr get-login-password --region ${{ secrets.AWS_REGION }} | docker login --username AWS --password-stdin ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.${{ secrets.AWS_REGION }}.amazonaws.com",
              "docker compose -f docker-compose.prod.yaml pull",
              "docker compose -f docker-compose.prod.yaml up -d --remove-orphans",
              "docker image prune -f"
            ]' \
            --comment "Deploy SmartCV Backend" \
            --output text
```

---

## 7.4 Tạo Workflow Deploy Frontend

Tạo file `.github/workflows/frontend-deploy.yml`:

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'
      - '.github/workflows/frontend-deploy.yml'

jobs:
  deploy:
    name: Build and Deploy to S3 + CloudFront
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Install dependencies
        run: |
          cd frontend
          pnpm install --frozen-lockfile

      - name: Build all apps
        env:
          VITE_API_BASE_URL: https://api.smartcv-chuongpl.io.vn
          VITE_I18N_DEFAULT_LOCALE: vi
          VITE_I18N_FALLBACK_LOCALE: en
        run: |
          cd frontend
          pnpm build

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}

      - name: Upload web-candidate to S3
        run: |
          # Upload assets (cache 1 năm)
          aws s3 sync frontend/apps/web-candidate/dist/ \
            s3://${{ secrets.S3_BUCKET_NAME }}/web-candidate/ \
            --delete \
            --exclude "index.html" \
            --cache-control "public, max-age=31536000, immutable"

          # Upload index.html (no cache)
          aws s3 cp frontend/apps/web-candidate/dist/index.html \
            s3://${{ secrets.S3_BUCKET_NAME }}/web-candidate/index.html \
            --cache-control "no-cache, no-store, must-revalidate" \
            --content-type "text/html"

      - name: Upload web-recruiter to S3
        run: |
          aws s3 sync frontend/apps/web-recruiter/dist/ \
            s3://${{ secrets.S3_BUCKET_NAME }}/web-recruiter/ \
            --delete \
            --exclude "index.html" \
            --cache-control "public, max-age=31536000, immutable"

          aws s3 cp frontend/apps/web-recruiter/dist/index.html \
            s3://${{ secrets.S3_BUCKET_NAME }}/web-recruiter/index.html \
            --cache-control "no-cache, no-store, must-revalidate" \
            --content-type "text/html"

      - name: Upload web-admin to S3
        run: |
          aws s3 sync frontend/apps/web-admin/dist/ \
            s3://${{ secrets.S3_BUCKET_NAME }}/web-admin/ \
            --delete \
            --exclude "index.html" \
            --cache-control "public, max-age=31536000, immutable"

          aws s3 cp frontend/apps/web-admin/dist/index.html \
            s3://${{ secrets.S3_BUCKET_NAME }}/web-admin/index.html \
            --cache-control "no-cache, no-store, must-revalidate" \
            --content-type "text/html"

      - name: Invalidate CloudFront cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CF_DIST_ID_CANDIDATE }} \
            --paths "/*"

          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CF_DIST_ID_RECRUITER }} \
            --paths "/*"

          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CF_DIST_ID_ADMIN }} \
            --paths "/*"
```

---

## 7.5 Commit và Push workflows

```bash
git add .github/workflows/
git commit -m "chore(ci): add backend and frontend deploy workflows"
git push origin main
```

Vào GitHub → tab **Actions** để xem workflow đang chạy. Lần đầu build sẽ mất khoảng 20–30 phút do build Java services.

---

## 7.6 Kiểm tra CI/CD hoạt động

Thử thay đổi một file nhỏ trong `frontend/` và push lên:

```bash
# Thay đổi bất kỳ (ví dụ thêm dòng trống)
echo "" >> frontend/apps/web-candidate/src/main.tsx

git add -A
git commit -m "test: trigger frontend deploy"
git push origin main
```

Vào GitHub Actions → xem workflow `Deploy Frontend` chạy. Sau khoảng 5 phút, truy cập `https://smartcv-chuongpl.io.vn` — trang web sẽ được cập nhật tự động.

---

## Tóm tắt Bước 7

Sau bước này:
- [x] GitHub Secrets đã cấu hình đầy đủ
- [x] Workflow backend tự động build → push ECR → deploy EC2
- [x] Workflow frontend tự động build → upload S3 → invalidate CloudFront
- [x] Mỗi lần push code lên `main` là tự động deploy

**Tiếp theo:** [Bước 8 — Xử lý lỗi thường gặp](./08-troubleshooting.md)
