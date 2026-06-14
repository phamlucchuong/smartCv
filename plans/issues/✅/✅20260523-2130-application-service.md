# Application Service — Implementation Plan

## Scope

Build the Application Service from scratch (port 8083). This service manages the lifecycle of
job applications: candidates submit applications for active jobs, recruiters review and make
decisions, both sides receive notifications via RabbitMQ.

---

## Current assessment

This service does not exist yet. CLAUDE.md lists it as *Planned (not yet implemented)*.

Reference contracts from related services already planned:
- **Job Service** (`20260523-2100-job-service-completion.md`): provides `GET /api/jobs/{id}` to
  verify a job is `ACTIVE` before accepting an application.
- **Gateway Centralized Auth** (`20260523-2112-gateway-centralized-auth.md`): gateway forwards
  `X-User-Id`, `X-User-Scope`, `X-Gateway-Secret` headers; this service must use
  `InternalAuthFilter` (no JWT validation).
- **Notification Service**: consumes RabbitMQ events for email/SMS delivery.

---

## Domain design

### Application entity

```
Application (MongoDB collection: "applications")
├── id                 (String, @MongoId)
├── candidateId        (String)          ← X-User-Id at submit time (immutable)
├── jobId              (String)          ← immutable after creation
├── recruiterId        (String)          ← denormalized from job at creation time (immutable)
├── status             (ApplicationStatus)
├── coverLetter        (String, optional)
├── cvUrl              (String)          ← link to candidate's CV file
├── recruiterNotes     (String, optional) ← only visible to RECRUITER / ADMIN
├── rejectionReason    (String, optional) ← visible to candidate on REJECTED
├── appliedAt          (LocalDateTime)
├── updatedAt          (LocalDateTime)
├── deleted            (boolean, default false)
└── deletedAt          (LocalDateTime)
```

`recruiterId` is denormalized at creation time by calling job-service. This avoids a join on
every query while keeping recruiter-scoped list queries fast.

### Application status lifecycle

```
                ┌─────────┐
   CANDIDATE    │ PENDING │──────────────────────────────────────────┐
   submits      └────┬────┘                                          │
                     │ RECRUITER opens                               │ CANDIDATE
                     ▼                                               │ withdraws
              ┌────────────┐                                         │
              │ REVIEWING  │─────────────────────────────────────────┤
              └──────┬─────┘                                         │
                     │                                               │
          ┌──────────┴──────────┐                                    │
          ▼                     ▼                                    ▼
     ┌──────────┐          ┌──────────┐                       ┌───────────┐
     │ ACCEPTED │          │ REJECTED │                       │ WITHDRAWN │
     └──────────┘          └──────────┘                       └───────────┘
```

**Business rules:**
- A candidate may not submit a second application for the same job while one is `PENDING` or
  `REVIEWING`. Re-apply is allowed after `WITHDRAWN` or `REJECTED`.
- Applications cannot be submitted for jobs with status `DRAFT`, `CLOSED`, or `EXPIRED`.
- A recruiter may only change status for applications that belong to their own jobs.
- Once `ACCEPTED`, `REJECTED`, or `WITHDRAWN`, status is terminal — no further transitions.

### Authorization matrix

| Action | CANDIDATE | RECRUITER | ADMIN |
|--------|-----------|-----------|-------|
| Submit application (`POST`) | ✅ own candidateId only | ❌ | ✅ |
| View own applications (`GET /my`) | ✅ | ❌ | ✅ |
| View single application (`GET /{id}`) | ✅ own only | ✅ own job only | ✅ |
| List applications for a job (`GET /job/{jobId}`) | ❌ | ✅ own job only | ✅ |
| Update status (`PATCH /{id}/status`) | ❌ | ✅ own job only | ✅ |
| Withdraw (`PATCH /{id}/withdraw`) | ✅ own only | ❌ | ✅ |
| Delete (soft) (`DELETE /{id}`) | ❌ | ❌ | ✅ |
| List all applications (`GET /admin/all`) | ❌ | ❌ | ✅ |

---

## Package structure

