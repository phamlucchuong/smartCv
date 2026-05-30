# Job Service — Completion Plan

**Branch:** `feat/init-user-candidate-and-recruiter`  
**Date:** 2026-05-23  
**Scope:** Complete job-service, integrate Elasticsearch, enforce RECRUITER/CANDIDATE/ADMIN authorization

---

## Current assessment

### What already exists
| File | Status |
|------|--------|
| `Job.java` | MongoDB entity is very thin — missing 7+ required fields |
| `JobService.java` | Basic CRUD — no DTOs, no exceptions, no auth, no ES |
| `JobController.java` | Returns raw `Job`, no `ApiResponse` wrapper, no security |
| `JobRepository.java` | Empty, only extends MongoRepository |
| `application.yaml` | MongoDB + Redis + ES configs are present |
| `pom.xml` | Has `spring-boot-starter-data-elasticsearch` but missing Security, MapStruct, RabbitMQ, SpringDoc, Redis |

### What is completely missing
- DTOs (request / response)
- Exception handling (ErrorCode, AppException, GlobalExceptionHandler)
- Security (JWT validation, `@PreAuthorize`)
- Elasticsearch (JobDocument, ES repository, search logic, dual-write sync)
- RabbitMQ (publish events when job is created/updated/closed)
- MapStruct mapper
- Fine-grained authorization (recruiter can only edit their own jobs)
- Job lifecycle (DRAFT → ACTIVE → CLOSED/EXPIRED)
- Pagination, filters, search
- API Gateway route for job-service

---

## Detailed design

### Job Entity — fields to add

```
Job (MongoDB)
├── id                (String, @MongoId)
├── recruiterId       (String)         ← recruiter ID who created the job
├── title             (String)
├── description       (String)
├── company           (String)
├── location          (String)
├── salaryMin         (Double)         ← split salary into range
├── salaryMax         (Double)
├── jobType           (enum: FULL_TIME, PART_TIME, REMOTE, CONTRACT, INTERNSHIP)
├── experienceLevel   (enum: INTERN, JUNIOR, MIDDLE, SENIOR, LEAD)
├── skills            (List<String>)
├── requirements      (List<String>)
├── benefits          (List<String>)   ← new
├── status            (enum: DRAFT, ACTIVE, CLOSED, EXPIRED)
├── deadline          (LocalDate)      ← application deadline
├── deleted           (boolean)
├── deletedAt         (LocalDateTime)
├── createdAt         (LocalDateTime)
└── updatedAt         (LocalDateTime)
```

### JobDocument — Elasticsearch index

```
JobDocument (ES index: "jobs")
├── id            (String, @Id)
├── recruiterId   (String, keyword)
├── title         (String, text — analyzed)
├── description   (String, text — analyzed)
├── company       (String, text + keyword)
├── location      (String, keyword)
├── salaryMin     (Double)
├── salaryMax     (Double)
├── jobType       (String, keyword)
├── experienceLevel (String, keyword)
├── skills        (List<String>, keyword)
├── status        (String, keyword)   ← only index ACTIVE jobs
├── deadline      (LocalDate)
└── createdAt     (LocalDateTime)
```

### Authorization matrix

| Action | RECRUITER | CANDIDATE | ADMIN |
|--------|-----------|-----------|-------|
| Create job | ✅ (own jobs only) | ❌ | ✅ |
| View job (ACTIVE) | ✅ | ✅ | ✅ |
| View all my jobs | ✅ | ❌ | ✅ |
| Update job | ✅ (own jobs only) | ❌ | ✅ |
| Publish/Close job | ✅ (own jobs only) | ❌ | ✅ |
| Delete job | ❌ | ❌ | ✅ |
| Search (ES) | ✅ | ✅ | ✅ |
| View all jobs (admin) | ❌ | ❌ | ✅ |

### JWT behavior in job-service

Job-service **validates JWT itself** (same as user-service) instead of relying on Gateway headers:
- Use the same `JWT_SECRET_KEY` and `HS512` algorithm
- Extract `sub` (userId = recruiterId) and `scope` (roles) from the token
- API Gateway route `/job/**` → job-service (no extra headers required)

