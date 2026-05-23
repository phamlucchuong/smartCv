# P1 — Recruiter Fields + S3 CV Upload + Gateway Rate Limiter

## Scope

Three items needed before feature-complete backend:

1. **R4** — Recruiter entity: add `taxCode`, `logoUrl`, `status`, `quotaJobPost`, `quotaCvViews`
2. **R5** — S3 CV upload endpoint (multipart PDF → S3 presigned URL)
3. **R6** — API Gateway rate limiter (Redis-based, per IP)

---

## Current assessment

- `Recruiter.java` has only basic company info fields. `quotaJobPost` / `quotaCvViews` are
  required to enforce recruiter subscription packages later. `status` (APPROVED/PENDING) is
  required for admin approval workflow.
- No file upload endpoint exists. `application_service.Application.cvUrl` expects a URL but
  candidates have no way to produce one — the submit-application flow is broken without S3.
- The API Gateway connects to Redis (used for JWT blacklist) but no rate limit filter is
  configured. Unprotected endpoints accept unlimited requests.

---

## R4 — Recruiter entity: missing business fields

### R4.1 — Update `Recruiter.java`

**File:** `user-service/src/main/java/.../features/recruiter/Recruiter.java`

Add fields below `companyDescription`:

```java
@Field(name = "tax_code")
String taxCode;

@Field(name = "logo_url")
String logoUrl;

@Builder.Default
RecruiterStatus status = RecruiterStatus.PENDING;

@Field(name = "quota_job_post")
@Builder.Default
int quotaJobPost = 0;

@Field(name = "quota_cv_views")
@Builder.Default
int quotaCvViews = 0;
```

### R4.2 — New enum `RecruiterStatus.java`

**File:** `user-service/src/main/java/.../enums/RecruiterStatus.java`

```java
package vn.chuongpl.user_service.enums;

public enum RecruiterStatus {
    PENDING,    // awaiting admin approval
    APPROVED,   // can post jobs and view CVs
    REJECTED    // account suspended
}
```

### R4.3 — Update `RecruiterRequest.java`

Add optional update fields:

```java
String taxCode;
String logoUrl;
RecruiterStatus status;    // ADMIN only — service layer enforces this
Integer quotaJobPost;      // ADMIN only
Integer quotaCvViews;      // ADMIN only
```

### R4.4 — Update `RecruiterResponse.java`

Add all new fields for API consumers:

```java
String taxCode;
String logoUrl;
RecruiterStatus status;
int quotaJobPost;
int quotaCvViews;
```

### R4.5 — Update `RecruiterService.java`

**`createBasicProfile(String userId)`** — default status is `PENDING`, quotas are `0`.
No change needed if `@Builder.Default` is used on the entity.

**`update()` method** — add admin-only quota and status update logic:

```java
// Only ADMIN can update status and quotas
if (isAdmin) {
    if (request.getStatus() != null)      recruiter.setStatus(request.getStatus());
    if (request.getQuotaJobPost() != null) recruiter.setQuotaJobPost(request.getQuotaJobPost());
    if (request.getQuotaCvViews() != null) recruiter.setCvViews(request.getQuotaCvViews());
}
// Both owner and admin can update company info and taxCode/logoUrl
if (request.getTaxCode() != null)  recruiter.setTaxCode(request.getTaxCode());
if (request.getLogoUrl() != null)  recruiter.setLogoUrl(request.getLogoUrl());
```

### R4.6 — Update `RecruiterMapper.java`

MapStruct will auto-map the new fields if they share the same name. Verify no `@Mapping`
exclusions are missing.

### R4.7 — Add admin endpoint: approve/reject recruiter

**New endpoint in `RecruiterController.java`:**

```java
@PatchMapping("/{id}/status")
@PreAuthorize("hasRole('ADMIN')")
public ApiResponse<RecruiterResponse> updateStatus(@PathVariable String id,
        @RequestBody RecruiterStatusRequest request) {
    return ApiResponse.<RecruiterResponse>builder()
        .data(recruiterService.updateStatus(id, request))
        .build();
}
```

**`RecruiterStatusRequest.java`:**
```java
public class RecruiterStatusRequest {
    @NotNull RecruiterStatus status;
    Integer quotaJobPost;
    Integer quotaCvViews;
}
```

### R4 file summary

| File | Action |
|------|--------|
| `Recruiter.java` | Add 5 new fields |
| `enums/RecruiterStatus.java` | New enum |
| `RecruiterRequest.java` | Add 5 optional fields |
| `RecruiterResponse.java` | Add 5 new fields |
| `RecruiterService.java` | Admin-only field updates in `update()`, new `updateStatus()` |
| `RecruiterController.java` | New `PATCH /{id}/status` endpoint |
| `dtos/request/RecruiterStatusRequest.java` | New DTO |