```
application_service/src/main/java/vn/chuongpl/application_service/
├── ApplicationServiceApplication.java
├── config/
│   ├── AppConfig.java                  (RestTemplate bean)
│   ├── RabbitMQConfig.java             (exchange, queues, routing keys)
│   ├── OpenApiConfig.java              (Swagger Bearer auth scheme)
│   └── SecurityConfig.java             (InternalAuthFilter + @EnableMethodSecurity)
├── dtos/
│   ├── ApiResponse.java
│   ├── PageResponse.java
│   ├── request/
│   │   ├── ApplicationCreateRequest.java
│   │   ├── ApplicationStatusUpdateRequest.java
│   │   └── RecruiterNotesRequest.java
│   └── response/
│       ├── ApplicationResponse.java      (base — no recruiterNotes)
│       └── ApplicationDetailResponse.java (includes recruiterNotes for RECRUITER/ADMIN)
├── enums/
│   ├── ErrorCode.java
│   └── ApplicationStatus.java
├── exception/
│   ├── AppException.java
│   └── GlobalExceptionHandler.java
├── features/
│   └── application/
│       ├── Application.java             (MongoDB entity)
│       ├── ApplicationRepository.java
│       ├── ApplicationMapper.java       (MapStruct)
│       ├── ApplicationService.java
│       └── ApplicationController.java
├── integration/
│   ├── job/
│   │   ├── JobClient.java               (RestTemplate HTTP client)
│   │   └── JobResponse.java             (minimal DTO — id, recruiterId, status)
│   └── notification/
│       ├── NotificationPublisher.java   (RabbitMQ publisher)
│       └── ApplicationEventMessage.java (message DTO)
└── security/
    └── InternalAuthFilter.java          (reads gateway headers → SecurityContext)
```

---

## Step-by-step implementation

### Step 1 — Bootstrap: create the project + `pom.xml`

Use Spring Initializr or copy an existing service's `pom.xml` as a base.

**Parent:**
```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.4.4</version>
</parent>
```

**Dependencies:**
```xml
<!-- Web -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>

<!-- Database -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-mongodb</artifactId>
</dependency>

<!-- Security (authorization only — no JWT stack) -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>

<!-- Messaging -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-amqp</artifactId>
</dependency>

<!-- Mapping -->
<dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct</artifactId>
    <version>1.5.5.Final</version>
</dependency>

<!-- Utilities -->
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
</dependency>
<dependency>
    <groupId>io.github.cdimascio</groupId>
    <artifactId>dotenv-java</artifactId>
    <version>3.0.0</version>
</dependency>

<!-- API Docs -->
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.8.3</version>
</dependency>
```

**`maven-compiler-plugin` annotation processors:** Lombok must appear before MapStruct.

```xml
<annotationProcessorPaths>
    <path><groupId>org.projectlombok</groupId><artifactId>lombok</artifactId></path>
    <path>
        <groupId>org.mapstruct</groupId><artifactId>mapstruct-processor</artifactId>
        <version>1.5.5.Final</version>
    </path>
</annotationProcessorPaths>
```

---

### Step 2 — `application.yaml`

```yaml
server:
  port: ${APP_SERVICE_PORT:8083}
  servlet:
    context-path: /application

spring:
  config:
    import: optional:file:../.env[.properties]
  application:
    name: ApplicationService
  data:
    mongodb:
      uri: mongodb://${MONGO_DB_USERNAME:admin}:${MONGO_DB_PASSWORD:admin}@${MONGO_DB_HOST:localhost}:${MONGO_DB_PORT:27017}/${APP_MONGO_DB_NAME:application_db}?authSource=admin
      auto-index-creation: true
  rabbitmq:
    host: ${RABBITMQ_HOST:localhost}
    port: ${RABBITMQ_PORT:5672}
    username: ${RABBITMQ_USER:admin}
    password: ${RABBITMQ_PASSWORD:admin123}
  main:
    banner-mode: "off"
  output:
    ansi:
      enabled: ALWAYS

app:
  gateway:
    internal-secret: ${GATEWAY_INTERNAL_SECRET:changeme}
  job-service:
    base-url: ${JOB_SERVICE_URL:http://localhost:8082/job}
  default-page-size: ${APP_DEFAULT_PAGE_SIZE:10}

logging:
  level:
    root: WARN
    "vn.chuongpl.application_service": INFO
  pattern:
    console: "%d{HH:mm:ss.SSS} %-5level %msg%n"

springdoc:
  api-docs:
    path: /v3/api-docs
  swagger-ui:
    path: /swagger-ui.html
    enabled: true
```

