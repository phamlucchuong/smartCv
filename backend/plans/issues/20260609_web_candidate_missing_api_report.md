# Web Candidate Missing API Report

**Date:** 2026-06-09  
**Frontend app:** `smartCv-fe/apps/web-candidate`  
**Backend repos reviewed:** `user-service`, `job_service`, `application_service`, `ai_engine_service`, `notification-service`, `api-gateway`

## 1. Kết luận ngắn

`web-candidate` hiện chưa có backend đầy đủ để thay thế toàn bộ mock/local state.

Các flow đã có backend lõi:

- Auth: đăng ký, verify OTP, resend OTP, quên mật khẩu, reset mật khẩu, login, logout, refresh
- User/Candidate profile cơ bản: `users/me`, `users/{id}`, `candidates/me`, `candidates/{id}`, update candidate, upload CV
- Jobs: list active jobs, search jobs, job detail
- Applications: submit, list my applications, detail, withdraw
- AI: recommend jobs from CV
- Notifications: list, mark read, mark all read, firebase token, FCM subscribe

Các domain chưa có hoặc chưa đủ cho `web-candidate`:

- Company directory / company detail
- Saved jobs / wishlists
- Candidate assessments
- Candidate settings/preferences/privacy
- Public homepage content aggregates
- Enriched job/application/card payloads mà UI hiện đang dùng

## 2. Cách thống kê

Đối chiếu theo:

- Toàn bộ route trong `smartCv-fe/apps/web-candidate/src/routes`
- Dữ liệu local trong `useCandidateStore.ts`
- Mock data trong `src/data/mockCompanies.ts`
- Controllers hiện có trong backend

Phân loại:

- `Implemented`: backend đã có endpoint phù hợp
- `Partial`: backend có endpoint gần đúng, nhưng payload/aggregate chưa đủ cho UI
- `Missing`: chưa thấy domain hoặc endpoint tương ứng

## 3. Ma trận theo màn hình

| Route / feature | Trạng thái backend | Ghi chú |
|---|---|---|
| `/signin` | Implemented | Có `POST /user/api/auth/login`, nhưng frontend đang fake auth bằng `localStorage`. |
| `/signup` | Implemented | Có register + verify OTP + resend OTP, nhưng frontend chưa nối flow verify. |
| `/` home jobs list | Partial | Có jobs list/search, nhưng home vẫn dùng mock stats/categories/resources/testimonials/companies. |
| `/jobs/$jobId` | Partial | Có job detail, nhưng UI cần thêm company profile, related jobs, saved/applied state. |
| `/companies` | Missing | Chưa thấy company directory API. |
| `/companies/$companyId` | Missing | Chưa thấy company detail API. |
| `/_account/profile` | Partial | Có user/candidate CRUD cơ bản, nhưng UI hiện dùng local store cho skills/experience/education/avatar derived fields. |
| `/_account/cv` | Partial | Có upload CV, nhưng chưa có CV list/default/delete/re-analyze endpoints. |
| `/_account/applications` | Partial | Có `applications/my`, nhưng payload hiện chưa đủ thông tin card UI nếu không join thêm job data. |
| `/_account/job-suggestions` | Partial | Có AI recommend, nhưng chưa có persisted suggestion feed/history/status. |
| `/_account/notifications` | Partial | Notification service đã có list/read/read-all, nhưng chưa thấy contract/preferences được tích hợp cho candidate app. |
| `/_account/wishlists` | Missing | Chưa thấy saved jobs/wishlist domain. |
| `/_account/assessments` | Missing | Chưa thấy assessment/test domain cho candidate. |
| `/_account/settings` | Missing | Chưa thấy settings/preferences/privacy/account deletion APIs cho candidate. |
| `/about` | Missing/Optional | Chỉ là content page; nếu muốn backend-driven/CMS thì chưa có API tương ứng. |

## 4. Danh sách API chưa implement

### 4.1 Company Directory Domain

Frontend đang có 2 route hoàn toàn mock:

- `/companies`
- `/companies/$companyId`

API còn thiếu:

- `GET /company/api/companies`
  - filter: `query`, `industry`, `size`, `location`, `page`, `size`
  - trả về danh sách company card
- `GET /company/api/companies/{idOrSlug}`
  - profile chi tiết công ty
- `GET /company/api/companies/{idOrSlug}/jobs`
  - danh sách job thuộc công ty
- `GET /company/api/companies/{idOrSlug}/related`
  - công ty tương tự
- `POST /company/api/companies/{idOrSlug}/follow`
  - optional, nếu muốn nút `Follow`
- `DELETE /company/api/companies/{idOrSlug}/follow`
  - optional

Payload UI hiện cần tối thiểu:

- `id` hoặc `slug`
- `name`
- `logoUrl` hoặc placeholder
- `coverUrl` hoặc cover metadata
- `industry`
- `size`
- `location`
- `country`
- `website`
- `rating`
- `reviewCount`
- `activeJobCount`
- `description`
- `benefits`