---

## Implementation plan

### Step 1 — Update pom.xml

**Add dependencies:**
```xml
<!-- Security + JWT -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
</dependency>
<dependency>
    <groupId>com.nimbusds</groupId>
    <artifactId>nimbus-jose-jwt</artifactId>
    <version>9.37.3</version>
</dependency>

<!-- MapStruct -->
<dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct</artifactId>
    <version>1.5.5.Final</version>
</dependency>

<!-- RabbitMQ -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-amqp</artifactId>
</dependency>

<!-- SpringDoc -->
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.8.3</version>
</dependency>

<!-- Redis -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>

<!-- java-dotenv -->
<dependency>
    <groupId>io.github.cdimascio</groupId>
    <artifactId>dotenv-java</artifactId>
    <version>3.0.0</version>
</dependency>
```

**Add MapStruct to the maven-compiler-plugin annotation processor paths** (alongside Lombok).

---

### Step 2 — Package structure

```
job_service/
├── config/
│   ├── SecurityConfig.java          (JWT resource server, public/private endpoints)
│   ├── RabbitMQConfig.java          (exchange, queue, routing key)
│   ├── OpenApiConfig.java           (Swagger Bearer auth)
│   └── AppConfig.java               (RestTemplate, PasswordEncoder if needed)
├── dtos/
│   ├── ApiResponse.java
│   ├── PageResponse.java
│   ├── request/
│   │   ├── JobCreateRequest.java
│   │   ├── JobUpdateRequest.java
│   │   └── JobSearchRequest.java
│   └── response/
│       └── JobResponse.java
├── enums/
│   ├── ErrorCode.java
│   ├── JobStatus.java               (DRAFT, ACTIVE, CLOSED, EXPIRED)
│   ├── JobType.java                 (FULL_TIME, PART_TIME, REMOTE, CONTRACT, INTERNSHIP)
│   └── ExperienceLevel.java        (INTERN, JUNIOR, MIDDLE, SENIOR, LEAD)
├── exception/
│   ├── AppException.java
│   └── GlobalExceptionHandler.java
├── features/
│   └── job/
│       ├── Job.java                 (MongoDB entity — updated)
│       ├── JobDocument.java         (Elasticsearch document — NEW)
│       ├── JobRepository.java       (MongoDB — updated)
│       ├── JobElasticsearchRepository.java (NEW)
│       ├── JobMapper.java           (MapStruct — NEW)
│       ├── JobService.java          (rewrite)
│       └── JobController.java       (rewrite)
└── integration/
    └── elasticsearch/
        └── JobIndexService.java     (dual-write sync — NEW)
```

---

### Step 3 — Enums & exceptions

**`ErrorCode.java`:**
```java
JOB_NOT_FOUND(2001, "Job not found"),
JOB_NOT_OWNER(2002, "You are not the owner of this job"),
JOB_STATUS_INVALID(2003, "Invalid status transition"),
JOB_ALREADY_DELETED(2004, "Job has been deleted"),
UNAUTHORIZED(1006, "You do not have permission"),
UNAUTHENTICATED(1005, "Unauthenticated")
```

**`JobStatus.java`:**
```java
DRAFT, ACTIVE, CLOSED, EXPIRED
// Valid transitions:
// DRAFT → ACTIVE (publish)
// ACTIVE → CLOSED (close hiring)
// ACTIVE → EXPIRED (auto when deadline passes)
// DRAFT → CLOSED (cancel before publish)
```

**`JobType.java`:** `FULL_TIME, PART_TIME, REMOTE, CONTRACT, INTERNSHIP`

**`ExperienceLevel.java`:** `INTERN, JUNIOR, MIDDLE, SENIOR, LEAD`

**`GlobalExceptionHandler.java`:** Handle `AppException` → `ApiResponse`, `AccessDeniedException` → 403, `MethodArgumentNotValidException` → 400 with field errors.

---

### Step 4 — Job Entity (MongoDB)