---

### Step 3 — Enums

**`ApplicationStatus.java`:**
```java
public enum ApplicationStatus {
    PENDING,    // submitted, not yet reviewed
    REVIEWING,  // recruiter opened the application
    ACCEPTED,   // terminal: recruiter accepted
    REJECTED,   // terminal: recruiter rejected
    WITHDRAWN   // terminal: candidate withdrew
}
```

**`ErrorCode.java`:**
```java
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error"),
    UNAUTHENTICATED(1005, "Unauthenticated"),
    UNAUTHORIZED(1006, "You do not have permission to perform this action"),
    APPLICATION_NOT_FOUND(7001, "Application not found"),
    APPLICATION_ALREADY_EXISTS(7002, "You have already applied for this job"),
    APPLICATION_STATUS_TERMINAL(7003, "Application is already in a terminal state"),
    APPLICATION_INVALID_TRANSITION(7004, "Invalid status transition"),
    JOB_NOT_FOUND(7005, "Job not found"),
    JOB_NOT_ACCEPTING_APPLICATIONS(7006, "This job is not accepting applications"),
    JOB_SERVICE_UNAVAILABLE(7007, "Job service is currently unavailable");

    private final int code;
    private final String message;
}
```

---

### Step 4 — Application entity

```java
@Document(collection = "applications")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Application {
    @MongoId
    String id;

    @Field("candidate_id")
    String candidateId;

    @Field("job_id")
    String jobId;

    @Field("recruiter_id")
    String recruiterId;           // denormalized from job at creation time

    @Builder.Default
    ApplicationStatus status = ApplicationStatus.PENDING;

    @Field("cover_letter")
    String coverLetter;

    @Field("cv_url")
    String cvUrl;

    @Field("recruiter_notes")
    String recruiterNotes;        // not exposed to candidates

    @Field("rejection_reason")
    String rejectionReason;       // exposed to candidate when REJECTED

    @Field("applied_at")
    LocalDateTime appliedAt;

    @Field("updated_at")
    LocalDateTime updatedAt;

    @Builder.Default
    boolean deleted = false;

    @Field("deleted_at")
    LocalDateTime deletedAt;
}
```

---

### Step 5 — DTOs

**`ApplicationCreateRequest.java`:**
```java
public class ApplicationCreateRequest {
    @NotBlank String jobId;
    @NotBlank String cvUrl;
    String coverLetter;    // optional
}
```

**`ApplicationStatusUpdateRequest.java`:**
```java
public class ApplicationStatusUpdateRequest {
    @NotNull ApplicationStatus status;   // REVIEWING, ACCEPTED, or REJECTED only
    String rejectionReason;              // required when status = REJECTED
    String recruiterNotes;               // optional private note
}
```

**`RecruiterNotesRequest.java`:**
```java
public class RecruiterNotesRequest {
    String notes;
}
```

**`ApplicationResponse.java`** — returned to candidate and general viewers:
```java
public class ApplicationResponse {
    String id;
    String candidateId;
    String jobId;
    String recruiterId;
    ApplicationStatus status;
    String coverLetter;
    String cvUrl;
    String rejectionReason;   // only populated when status = REJECTED
    LocalDateTime appliedAt;
    LocalDateTime updatedAt;
}
```

**`ApplicationDetailResponse.java`** — returned to RECRUITER / ADMIN (includes private fields):
```java
public class ApplicationDetailResponse {
    // all fields from ApplicationResponse
    String recruiterNotes;
}
```

---

### Step 6 — ApplicationRepository