---

## R5 — S3 CV upload endpoint

### R5.1 — Add AWS SDK dependency to user-service `pom.xml`

```xml
<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>s3</artifactId>
    <version>2.25.40</version>
</dependency>
```

Add `aws.region` version BOM or specify version explicitly (not managed by Spring Boot parent).

### R5.2 — Environment variables

Add to `.env.example`:
```
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET_NAME=smartcv-cvs
AWS_S3_PRESIGNED_URL_TTL_MINUTES=60
```

### R5.3 — `S3Config.java`

**File:** `user-service/src/main/java/.../configuration/S3Config.java`

```java
@Configuration
public class S3Config {

    @Value("${AWS_REGION:ap-southeast-1}")
    String region;

    @Value("${AWS_ACCESS_KEY_ID:}")
    String accessKey;

    @Value("${AWS_SECRET_ACCESS_KEY:}")
    String secretKey;

    @Bean
    public S3Client s3Client() {
        AwsBasicCredentials creds = AwsBasicCredentials.create(accessKey, secretKey);
        return S3Client.builder()
            .region(Region.of(region))
            .credentialsProvider(StaticCredentialsProvider.create(creds))
            .build();
    }

    @Bean
    public S3Presigner s3Presigner() {
        AwsBasicCredentials creds = AwsBasicCredentials.create(accessKey, secretKey);
        return S3Presigner.builder()
            .region(Region.of(region))
            .credentialsProvider(StaticCredentialsProvider.create(creds))
            .build();
    }
}
```

### R5.4 — `S3Service.java`

**File:** `user-service/src/main/java/.../features/candidate/S3Service.java`

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class S3Service {

    final S3Client s3Client;
    final S3Presigner s3Presigner;

    @Value("${AWS_S3_BUCKET_NAME:smartcv-cvs}")
    String bucket;

    @Value("${AWS_S3_PRESIGNED_URL_TTL_MINUTES:60}")
    int presignedUrlTtl;

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final String ALLOWED_CONTENT_TYPE = "application/pdf";

    public String uploadCv(MultipartFile file, String candidateId) {
        validateFile(file);

        String key = "cvs/" + candidateId + "/" + UUID.randomUUID() + ".pdf";

        try {
            s3Client.putObject(
                PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(ALLOWED_CONTENT_TYPE)
                    .build(),
                RequestBody.fromBytes(file.getBytes())
            );
        } catch (Exception e) {
            log.error("S3 upload failed: {}", e.getMessage());
            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
        }

        return generatePresignedUrl(key);
    }

    public String generatePresignedUrl(String key) {
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
            .signatureDuration(Duration.ofMinutes(presignedUrlTtl))
            .getObjectRequest(r -> r.bucket(bucket).key(key).build())
            .build();
        return s3Presigner.presignGetObject(presignRequest).url().toString();
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.FILE_REQUIRED);
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new AppException(ErrorCode.FILE_TOO_LARGE);
        }
        String contentType = file.getContentType();
        if (!ALLOWED_CONTENT_TYPE.equals(contentType)) {
            throw new AppException(ErrorCode.INVALID_FILE_TYPE);
        }
    }
}
```

### R5.5 — Add error codes

Add to `user-service/src/main/java/.../enums/ErrorCode.java`:

```java
FILE_REQUIRED(6001, "File is required"),
FILE_TOO_LARGE(6002, "File must not exceed 5MB"),
INVALID_FILE_TYPE(6003, "Only PDF files are accepted"),
FILE_UPLOAD_FAILED(6004, "Failed to upload file, please try again");
```

### R5.6 — Upload endpoint

**Add to `CandidateController.java`:**

```java
@PostMapping("/cv/upload")
@PreAuthorize("hasRole('CANDIDATE')")
public ApiResponse<CvUploadResponse> uploadCv(
        @RequestParam("file") MultipartFile file,
        @AuthenticationPrincipal String userId) {
    String url = s3Service.uploadCv(file, userId);
    return ApiResponse.<CvUploadResponse>builder()
        .message("CV uploaded successfully")
        .data(new CvUploadResponse(url))
        .build();
}
```

**`CvUploadResponse.java`:**
```java
public record CvUploadResponse(String cvUrl) {}
```

Inject `S3Service` into `CandidateController`.

### R5.7 — Add `spring.servlet.multipart` config to user-service `application.yaml`

```yaml
spring:
  servlet:
    multipart:
      max-file-size: 5MB
      max-request-size: 6MB