Update `Job.java` with full fields:
```java
@Document(collection = "jobs")
public class Job {
    @MongoId String id;
    @Field("recruiter_id") String recruiterId;
    String title;
    String description;
    String company;
    String location;
    @Field("salary_min") Double salaryMin;
    @Field("salary_max") Double salaryMax;
    @Enumerated JobType jobType;
    @Enumerated ExperienceLevel experienceLevel;
    List<String> skills;
    List<String> requirements;
    List<String> benefits;
    @Builder.Default JobStatus status = JobStatus.DRAFT;
    LocalDate deadline;
    @Builder.Default boolean deleted = false;
    LocalDateTime deletedAt;
    @CreatedDate LocalDateTime createdAt;
    @LastModifiedDate LocalDateTime updatedAt;
}
```

---

### Step 5 — DTOs

**`JobCreateRequest.java`** — create request:
```java
@NotBlank String title;
@NotBlank String description;
@NotBlank String company;
@NotBlank String location;
Double salaryMin;
Double salaryMax;
@NotNull JobType jobType;
@NotNull ExperienceLevel experienceLevel;
List<String> skills;
List<String> requirements;
List<String> benefits;
LocalDate deadline;
```

**`JobUpdateRequest.java`** — partial update (all nullable):
```java
String title;
String description;
String company;
String location;
Double salaryMin;
Double salaryMax;
JobType jobType;
ExperienceLevel experienceLevel;
List<String> skills;
List<String> requirements;
List<String> benefits;
LocalDate deadline;
```

**`JobSearchRequest.java`** — search params:
```java
String keyword;          // full-text: title, description, company
String location;
Double salaryMin;
Double salaryMax;
JobType jobType;
ExperienceLevel experienceLevel;
List<String> skills;
String sortBy;           // "createdAt" | "salaryMin" | "salaryMax"
String sortDir;          // "asc" | "desc"
int page = 1;
int size = 10;
```

**`JobResponse.java`** — clean response:
```java
String id;
String recruiterId;
String title;
String description;
String company;
String location;
Double salaryMin;
Double salaryMax;
JobType jobType;
ExperienceLevel experienceLevel;
List<String> skills;
List<String> requirements;
List<String> benefits;
JobStatus status;
LocalDate deadline;
LocalDateTime createdAt;
LocalDateTime updatedAt;
```

---

### Step 6 — Elasticsearch

**`JobDocument.java`** — ES index mapping:
```java
@Document(indexName = "jobs")
@Setting(settingPath = "elasticsearch/job-settings.json")  // optional
public class JobDocument {
    @Id String id;
    @Field(type = FieldType.Keyword) String recruiterId;
    @Field(type = FieldType.Text, analyzer = "standard") String title;
    @Field(type = FieldType.Text, analyzer = "standard") String description;
    @MultiField(mainField = @Field(type = FieldType.Text),
                otherFields = @InnerField(suffix = "keyword", type = FieldType.Keyword))
    String company;
    @Field(type = FieldType.Keyword) String location;
    @Field(type = FieldType.Double) Double salaryMin;
    @Field(type = FieldType.Double) Double salaryMax;
    @Field(type = FieldType.Keyword) String jobType;
    @Field(type = FieldType.Keyword) String experienceLevel;
    @Field(type = FieldType.Keyword) List<String> skills;
    @Field(type = FieldType.Keyword) String status;
    @Field(type = FieldType.Date, format = DateFormat.date) LocalDate deadline;
    @Field(type = FieldType.Date) LocalDateTime createdAt;
}
```

**`JobElasticsearchRepository.java`:**
```java
public interface JobElasticsearchRepository
        extends ElasticsearchRepository<JobDocument, String> {
    // Spring Data ES query methods if needed
    Page<JobDocument> findByStatus(String status, Pageable pageable);
}
```

**`JobIndexService.java`** — dual-write service:
```java
@Service
public class JobIndexService {
    final ElasticsearchOperations elasticsearchOperations;
    final JobElasticsearchRepository esRepository;

    // Called after MongoDB save
    public void indexJob(Job job) {
        JobDocument doc = toDocument(job);
        esRepository.save(doc);
    }

    // Called after MongoDB soft-delete
    public void removeFromIndex(String jobId) {
        esRepository.deleteById(jobId);
    }

    // Search using NativeQuery / CriteriaQuery
    public PageResponse<JobResponse> search(JobSearchRequest request) {
        // Build BoolQuery:
        // must: multi_match keyword on title + description + company
        // filter: location, jobType, experienceLevel, skills, status=ACTIVE
        // filter: salaryMin >= request.salaryMin, salaryMax <= request.salaryMax
        // sort: createdAt DESC (default)
    }
}
```