```java
public interface ApplicationRepository extends MongoRepository<Application, String> {

    // Duplicate check before creating
    boolean existsByCandidateIdAndJobIdAndStatusIn(
        String candidateId, String jobId, List<ApplicationStatus> statuses);

    // Candidate: own list
    Page<Application> findByCandidateIdAndDeletedFalse(String candidateId, Pageable pageable);

    // Recruiter: applications for their job
    Page<Application> findByJobIdAndDeletedFalse(String jobId, Pageable pageable);

    // Recruiter: applications across all their jobs
    Page<Application> findByRecruiterIdAndDeletedFalse(String recruiterId, Pageable pageable);

    // Admin: all
    Page<Application> findAllByDeletedFalse(Pageable pageable);

    Optional<Application> findByIdAndDeletedFalse(String id);
}
```

---

### Step 7 — ApplicationMapper (MapStruct)

```java
@Mapper(componentModel = "spring")
public interface ApplicationMapper {

    ApplicationResponse toResponse(Application application);

    ApplicationDetailResponse toDetailResponse(Application application);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateStatus(@MappingTarget Application application,
                      ApplicationStatusUpdateRequest request);
}
```

---

### Step 8 — Integration: JobClient

Validates that the job exists and is `ACTIVE` before accepting an application. Also retrieves `recruiterId` for denormalization.

```java
@Component
@RequiredArgsConstructor
public class JobClient {

    final RestTemplate restTemplate;

    @Value("${app.job-service.base-url}")
    String jobServiceBaseUrl;

    /**
     * Returns minimal job info. Throws AppException if job not found or not ACTIVE.
     */
    public JobResponse getActiveJob(String jobId) {
        String url = jobServiceBaseUrl + "/api/jobs/" + jobId;
        try {
            ResponseEntity<ApiResponse<JobResponse>> response =
                restTemplate.exchange(url, HttpMethod.GET, null,
                    new ParameterizedTypeReference<>() {});
            JobResponse job = Objects.requireNonNull(response.getBody()).getData();
            if (job == null) throw new AppException(ErrorCode.JOB_NOT_FOUND);
            if (!"ACTIVE".equals(job.getStatus())) {
                throw new AppException(ErrorCode.JOB_NOT_ACCEPTING_APPLICATIONS);
            }
            return job;
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Job service call failed: {}", e.getMessage());
            throw new AppException(ErrorCode.JOB_SERVICE_UNAVAILABLE);
        }
    }
}
```

**`JobResponse.java`** (minimal DTO for inter-service use):
```java
public class JobResponse {
    String id;
    String recruiterId;
    String status;      // "ACTIVE", "CLOSED", etc.
    String title;
    String company;
}
```

---

### Step 9 — Integration: NotificationPublisher

```java
@Component
@RequiredArgsConstructor
public class NotificationPublisher {

    final RabbitTemplate rabbitTemplate;

    public void publishStatusChanged(Application application) {
        ApplicationEventMessage message = ApplicationEventMessage.builder()
            .applicationId(application.getId())
            .candidateId(application.getCandidateId())
            .recruiterId(application.getRecruiterId())
            .jobId(application.getJobId())
            .newStatus(application.getStatus().name())
            .rejectionReason(application.getRejectionReason())
            .occurredAt(LocalDateTime.now())
            .build();

        String routingKey = switch (application.getStatus()) {
            case ACCEPTED  -> RabbitMQConfig.APPLICATION_ACCEPTED_KEY;
            case REJECTED  -> RabbitMQConfig.APPLICATION_REJECTED_KEY;
            case WITHDRAWN -> RabbitMQConfig.APPLICATION_WITHDRAWN_KEY;
            default        -> null;
        };

        if (routingKey != null) {
            rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, routingKey, message);
        }
    }
}
```

**`ApplicationEventMessage.java`:**
```java
@Data @Builder
public class ApplicationEventMessage implements Serializable {
    String applicationId;
    String candidateId;
    String recruiterId;
    String jobId;
    String newStatus;
    String rejectionReason;
    LocalDateTime occurredAt;
}
```

---

### Step 10 — RabbitMQConfig