```

### R5 file summary

| File | Action |
|------|--------|
| `pom.xml` | Add `software.amazon.awssdk:s3` |
| `configuration/S3Config.java` | New — S3Client + S3Presigner beans |
| `features/candidate/S3Service.java` | New — upload + validate + presign |
| `features/candidate/CandidateController.java` | Add `POST /cv/upload` |
| `dtos/response/CvUploadResponse.java` | New |
| `enums/ErrorCode.java` | Add FILE_* codes |
| `application.yaml` | Add multipart config + AWS env vars |
| `.env.example` | Add AWS_* variables |

---

## R6 — API Gateway rate limiter

### R6.1 — Add `KeyResolver` bean

**File:** `api-gateway/src/main/java/.../configuration/RateLimiterConfig.java`

```java
@Configuration
public class RateLimiterConfig {

    @Bean
    @Primary
    public KeyResolver ipKeyResolver() {
        return exchange -> {
            String ip = exchange.getRequest().getRemoteAddress() != null
                ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                : "unknown";
            return Mono.just(ip);
        };
    }
}
```

### R6.2 — Add rate limiter config to `application.yaml`

In `api-gateway/src/main/resources/application.yaml`, update the routes to add
`RequestRateLimiter` as a default filter. Apply stricter limits on auth endpoints:

```yaml
spring:
  cloud:
    gateway:
      default-filters:
        - name: RequestRateLimiter
          args:
            redis-rate-limiter.replenishRate: 20
            redis-rate-limiter.burstCapacity: 40
            redis-rate-limiter.requestedTokens: 1
            key-resolver: "#{@ipKeyResolver}"
      routes:
        ...
```

For tighter protection on auth endpoints specifically, override at route level:

```yaml
- id: user-auth
  uri: ${USER_SERVICE_URI:http://localhost:8081}
  predicates:
    - Path=/user/api/auth/**
  filters:
    - name: RequestRateLimiter
      args:
        redis-rate-limiter.replenishRate: 5
        redis-rate-limiter.burstCapacity: 10
        key-resolver: "#{@ipKeyResolver}"
```

### R6.3 — Verify `spring-boot-starter-data-redis-reactive` is on classpath

`RequestRateLimiter` requires the reactive Redis starter (Spring Cloud Gateway is reactive):

Check `api-gateway/pom.xml` — if it already has `spring-boot-starter-data-redis-reactive`,
no change needed. If only the servlet Redis starter is present, replace with the reactive one:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis-reactive</artifactId>
</dependency>
```

### R6.4 — Custom 429 response

Spring Cloud Gateway returns `429 Too Many Requests` automatically. No extra code needed.
Optionally add a custom error body by implementing `ErrorWebExceptionHandler`, but the
default behaviour is acceptable for now.

### R6 file summary

| File | Action |
|------|--------|
| `configuration/RateLimiterConfig.java` | New — `KeyResolver` bean |
| `src/main/resources/application.yaml` | Add `default-filters.RequestRateLimiter` + auth route override |
| `pom.xml` | Verify `spring-boot-starter-data-redis-reactive` present |

---

## Execution order

```
R6    Gateway rate limiter                   ~2 hours  (config only, low risk)
R4    Recruiter entity fields                ~3 hours  (user-service only, contained)
R5.3  S3Config.java                          ~1 hour
R5.4  S3Service.java                         ~2 hours
R5.5  ErrorCode additions                    ~15 min
R5.6  Upload endpoint                        ~1 hour
R5.7  application.yaml multipart config      ~15 min

Total                                        ~10 hours / ~1.5 days
```

**Recommended order:** R6 → R4 → R5 (R6 is pure config; R4 and R5 are independent —
R4 touches recruiter domain, R5 touches candidate domain).

---

## Notes

### S3 alternative for dev/local: MinIO

If AWS credentials are unavailable during development, swap to MinIO (S3-compatible):

```yaml
# docker-compose.yaml add:
minio:
  image: minio/minio
  command: server /data --console-address ":9001"
  ports:
    - "9000:9000"
    - "9001:9001"
  environment:
    MINIO_ROOT_USER: ${AWS_ACCESS_KEY_ID}
    MINIO_ROOT_PASSWORD: ${AWS_SECRET_ACCESS_KEY}
  volumes:
    - minio_data:/data
  networks:
    - smartCv-net
```

Override S3 endpoint in `S3Config`:
```java
// For MinIO / custom endpoint
.endpointOverride(URI.create(s3EndpointUrl))  // env: AWS_S3_ENDPOINT_URL=http://localhost:9000
```

### Recruiter status enforcement in Job Service

Once `Recruiter.status` is added, `JobService.createJob()` in job_service should call
user-service to verify the recruiter's status is `APPROVED` before allowing job posting.
This is a P2 enhancement — defer until after R4 is merged.