**Sample search query (NativeQuery):**
```java
BoolQuery.Builder boolQuery = new BoolQuery.Builder();

// Full-text search
if (keyword != null && !keyword.isBlank()) {
    boolQuery.must(MultiMatchQuery.of(m -> m
        .fields("title^3", "description", "company^2")
        .query(keyword)
        .type(TextQueryType.BestFields)
    )._toQuery());
}

// Only ACTIVE jobs
boolQuery.filter(TermQuery.of(t -> t.field("status").value("ACTIVE"))._toQuery());

// Filter location
if (location != null) {
    boolQuery.filter(TermQuery.of(t -> t.field("location").value(location))._toQuery());
}

// Filter salary range
if (salaryMin != null) {
    boolQuery.filter(RangeQuery.of(r -> r.field("salaryMin").gte(JsonData.of(salaryMin)))._toQuery());
}

// Filter skills (must contain ALL requested skills)
if (skills != null && !skills.isEmpty()) {
    for (String skill : skills) {
        boolQuery.filter(TermQuery.of(t -> t.field("skills").value(skill))._toQuery());
    }
}
```

---

### Step 7 — JobRepository (MongoDB)

```java
public interface JobRepository extends MongoRepository<Job, String> {
    Optional<Job> findByIdAndDeletedFalse(String id);
    Page<Job> findByDeletedFalse(Pageable pageable);
    Page<Job> findByRecruiterIdAndDeletedFalse(String recruiterId, Pageable pageable);
    Page<Job> findByStatusAndDeletedFalse(JobStatus status, Pageable pageable);
    boolean existsByIdAndRecruiterId(String id, String recruiterId);
}
```

---

### Step 8 — JobMapper (MapStruct)

```java
@Mapper(componentModel = "spring")
public interface JobMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "recruiterId", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    Job toJob(JobCreateRequest request);

    JobResponse toJobResponse(Job job);
    JobResponse toJobResponse(JobDocument document);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateJob(@MappingTarget Job job, JobUpdateRequest request);

    JobDocument toDocument(Job job);
}
```

---

### Step 9 — JobService (rewrite)

```java
@Service
public class JobService {
    // Dependencies: JobRepository, JobIndexService, JobMapper, ApplicationContext

    // CREATE — recruiter only
    // - Set recruiterId = JWT subject
    // - Set status = DRAFT
    // - Save to MongoDB
    // - Sync to Elasticsearch (only when status = ACTIVE)
    public JobResponse createJob(JobCreateRequest request, String recruiterId);

    // READ — anyone can view ACTIVE jobs
    public JobResponse getJobById(String id);                        // public
    public PageResponse<JobResponse> getActiveJobs(int page, int size); // public
    public PageResponse<JobResponse> getMyJobs(String recruiterId, int page, int size); // RECRUITER

    // UPDATE — recruiter can update their own job only
    // - Check job.recruiterId == JWT.subject || isAdmin
    // - If status CLOSED/EXPIRED → disallow update
    public JobResponse updateJob(String id, JobUpdateRequest request, String userId, boolean isAdmin);

    // PUBLISH — DRAFT → ACTIVE
    // - Validate deadline in the future
    // - Save MongoDB + index Elasticsearch
    public JobResponse publishJob(String id, String userId, boolean isAdmin);

    // CLOSE — ACTIVE → CLOSED
    // - Remove from Elasticsearch
    public JobResponse closeJob(String id, String userId, boolean isAdmin);

    // DELETE (soft) — admin only
    // - Set deleted=true, deletedAt
    // - Remove from Elasticsearch
    public void deleteJob(String id);

    // SEARCH — via Elasticsearch
    public PageResponse<JobResponse> searchJobs(JobSearchRequest request);

    // ADMIN: get all jobs (no filter)
    public PageResponse<JobResponse> getAllJobs(int page, int size);
}
```