```java
@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE              = "application.exchange";
    public static final String APPLICATION_ACCEPTED_KEY  = "application.accepted";
    public static final String APPLICATION_REJECTED_KEY  = "application.rejected";
    public static final String APPLICATION_WITHDRAWN_KEY = "application.withdrawn";

    @Bean
    DirectExchange applicationExchange() {
        return new DirectExchange(EXCHANGE);
    }

    @Bean Queue acceptedQueue()  { return new Queue("application.accepted.queue"); }
    @Bean Queue rejectedQueue()  { return new Queue("application.rejected.queue"); }
    @Bean Queue withdrawnQueue() { return new Queue("application.withdrawn.queue"); }

    @Bean Binding acceptedBinding(DirectExchange e)  {
        return BindingBuilder.bind(acceptedQueue()).to(e).with(APPLICATION_ACCEPTED_KEY);
    }
    @Bean Binding rejectedBinding(DirectExchange e)  {
        return BindingBuilder.bind(rejectedQueue()).to(e).with(APPLICATION_REJECTED_KEY);
    }
    @Bean Binding withdrawnBinding(DirectExchange e) {
        return BindingBuilder.bind(withdrawnQueue()).to(e).with(APPLICATION_WITHDRAWN_KEY);
    }

    @Bean
    MessageConverter jackson2MessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
```

---

### Step 11 — Security: InternalAuthFilter + SecurityConfig

**`InternalAuthFilter.java`** — identical to the one defined in `20260523-2112-gateway-centralized-auth.md`.
Reads `X-Gateway-Secret`, `X-User-Id`, `X-User-Scope` and builds `UsernamePasswordAuthenticationToken`.

**`SecurityConfig.java`:**
```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    final InternalAuthFilter internalAuthFilter;

    final String[] SWAGGER_ENDPOINTS = {
        "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html",
        "/swagger-resources/**", "/webjars/**"
    };

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(internalAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(SWAGGER_ENDPOINTS).permitAll()
                .anyRequest().authenticated()
            );
        return http.build();
    }
}
```

All fine-grained authorization is handled via `@PreAuthorize` on individual controller methods.

---

### Step 12 — ApplicationService