### 4.2 Saved Jobs / Wishlists

Route `/_account/wishlists` đang dùng local array `wishlistJobs`.

API còn thiếu:

- `GET /candidate/api/wishlists`
  - list saved jobs của candidate
- `POST /candidate/api/wishlists`
  - save job, body chứa `jobId`
- `DELETE /candidate/api/wishlists/{jobId}`
  - unsave job
- `GET /candidate/api/wishlists/count`
  - optional, nếu cần badge nhanh

Payload UI hiện cần:

- `jobId`
- `title`
- `company`
- `companyInitials` hoặc `logoUrl`
- `salary`
- `location`
- `skills`
- `savedAt`
- `category` hoặc taxonomy để filter

### 4.3 Candidate Assessments

Route `/_account/assessments` hiện là mock hoàn toàn, gồm:

- list assessment
- status
- start/continue assessment
- question flow
- submit
- score/result

Chưa thấy domain backend tương ứng.

API còn thiếu:

- `GET /assessment/api/assessments/my`
  - list bài test assigned cho candidate
- `GET /assessment/api/assessments/{assessmentId}`
  - metadata chi tiết
- `POST /assessment/api/assessments/{assessmentId}/start`
  - bắt đầu attempt
- `GET /assessment/api/attempts/{attemptId}`
  - lấy state hiện tại để resume
- `POST /assessment/api/attempts/{attemptId}/answers`
  - lưu câu trả lời
- `POST /assessment/api/attempts/{attemptId}/submit`
  - nộp bài
- `GET /assessment/api/attempts/{attemptId}/result`
  - điểm và kết quả

### 4.4 Candidate Settings / Preferences / Privacy

Route `/_account/settings` hiện sửa local state, chưa có backend thật.

API còn thiếu:

- `GET /candidate/api/settings`
  - lấy toàn bộ settings hiện tại
- `PUT /candidate/api/settings/email`
  - đổi email liên hệ candidate-facing settings
- `PUT /candidate/api/settings/password`
  - hoặc reuse `PUT /user/api/users/me/password`; endpoint này đã có
- `PUT /candidate/api/settings/notifications`
  - notification preferences
- `PUT /candidate/api/settings/privacy`
  - privacy preferences
- `DELETE /candidate/api/me`
  - self delete / deactivate account

Lưu ý:

- `PUT /user/api/users/me/password` đã tồn tại
- phần còn lại chưa thấy endpoint tương ứng

### 4.5 CV Management Beyond Upload

Route `/_account/cv` hiện có nhiều thao tác hơn backend hiện có.

Đã có:

- `POST /user/api/candidates/cv/upload`

Còn thiếu:

- `GET /candidate/api/cvs`
  - list tất cả CV đã upload
- `PATCH /candidate/api/cvs/{cvId}/default`
  - đặt CV mặc định
- `DELETE /candidate/api/cvs/{cvId}`
  - xóa CV
- `POST /candidate/api/cvs/{cvId}/reanalyze`
  - trigger phân tích lại CV
- `GET /candidate/api/cvs/{cvId}/analysis`
  - lấy trạng thái / kết quả phân tích

Hiện `CandidateResponse` chỉ có một `cvUrl`, chưa đủ cho mô hình nhiều CV mà UI đang dùng.

### 4.6 Public Home Aggregates

Trang `/` đang hardcode nhiều phần public discovery.

Các API còn thiếu nếu muốn bỏ mock:

- `GET /public/api/home/stats`
  - open jobs, hiring companies, avg response time, remote roles
- `GET /public/api/home/categories`
  - danh mục nghề + số job
- `GET /public/api/home/featured-jobs`
  - danh sách jobs spotlight / trending
- `GET /public/api/home/top-companies`
  - company spotlight cards
- `GET /public/api/home/resources`
  - articles / guides
- `GET /public/api/home/testimonials`
  - optional
- `GET /public/api/home/faqs`
  - optional

Các API này không bắt buộc nếu frontend chấp nhận tự compose từ nhiều service, nhưng hiện chưa có BFF/public aggregate nào.

## 5. API đã có nhưng chưa đủ shape cho UI

### 5.1 Job Detail Aggregate

`GET /job/api/jobs/{id}` đã có, nhưng route `/jobs/$jobId` hiện cần thêm:

- company profile snapshot
- related jobs
- `isSaved`
- `isApplied`
- deadline badge / formatted metadata

Thiếu lựa chọn rõ ràng:

- hoặc thêm BFF endpoint `GET /candidate/api/jobs/{id}/detail`
- hoặc bổ sung nhiều API phụ:
  - `GET /candidate/api/wishlists/contains/{jobId}`
  - `GET /application/api/applications/by-job/{jobId}/mine`
  - `GET /company/api/companies/by-name-or-id/...`
  - `GET /job/api/jobs/{id}/related`