---

### Step 10 — JobController (rewrite)

```
POST   /api/jobs                    → RECRUITER          createJob
GET    /api/jobs                    → public             getActiveJobs (paginated)
GET    /api/jobs/search             → public             searchJobs (ES)
GET    /api/jobs/my                 → RECRUITER          getMyJobs
GET    /api/jobs/admin/all          → ADMIN              getAllJobs (no filter)
GET    /api/jobs/{id}               → public             getJobById
PUT    /api/jobs/{id}               → RECRUITER / ADMIN  updateJob
PATCH  /api/jobs/{id}/publish       → RECRUITER / ADMIN  publishJob
PATCH  /api/jobs/{id}/close         → RECRUITER / ADMIN  closeJob
DELETE /api/jobs/{id}               → ADMIN              deleteJob
```

**Security per endpoint:**
```java
@PostMapping
@PreAuthorize("hasRole('RECRUITER')")

@GetMapping                         // no annotation = authenticated or public
@GetMapping("/search")              // public

@GetMapping("/my")
@PreAuthorize("hasRole('RECRUITER')")

@GetMapping("/admin/all")
@PreAuthorize("hasRole('ADMIN')")

@PutMapping("/{id}")
@PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")

@PatchMapping("/{id}/publish")
@PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")

@PatchMapping("/{id}/close")
@PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")

@DeleteMapping("/{id}")
@PreAuthorize("hasRole('ADMIN')")
```

---

### Step 11 — SecurityConfig