```java
@Service
@RequiredArgsConstructor
public class ApplicationService {

    final ApplicationRepository applicationRepository;
    final ApplicationMapper applicationMapper;
    final JobClient jobClient;
    final NotificationPublisher notificationPublisher;

    @Value("${app.default-page-size:10}")
    int defaultPageSize;

    // ── CANDIDATE: submit ────────────────────────────────────────────
    public ApplicationResponse submit(ApplicationCreateRequest request, String candidateId) {

        // 1. Validate job is ACTIVE and get recruiterId
        JobResponse job = jobClient.getActiveJob(request.getJobId());

        // 2. Prevent duplicate active application
        boolean alreadyApplied = applicationRepository
            .existsByCandidateIdAndJobIdAndStatusIn(
                candidateId, request.getJobId(),
                List.of(ApplicationStatus.PENDING, ApplicationStatus.REVIEWING,
                        ApplicationStatus.ACCEPTED));
        if (alreadyApplied) throw new AppException(ErrorCode.APPLICATION_ALREADY_EXISTS);

        // 3. Create
        Application app = Application.builder()
            .candidateId(candidateId)
            .jobId(request.getJobId())
            .recruiterId(job.getRecruiterId())
            .coverLetter(request.getCoverLetter())
            .cvUrl(request.getCvUrl())
            .appliedAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        return applicationMapper.toResponse(applicationRepository.save(app));
    }

    // ── CANDIDATE: own list ──────────────────────────────────────────
    public PageResponse<ApplicationResponse> getMyApplications(
            String candidateId, int page, int size) {

        Pageable pageable = buildPageable(page, size);
        Page<Application> results =
            applicationRepository.findByCandidateIdAndDeletedFalse(candidateId, pageable);
        return toPage(results, applicationMapper::toResponse, page, size);
    }

    // ── SHARED: get single ───────────────────────────────────────────
    public Object getById(String id, String userId, boolean isAdmin, boolean isRecruiter) {
        Application app = findActiveById(id);

        if (isAdmin) return applicationMapper.toDetailResponse(app);

        if (isRecruiter) {
            if (!app.getRecruiterId().equals(userId))
                throw new AppException(ErrorCode.UNAUTHORIZED);
            return applicationMapper.toDetailResponse(app);
        }

        // CANDIDATE: own only
        if (!app.getCandidateId().equals(userId))
            throw new AppException(ErrorCode.UNAUTHORIZED);
        return applicationMapper.toResponse(app);
    }

    // ── RECRUITER: applications for a job ────────────────────────────
    public PageResponse<ApplicationDetailResponse> getByJobId(
            String jobId, String recruiterId, boolean isAdmin, int page, int size) {

        // if not admin, verify job belongs to this recruiter
        // (query by jobId + recruiterId filter)
        Pageable pageable = buildPageable(page, size);
        Page<Application> results =
            applicationRepository.findByJobIdAndDeletedFalse(jobId, pageable);

        if (!isAdmin) {
            // ensure first result's recruiterId matches, or check DB with compound query
            results.getContent().stream()
                .filter(a -> !a.getRecruiterId().equals(recruiterId))
                .findFirst()
                .ifPresent(a -> { throw new AppException(ErrorCode.UNAUTHORIZED); });
        }

        return toPage(results, applicationMapper::toDetailResponse, page, size);
    }

    // ── RECRUITER: update status ──────────────────────────────────────
    public ApplicationDetailResponse updateStatus(String id,
            ApplicationStatusUpdateRequest request,
            String recruiterId, boolean isAdmin) {

        Application app = findActiveById(id);

        if (!isAdmin && !app.getRecruiterId().equals(recruiterId))
            throw new AppException(ErrorCode.UNAUTHORIZED);

        validateRecruiterTransition(app.getStatus(), request.getStatus());

        if (request.getStatus() == ApplicationStatus.REJECTED
                && (request.getRejectionReason() == null || request.getRejectionReason().isBlank())) {
            throw new AppException(ErrorCode.APPLICATION_INVALID_TRANSITION);  // reason required
        }

        applicationMapper.updateStatus(app, request);
        app.setUpdatedAt(LocalDateTime.now());
        Application saved = applicationRepository.save(app);

        notificationPublisher.publishStatusChanged(saved);

        return applicationMapper.toDetailResponse(saved);
    }

    // ── CANDIDATE: withdraw ───────────────────────────────────────────
    public ApplicationResponse withdraw(String id, String candidateId) {
        Application app = findActiveById(id);

        if (!app.getCandidateId().equals(candidateId))
            throw new AppException(ErrorCode.UNAUTHORIZED);

        if (!EnumSet.of(ApplicationStatus.PENDING, ApplicationStatus.REVIEWING)
                .contains(app.getStatus())) {
            throw new AppException(ErrorCode.APPLICATION_STATUS_TERMINAL);
        }

        app.setStatus(ApplicationStatus.WITHDRAWN);
        app.setUpdatedAt(LocalDateTime.now());
        Application saved = applicationRepository.save(app);

        notificationPublisher.publishStatusChanged(saved);

        return applicationMapper.toResponse(saved);
    }

    // ── ADMIN: soft delete ────────────────────────────────────────────
    public void delete(String id) {
        Application app = findActiveById(id);
        app.setDeleted(true);
        app.setDeletedAt(LocalDateTime.now());
        applicationRepository.save(app);
    }

    // ── ADMIN: all applications ───────────────────────────────────────
    public PageResponse<ApplicationDetailResponse> getAll(int page, int size) {
        Page<Application> results =
            applicationRepository.findAllByDeletedFalse(buildPageable(page, size));
        return toPage(results, applicationMapper::toDetailResponse, page, size);
    }

    // ── private helpers ───────────────────────────────────────────────
    private Application findActiveById(String id) {
        return applicationRepository.findByIdAndDeletedFalse(id)
            .orElseThrow(() -> new AppException(ErrorCode.APPLICATION_NOT_FOUND));
    }

    private void validateRecruiterTransition(ApplicationStatus current,
                                              ApplicationStatus next) {
        // Recruiter can only set: REVIEWING, ACCEPTED, REJECTED
        boolean allowed = switch (current) {
            case PENDING   -> next == ApplicationStatus.REVIEWING;
            case REVIEWING -> next == ApplicationStatus.ACCEPTED
                           || next == ApplicationStatus.REJECTED;
            default        -> false;  // terminal states
        };
        if (!allowed) throw new AppException(ErrorCode.APPLICATION_INVALID_TRANSITION);
    }

    private Pageable buildPageable(int page, int size) {
        int p = page > 0 ? page - 1 : 0;
        int s = size > 0 ? size : defaultPageSize;
        return PageRequest.of(p, s, Sort.by(Sort.Direction.DESC, "appliedAt"));
    }

    private <T, R> PageResponse<R> toPage(Page<T> page, java.util.function.Function<T, R> mapper,
                                           int pageNum, int size) {
        return PageResponse.<R>builder()
            .items(page.getContent().stream().map(mapper).toList())
            .total(page.getTotalElements())
            .page(pageNum)
            .pageSize(size > 0 ? size : defaultPageSize)
            .totalPages(page.getTotalPages())
            .build();
    }
}
```