### 5.2 My Applications Card Payload

`GET /application/api/applications/my` đã có nhưng `ApplicationResponse` hiện chỉ trả:

- `jobId`
- `candidateId`
- `recruiterId`
- `status`
- `coverLetter`
- `cvUrl`
- `aiScore`, `matchedSkills`, `missingSkills`
- timestamps

UI `/_account/applications` đang cần trực tiếp:

- job title
- company
- location
- salary
- skills
- employer/logo initials

Backend còn thiếu một trong hai hướng:

- enrich ngay tại `applications/my`
- hoặc thêm aggregate endpoint riêng cho candidate dashboard

### 5.3 Candidate Profile Aggregate

UI profile hiện thao tác trên một object hợp nhất:

- user info
- candidate info
- experiences / educations / skills
- derived fields như `initials`, `firstName`

Backend hiện tách:

- `UserResponse`
- `CandidateResponse`

Không phải missing hoàn toàn, nhưng nếu muốn frontend code gọn hơn thì nên có:

- `GET /candidate/api/profile/me`
- `PUT /candidate/api/profile/me`

đóng vai trò aggregate thay vì frontend phải merge `users/me` và `candidates/me`.

### 5.4 Job Suggestions Feed

`POST /ai/api/ai/recommend` đã có.

Nhưng UI `/_account/job-suggestions` hiện cần một feed candidate-friendly:

- danh sách suggestion đã được tính sẵn
- `matchScore`
- `matchReason`
- `alignedSkills`
- thông tin job card đầy đủ
- trạng thái đã apply / đã save

Nếu không muốn frontend tự gọi AI mỗi lần mở trang, còn thiếu một endpoint dạng:

- `GET /candidate/api/job-suggestions`

hoặc job recommendation cache/persistence layer.

### 5.5 Notifications Candidate Contract

Notification service đã có:

- `GET /notification/api/notifications`
- `PATCH /notification/api/notifications/{id}/read`
- `POST /notification/api/notifications/read-all`

Tuy nhiên còn các điểm cần làm rõ trước khi coi là hoàn tất cho `web-candidate`:

- audience mapping trong service đang default về `USER`, chưa thấy role `CANDIDATE` explicit
- chưa thấy settings/preferences notification cho candidate
- chưa có OpenAPI/spec cho notification-service để frontend generate hooks đồng bộ

Vì vậy phần notifications nên xem là `partial`, không phải hoàn chỉnh.

## 6. Domain chưa thấy backend nào tương ứng

Các domain dưới đây hiện chưa thấy entity/service/controller tương ứng trong backend đã review:

- Company directory / company profile cho candidate discovery
- Saved jobs / wishlists
- Candidate assessments / test attempts
- Candidate settings/preferences/privacy
- Candidate multi-CV management

## 7. Ưu tiên triển khai đề xuất

### P0

- Company directory + company detail
- Saved jobs / wishlists
- CV management ngoài upload
- Enriched `my applications` payload
- Candidate settings/preferences/privacy

### P1

- Candidate job suggestions feed/cache
- Job detail aggregate: related jobs, saved/applied state
- Notification OpenAPI + candidate contract hardening

### P2

- Public home aggregates
- About/resources/testimonials CMS-like content
- Company follow/unfollow

## 8. Bộ API tối thiểu để web-candidate bỏ hầu hết mock

- `GET /company/api/companies`
- `GET /company/api/companies/{idOrSlug}`
- `GET /company/api/companies/{idOrSlug}/jobs`
- `GET /candidate/api/wishlists`
- `POST /candidate/api/wishlists`
- `DELETE /candidate/api/wishlists/{jobId}`
- `GET /candidate/api/cvs`
- `PATCH /candidate/api/cvs/{cvId}/default`
- `DELETE /candidate/api/cvs/{cvId}`
- `POST /candidate/api/cvs/{cvId}/reanalyze`
- `GET /assessment/api/assessments/my`
- `POST /assessment/api/assessments/{assessmentId}/start`
- `GET /assessment/api/attempts/{attemptId}`
- `POST /assessment/api/attempts/{attemptId}/answers`
- `POST /assessment/api/attempts/{attemptId}/submit`
- `GET /assessment/api/attempts/{attemptId}/result`
- `GET /candidate/api/settings`
- `PUT /candidate/api/settings/notifications`
- `PUT /candidate/api/settings/privacy`
- `DELETE /candidate/api/me`
- `GET /candidate/api/job-suggestions`

## 9. Ghi chú cuối

Nếu mục tiêu chỉ là nối API cho phần lõi candidate flow, backend hiện đã đủ cho:

- auth
- profile cơ bản
- upload CV
- jobs list/search/detail
- submit/list/withdraw application

Nếu mục tiêu là thay toàn bộ `web-candidate` hiện tại khỏi mock, thì các API liệt kê ở trên vẫn còn thiếu đáng kể.