Configure similarly to user-service:

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    final String[] PUBLIC_GET_ENDPOINTS = {
        "/api/jobs",
        "/api/jobs/search",
        "/api/jobs/{id}",
        "/v3/api-docs/**", "/swagger-ui/**"
    };

    // JWT resource server with HS512 custom decoder
    // Extract scope → ROLE_ prefix
    // Public: GET /api/jobs, GET /api/jobs/search, GET /api/jobs/{id}
    // Authenticated: everything else
}
```

**`CustomerJwtDecoder.java`** — copy from user-service, using the same `JWT_SECRET_KEY`.

Reason for not using `spring.security.oauth2.resourceserver.jwt.secret-key`: need a custom decoder for blacklist checks or introspection if required.

---

### Step 12 — RabbitMQ (Job Events)

**`RabbitMQConfig.java`:**
```java
EXCHANGE = "job.exchange"  (DirectExchange)
JOB_CREATED_QUEUE = "job.created.queue"    routing key: "job.created"
JOB_UPDATED_QUEUE = "job.updated.queue"    routing key: "job.updated"
JOB_CLOSED_QUEUE  = "job.closed.queue"     routing key: "job.closed"
```

**Event message:**
```java
public class JobEventMessage {
    String jobId;
    String recruiterId;
    String title;
    String company;
    String eventType;   // CREATED, UPDATED, CLOSED, EXPIRED
    LocalDateTime occurredAt;
}
```

**Publish points:**
- After `publishJob()` → publish `job.created`
- After `updateJob()` → publish `job.updated`
- After `closeJob()` → publish `job.closed`

> Notification service listens for these events to notify candidates following the company (next phase).

---

### Step 13 — API Gateway update

**`application.yaml`** — add route:
```yaml
- id: job-service
  uri: ${JOB_SERVICE_URI:http://localhost:8082}
  predicates:
    - Path=/job/**
```

**`AuthenticationFilter.java`** — update bypass list:
```java
// Add public endpoints for job-service
if (path.contains("user/api/auth/login")
    || path.contains("user/api/auth/register")
    || path.contains("user/api/auth/verify-registration")
    || path.contains("user/api/auth/resend-otp")
    || path.contains("user/api/auth/forgot-password")
    || path.contains("user/api/auth/reset-password")
    || (path.contains("job/api/jobs") && method == GET
        && !path.contains("/my") && !path.contains("/admin"))) {
    return chain.filter(exchange);
}
```

---

### Step 14 — application.yaml (job-service update)

Add:
```yaml
JWT_SECRET_KEY: ${JWT_SECRET_KEY}
JWT_VALID_DURATION: ${JWT_VALID_DURATION:60}

rabbitmq:
  host: ${RABBITMQ_HOST:localhost}
  port: ${RABBITMQ_PORT:5672}
  username: ${RABBITMQ_USER:admin}
  password: ${RABBITMQ_PASSWORD:admin123}

app:
  job-default-page-size: ${JOB_DEFAULT_PAGE_SIZE:10}

logging:
  level:
    "vn.chuongpl.job_service": INFO  # fix: currently logs "vn.chuongpl.user_service"
```

---

## Implementation order (recommended)

```
Step 1   pom.xml                        ~15 min
Step 2   Package structure (create folders)  ~5 min
Step 3   Enums + Exception              ~20 min
Step 4   Job entity                     ~15 min
Step 5   DTOs (request + response)      ~20 min
Step 6   JobDocument + ES Repository    ~30 min
Step 7   JobMapper                      ~15 min
Step 8   JobRepository (MongoDB)        ~10 min
Step 9   SecurityConfig + JwtDecoder    ~30 min  ← reuse user-service code
Step 10  JobIndexService (ES search)    ~45 min  ← most complex
Step 11  RabbitMQConfig + Event DTO     ~20 min
Step 12  JobService (rewrite)           ~60 min
Step 13  JobController (rewrite)        ~30 min
Step 14  API Gateway update             ~15 min
Step 15  application.yaml fix           ~10 min
Step 16  Compile + manual tests         ~30 min
```

**Estimated total: ~6 hours**

---

## End-to-end flow after implementation

```
[RECRUITER creates job]
POST /job/api/jobs  (Bearer Token)
  → SecurityConfig validates JWT → extract recruiterId from sub
  → @PreAuthorize hasRole('RECRUITER')
  → JobService.createJob() sets recruiterId, status=DRAFT
  → Save MongoDB
  → Return JobResponse (status=DRAFT, not indexed in ES)

[RECRUITER publishes job]
PATCH /job/api/jobs/{id}/publish  (Bearer Token)
  → Check job.recruiterId == JWT.sub
  → Validate deadline > today
  → Set status=ACTIVE → Save MongoDB
  → JobIndexService.indexJob() → Elasticsearch
  → RabbitMQ publish "job.created" event

[CANDIDATE searches]
GET /job/api/jobs/search?keyword=java&location=HCM&salaryMin=15000000
  → No JWT required (public)
  → JobIndexService.search() → Elasticsearch BoolQuery
  → Filter status=ACTIVE
  → Return PageResponse<JobResponse>

[RECRUITER closes job]
PATCH /job/api/jobs/{id}/close  (Bearer Token)
  → Check ownership
  → Set status=CLOSED → Save MongoDB
  → JobIndexService.removeFromIndex() → remove from ES
  → RabbitMQ publish "job.closed" event

[ADMIN deletes job]
DELETE /job/api/jobs/{id}  (Bearer Token - ADMIN)
  → Soft delete MongoDB
  → JobIndexService.removeFromIndex()
```

---

## Technical notes

1. **Elasticsearch index creation**: Use `spring.elasticsearch.repositories.enabled=true` + `@Document` to auto-create index. For custom mappings (n-gram analyzer for Vietnamese), add `job-settings.json` under `resources/elasticsearch/`.

2. **MapStruct + Lombok**: Declare both in `annotationProcessorPaths` of `maven-compiler-plugin`, Lombok must come **before** MapStruct.

3. **Dual-write consistency**: If ES indexing fails after MongoDB save → log warning + retry. Use `try-catch` inside `JobIndexService` to avoid rolling back the MongoDB transaction.

4. **Salary fields**: Replace `salary` (Double) with `salaryMin` + `salaryMax` to support range filters.

5. **Owner check pattern**: Service receives `(String userId, boolean isAdmin)` from controller (from JWT), check `!isAdmin && !job.getRecruiterId().equals(userId)` → throw `JOB_NOT_OWNER`.

6. **application.yaml bug**: Line `"vn.chuongpl.user_service": INFO` must be changed to `"vn.chuongpl.job_service": INFO`.