---

### Step 13 — ApplicationController

```java
@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {

    final ApplicationService applicationService;

    // ── CANDIDATE: submit ─────────────────────────────────────────────
    @PostMapping
    @PreAuthorize("hasRole('CANDIDATE')")
    public ApiResponse<ApplicationResponse> submit(
            @Valid @RequestBody ApplicationCreateRequest request,
            @AuthenticationPrincipal String userId) {
        return ApiResponse.<ApplicationResponse>builder()
            .message("Application submitted successfully")
            .data(applicationService.submit(request, userId))
            .build();
    }

    // ── CANDIDATE: own list ───────────────────────────────────────────
    @GetMapping("/my")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ApiResponse<PageResponse<ApplicationResponse>> getMyApplications(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal String userId) {
        return ApiResponse.<PageResponse<ApplicationResponse>>builder()
            .data(applicationService.getMyApplications(userId, page, size))
            .build();
    }

    // ── SHARED: single application ────────────────────────────────────
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Object> getById(
            @PathVariable String id,
            @AuthenticationPrincipal String userId,
            Authentication authentication) {
        boolean isAdmin     = hasRole(authentication, "ROLE_ADMIN");
        boolean isRecruiter = hasRole(authentication, "ROLE_RECRUITER");
        return ApiResponse.builder()
            .data(applicationService.getById(id, userId, isAdmin, isRecruiter))
            .build();
    }

    // ── RECRUITER: applications for a job ─────────────────────────────
    @GetMapping("/job/{jobId}")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    public ApiResponse<PageResponse<ApplicationDetailResponse>> getByJobId(
            @PathVariable String jobId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal String userId,
            Authentication authentication) {
        boolean isAdmin = hasRole(authentication, "ROLE_ADMIN");
        return ApiResponse.<PageResponse<ApplicationDetailResponse>>builder()
            .data(applicationService.getByJobId(jobId, userId, isAdmin, page, size))
            .build();
    }

    // ── RECRUITER: update status ──────────────────────────────────────
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    public ApiResponse<ApplicationDetailResponse> updateStatus(
            @PathVariable String id,
            @Valid @RequestBody ApplicationStatusUpdateRequest request,
            @AuthenticationPrincipal String userId,
            Authentication authentication) {
        boolean isAdmin = hasRole(authentication, "ROLE_ADMIN");
        return ApiResponse.<ApplicationDetailResponse>builder()
            .message("Application status updated")
            .data(applicationService.updateStatus(id, request, userId, isAdmin))
            .build();
    }

    // ── CANDIDATE: withdraw ───────────────────────────────────────────
    @PatchMapping("/{id}/withdraw")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ApiResponse<ApplicationResponse> withdraw(
            @PathVariable String id,
            @AuthenticationPrincipal String userId) {
        return ApiResponse.<ApplicationResponse>builder()
            .message("Application withdrawn")
            .data(applicationService.withdraw(id, userId))
            .build();
    }

    // ── ADMIN: all applications ───────────────────────────────────────
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<PageResponse<ApplicationDetailResponse>> getAll(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.<PageResponse<ApplicationDetailResponse>>builder()
            .data(applicationService.getAll(page, size))
            .build();
    }

    // ── ADMIN: soft delete ────────────────────────────────────────────
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> delete(@PathVariable String id) {
        applicationService.delete(id);
        return ApiResponse.<Void>builder().message("Application deleted").build();
    }

    private boolean hasRole(Authentication auth, String role) {
        return auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals(role));
    }
}
```

---

### Step 14 — API Gateway: add route + update public routes

**`application.yaml` in api-gateway — add route:**
```yaml
- id: application-service
  uri: ${APP_SERVICE_URI:http://localhost:8083}
  predicates:
    - Path=/application/**
```

**`PublicRoutesMatcher` config — no public routes for application-service.** All endpoints require authentication.

---

### Step 15 — Update infrastructure files

**`docker-compose.yaml`** — network note: application-service should be on `smartCv-net` with no port exposed to host (same as the gateway-centralized-auth plan network isolation strategy).

**`.env.example`** — add:
```
APP_SERVICE_PORT=8083
APP_SERVICE_URI=http://localhost:8083
APP_MONGO_DB_NAME=application_db
APP_DEFAULT_PAGE_SIZE=10
```

**`CLAUDE.md` → Service Map table** — add `application_service` row:

| `application_service` | Java/Spring Boot 3.4.4 | 8083 | MongoDB | Job application lifecycle, CRUD, role-based access |

---

## Complete API reference

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `POST` | `/api/applications` | CANDIDATE | Submit application for an active job |
| `GET` | `/api/applications/my` | CANDIDATE | List own applications (paginated) |
| `GET` | `/api/applications/{id}` | CANDIDATE (own) / RECRUITER (own job) / ADMIN | View single application |
| `GET` | `/api/applications/job/{jobId}` | RECRUITER (own job) / ADMIN | List applications for a job (paginated) |
| `PATCH` | `/api/applications/{id}/status` | RECRUITER (own job) / ADMIN | Update status: REVIEWING / ACCEPTED / REJECTED |
| `PATCH` | `/api/applications/{id}/withdraw` | CANDIDATE (own) | Withdraw application |
| `GET` | `/api/applications/admin/all` | ADMIN | List all applications (paginated) |
| `DELETE` | `/api/applications/{id}` | ADMIN | Soft delete application |

---

## Execution order

```
Step 1-2   Bootstrap: project + pom.xml + application.yaml     ~30 min
Step 3     Enums: ApplicationStatus + ErrorCode                 ~15 min
Step 4-5   Entity + DTOs                                        ~30 min
Step 6-7   Repository + Mapper                                  ~20 min
Step 8     JobClient (HTTP integration)                         ~30 min
Step 9-10  NotificationPublisher + RabbitMQConfig               ~20 min
Step 11    Security: InternalAuthFilter + SecurityConfig        ~20 min
Step 12    ApplicationService (core logic)                      ~90 min  ← most complex
Step 13    ApplicationController                                ~40 min
Step 14-15 Gateway route + infra files                          ~15 min

Total                                                           ~5.5 hours
```

---

## Key design notes

1. **`recruiterId` denormalized at creation**: Stored in `Application` so that
   `findByRecruiterIdAndDeletedFalse` works without a join to job-service on every list query.
   The tradeoff is that if a job's owner changes (uncommon), the denormalized value becomes
   stale — acceptable for this domain.

2. **Two response types**: `ApplicationResponse` (no `recruiterNotes`) for candidates;
   `ApplicationDetailResponse` (includes `recruiterNotes`) for recruiters/admins. The service
   layer decides which DTO to return based on the caller's role.

3. **`rejectionReason` required on REJECTED**: Enforced in the service layer, not at the DTO
   validation level, because the constraint is conditional on the new status value.

4. **Job validation is synchronous**: `JobClient` makes a blocking HTTP call to job-service
   before creating an application. If job-service is down, the application will fail with
   `JOB_SERVICE_UNAVAILABLE`. This is acceptable — we should not allow applications against
   an unverifiable job state.

5. **No direct DB access to job data**: Application-service never queries job-service's
   MongoDB directly. All cross-service reads go through the job-service HTTP API.

6. **RabbitMQ publish is fire-and-forget**: If the message fails to publish after the
   application status is saved, the status change is still committed. The notification may
   be lost. For higher reliability, a transactional outbox pattern can be added later.
