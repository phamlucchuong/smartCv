# AI Engine Service — Implementation Plan

## Scope

Build the AI Engine Service (port 8085) using **Spring AI 1.1.5 + Ollama (Llama 3)**. This
service exposes four AI-powered APIs for candidates: CV scoring against a job description,
skill-gap analysis, CV improvement suggestions, and job recommendations. All heavy lifting
delegates to Llama 3 running locally via Ollama; the service itself is stateless (no DB).

---

## Current assessment

The service skeleton already exists:

- `pom.xml` — Spring Boot 3.5.14, Spring AI 1.1.5 BOM, `spring-ai-starter-model-ollama`,
  `spring-ai-pdf-document-reader`, `spring-ai-markdown-document-reader`, Lombok.
- `application.yaml` — minimal (name only).
- `AiEngineServiceApplication.java` — bare `@SpringBootApplication`.

Missing: Security, DTOs, prompt templates, feature classes, API gateway route,
`application.yaml` full config, integration clients.

**Upstream contracts already stable:**
- `job-service` (`GET /api/jobs/{id}`) returns `JobResponse` with `title`, `description`,
  `skills`, `requirements`, `experienceLevel`.
- `job-service` (`GET /api/jobs/active`) returns paginated active jobs for recommendation ranking.
- `user-service` candidate profile has `skills`, `bio`, `experience` from `CandidateResponse`.

**Spring AI key APIs used:**
- `ChatClient` (fluent builder) with `.call().content()` for raw text.
- `BeanOutputConverter<T>` for structured JSON output → Java record.
- `PromptTemplate` loaded from classpath `prompts/*.md` files.
- `PagePdfDocumentReader` to extract text from a candidate's CV PDF URL/bytes.

---

## Domain design

### Stateless — no MongoDB

Every request is self-contained. The service calls job-service / user-service via HTTP to
gather context, builds a prompt, sends it to Ollama, and returns a structured response.
No data is persisted.

### Features

| Feature | Endpoint | Caller |
|---------|----------|--------|
| Score CV vs JD | `POST /api/ai/analyze` | CANDIDATE / ADMIN |
| Skill gap | included in `analyze` response | — |
| CV improvement tips | `POST /api/ai/improve` | CANDIDATE / ADMIN |
| Job recommendations | `POST /api/ai/recommend` | CANDIDATE / ADMIN |

### Authorization matrix

| Action | CANDIDATE | RECRUITER | ADMIN |
|--------|-----------|-----------|-------|
| `POST /analyze` | ✅ | ❌ | ✅ |
| `POST /improve` | ✅ | ❌ | ✅ |
| `POST /recommend` | ✅ | ❌ | ✅ |

Recruiter has no access — AI features are candidate-facing only.

---

## Response DTOs

### `CvAnalysisResponse`

```java
public record CvAnalysisResponse(
    int matchScore,                     // 0–100
    String scoreLabel,                  // "Excellent" / "Good" / "Fair" / "Poor"
    List<String> matchedSkills,         // skills present in both CV and JD
    List<String> missingSkills,         // skills in JD but absent from CV
    List<String> extraSkills,           // skills in CV not required by JD (value-adds)
    String summary                      // 2–3 sentence human-readable assessment
) {}
```

### `CvImprovementResponse`

```java
public record CvImprovementResponse(
    List<String> strengths,             // what the candidate already does well
    List<String> weaknesses,            // gaps compared to JD
    List<ImprovementTip> tips           // ordered by impact
) {}

public record ImprovementTip(
    String area,                        // "Skills", "Experience", "Keywords", "Format"
    String suggestion,                  // specific actionable advice
    String priority                     // "High" / "Medium" / "Low"
) {}
```

### `JobRecommendationResponse`

```java
public record JobRecommendationResponse(
    List<JobMatch> recommendations
) {}

public record JobMatch(
    String jobId,
    String title,
    String company,
    int matchScore,                     // 0–100
    String matchReason,                 // 1–2 sentence explanation
    List<String> alignedSkills          // skills that match
) {}
```

---

## Package structure

```
ai_engine_service/src/main/java/vn/chuongpl/ai_engine_service/
├── AiEngineServiceApplication.java
├── config/
│   ├── AiConfig.java                  (ChatClient bean, RateLimiter)
│   ├── AppConfig.java                 (RestTemplate bean)
│   ├── OpenApiConfig.java
│   └── SecurityConfig.java
├── dtos/
│   ├── ApiResponse.java
│   ├── request/
│   │   ├── CvAnalyzeRequest.java      (cvText or cvUrl, jobId)
│   │   ├── CvImproveRequest.java      (cvText or cvUrl, jobId)
│   │   └── JobRecommendRequest.java   (cvText or cvUrl, topK)
│   └── response/
│       ├── CvAnalysisResponse.java
│       ├── CvImprovementResponse.java
│       └── JobRecommendationResponse.java
├── enums/
│   └── ErrorCode.java
├── exception/
│   ├── AppException.java
│   └── GlobalExceptionHandler.java
├── features/
│   └── analysis/
│       ├── AnalysisController.java
│       ├── AnalysisService.java
│       └── PromptBuilder.java         (loads .md templates + variable substitution)
├── integration/
│   ├── job/
│   │   ├── JobClient.java
│   │   └── JobSummary.java            (minimal DTO: id, title, company, skills, requirements, description, experienceLevel)
│   └── cv/
│       └── CvTextExtractor.java       (PDF URL → plain text via PagePdfDocumentReader)
└── security/
    └── InternalAuthFilter.java
```

**Prompt template files (loaded from classpath):**

```
ai_engine_service/src/main/resources/prompts/
├── skill.md                           (system persona — loaded for every request)
├── analyze_cv.md                      (template for CV scoring + skill gap)
├── improve_cv.md                      (template for improvement tips)
└── recommend_jobs.md                  (template for job recommendations)
```

---

## Step-by-step implementation

### Step 1 — Update `pom.xml`

Add missing dependencies to the existing skeleton:

```xml
<!-- Security (header-based internal auth only — no JWT stack) -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>

<!-- MapStruct (optional, not strictly needed for records) -->
<!-- dotenv -->
<dependency>
    <groupId>io.github.cdimascio</groupId>
    <artifactId>java-dotenv</artifactId>
    <version>5.2.2</version>
</dependency>

<!-- API Docs -->
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.7.0</version>
</dependency>
```

Add MapStruct processor to `maven-compiler-plugin` `annotationProcessorPaths` if MapStruct is added.

---

### Step 2 — `application.yaml`

```yaml
server:
  port: ${AI_SERVICE_PORT:8085}
  servlet:
    context-path: /ai

spring:
  config:
    import: optional:file:../.env[.properties]
  application:
    name: AiEngineService
  ai:
    ollama:
      base-url: ${OLLAMA_BASE_URL:http://localhost:11434}
      chat:
        model: ${OLLAMA_MODEL:llama3.2}
        options:
          temperature: 0.2          # low temperature for consistent structured output
          num-ctx: 8192             # context window — enough for CV + JD
          top-p: 0.9
  main:
    banner-mode: "off"

app:
  gateway:
    internal-secret: ${GATEWAY_INTERNAL_SECRET:changeme}
  job-service:
    base-url: ${JOB_SERVICE_URL:http://localhost:8082/job}
  ai:
    recommend-batch-size: ${AI_RECOMMEND_BATCH:20}   # max jobs fetched for recommendation ranking

logging:
  level:
    root: WARN
    "vn.chuongpl.ai_engine_service": INFO
    "org.springframework.ai": INFO
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

### Step 3 — `ErrorCode` enum

```java
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error"),
    UNAUTHENTICATED(1005, "Unauthenticated"),
    UNAUTHORIZED(1006, "You do not have permission"),
    CV_TEXT_REQUIRED(8001, "CV text or URL is required"),
    CV_EXTRACTION_FAILED(8002, "Failed to extract text from CV PDF"),
    JOB_NOT_FOUND(8003, "Job not found"),
    JOB_SERVICE_UNAVAILABLE(8004, "Job service is currently unavailable"),
    AI_PROCESSING_FAILED(8005, "AI processing failed, please try again"),
    AI_OUTPUT_PARSE_FAILED(8006, "AI returned malformed output");
}
```

---

### Step 4 — Request DTOs

**`CvAnalyzeRequest.java`:**
```java
public class CvAnalyzeRequest {
    String cvText;      // plain text (mutually exclusive with cvUrl)
    String cvUrl;       // PDF URL (will be extracted server-side)
    @NotBlank
    String jobId;
}
```

**`CvImproveRequest.java`:** Same fields as `CvAnalyzeRequest`.

**`JobRecommendRequest.java`:**
```java
public class JobRecommendRequest {
    String cvText;
    String cvUrl;
    @Min(1) @Max(10)
    int topK = 5;       // number of top job recommendations
}
```

---

### Step 5 — `CvTextExtractor`

Handles both plain-text CV and PDF URL inputs.

```java
@Component
@RequiredArgsConstructor
public class CvTextExtractor {

    public String extract(String cvText, String cvUrl) {
        if (cvText != null && !cvText.isBlank()) return cvText;
        if (cvUrl != null && !cvUrl.isBlank()) return extractFromPdf(cvUrl);
        throw new AppException(ErrorCode.CV_TEXT_REQUIRED);
    }

    private String extractFromPdf(String url) {
        try {
            Resource resource = new UrlResource(url);
            PagePdfDocumentReader reader = new PagePdfDocumentReader(resource,
                PdfDocumentReaderConfig.builder()
                    .withPageTopMargin(0).withPageBottomMargin(0).build());
            return reader.get().stream()
                .map(doc -> doc.getContent())
                .collect(Collectors.joining("\n"));
        } catch (Exception e) {
            throw new AppException(ErrorCode.CV_EXTRACTION_FAILED);
        }
    }
}
```

---

### Step 6 — `JobClient`

Fetches job details and active job list from job-service.

```java
@Component
@RequiredArgsConstructor
public class JobClient {

    final RestTemplate restTemplate;

    @Value("${app.job-service.base-url}")
    String baseUrl;

    @Value("${app.ai.recommend-batch-size:20}")
    int batchSize;

    public JobSummary getJob(String jobId) {
        try {
            ResponseEntity<ApiResponse<JobSummary>> resp = restTemplate.exchange(
                baseUrl + "/api/jobs/" + jobId, HttpMethod.GET, null,
                new ParameterizedTypeReference<>() {});
            JobSummary job = Objects.requireNonNull(resp.getBody()).getData();
            if (job == null) throw new AppException(ErrorCode.JOB_NOT_FOUND);
            return job;
        } catch (AppException e) { throw e; }
        catch (Exception e)      { throw new AppException(ErrorCode.JOB_SERVICE_UNAVAILABLE); }
    }

    public List<JobSummary> getActiveJobs() {
        try {
            ResponseEntity<ApiResponse<PageResponse<JobSummary>>> resp = restTemplate.exchange(
                baseUrl + "/api/jobs/active?page=1&size=" + batchSize,
                HttpMethod.GET, null, new ParameterizedTypeReference<>() {});
            return Objects.requireNonNull(resp.getBody()).getData().getItems();
        } catch (Exception e) { throw new AppException(ErrorCode.JOB_SERVICE_UNAVAILABLE); }
    }
}
```

**`JobSummary.java`** (minimal DTO):
```java
public record JobSummary(
    String id,
    String title,
    String company,
    String description,
    List<String> skills,
    List<String> requirements,
    String experienceLevel
) {}
```

---

### Step 7 — `AiConfig`

```java
@Configuration
public class AiConfig {

    @Bean
    public ChatClient chatClient(ChatClient.Builder builder) {
        return builder.build();
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
```

---

### Step 8 — `PromptBuilder`

Loads `.md` template files, substitutes variables, and returns a formatted prompt string.

```java
@Component
public class PromptBuilder {

    @Value("classpath:prompts/skill.md")
    Resource systemPrompt;

    @Value("classpath:prompts/analyze_cv.md")
    Resource analyzeTemplate;

    @Value("classpath:prompts/improve_cv.md")
    Resource improveTemplate;

    @Value("classpath:prompts/recommend_jobs.md")
    Resource recommendTemplate;

    public String systemPrompt() {
        return loadResource(systemPrompt);
    }

    public String buildAnalyzePrompt(String cvText, JobSummary job) {
        return loadResource(analyzeTemplate)
            .replace("{{CV_TEXT}}", cvText)
            .replace("{{JOB_TITLE}}", job.title())
            .replace("{{JOB_DESCRIPTION}}", job.description())
            .replace("{{JOB_SKILLS}}", String.join(", ", job.skills()))
            .replace("{{JOB_REQUIREMENTS}}", String.join("\n- ", job.requirements()))
            .replace("{{EXPERIENCE_LEVEL}}", job.experienceLevel());
    }

    public String buildImprovePrompt(String cvText, JobSummary job) {
        return loadResource(improveTemplate)
            .replace("{{CV_TEXT}}", cvText)
            .replace("{{JOB_TITLE}}", job.title())
            .replace("{{JOB_DESCRIPTION}}", job.description())
            .replace("{{JOB_SKILLS}}", String.join(", ", job.skills()))
            .replace("{{JOB_REQUIREMENTS}}", String.join("\n- ", job.requirements()));
    }

    public String buildRecommendPrompt(String cvText, List<JobSummary> jobs) {
        String jobsJson = jobs.stream()
            .map(j -> String.format(
                "{\"id\":\"%s\",\"title\":\"%s\",\"company\":\"%s\",\"skills\":%s,\"requirements\":%s}",
                j.id(), j.title(), j.company(),
                toJsonArray(j.skills()), toJsonArray(j.requirements())))
            .collect(Collectors.joining(",\n", "[", "]"));

        return loadResource(recommendTemplate)
            .replace("{{CV_TEXT}}", cvText)
            .replace("{{JOBS_JSON}}", jobsJson);
    }

    private String loadResource(Resource r) {
        try { return r.getContentAsString(StandardCharsets.UTF_8); }
        catch (IOException e) { throw new RuntimeException("Failed to load prompt: " + r.getFilename()); }
    }

    private String toJsonArray(List<String> items) {
        if (items == null || items.isEmpty()) return "[]";
        return items.stream()
            .map(s -> "\"" + s.replace("\"", "\\\"") + "\"")
            .collect(Collectors.joining(",", "[", "]"));
    }
}
```

---

### Step 9 — `AnalysisService` (core logic)

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class AnalysisService {

    final ChatClient chatClient;
    final PromptBuilder promptBuilder;
    final CvTextExtractor cvExtractor;
    final JobClient jobClient;

    public CvAnalysisResponse analyze(CvAnalyzeRequest req) {
        String cvText = cvExtractor.extract(req.getCvText(), req.getCvUrl());
        JobSummary job = jobClient.getJob(req.getJobId());

        String userPrompt   = promptBuilder.buildAnalyzePrompt(cvText, job);
        String systemPrompt = promptBuilder.systemPrompt();

        BeanOutputConverter<CvAnalysisResponse> converter =
            new BeanOutputConverter<>(CvAnalysisResponse.class);

        String raw = chatClient.prompt()
            .system(systemPrompt)
            .user(userPrompt + "\n\nOutput format:\n" + converter.getFormat())
            .call()
            .content();

        return parseOrThrow(raw, converter, CvAnalysisResponse.class);
    }

    public CvImprovementResponse improve(CvImproveRequest req) {
        String cvText = cvExtractor.extract(req.getCvText(), req.getCvUrl());
        JobSummary job = jobClient.getJob(req.getJobId());

        BeanOutputConverter<CvImprovementResponse> converter =
            new BeanOutputConverter<>(CvImprovementResponse.class);

        String raw = chatClient.prompt()
            .system(promptBuilder.systemPrompt())
            .user(promptBuilder.buildImprovePrompt(cvText, job)
                  + "\n\nOutput format:\n" + converter.getFormat())
            .call()
            .content();

        return parseOrThrow(raw, converter, CvImprovementResponse.class);
    }

    public JobRecommendationResponse recommend(JobRecommendRequest req) {
        String cvText  = cvExtractor.extract(req.getCvText(), req.getCvUrl());
        List<JobSummary> activeJobs = jobClient.getActiveJobs();

        if (activeJobs.isEmpty()) {
            return new JobRecommendationResponse(List.of());
        }

        BeanOutputConverter<JobRecommendationResponse> converter =
            new BeanOutputConverter<>(JobRecommendationResponse.class);

        String raw = chatClient.prompt()
            .system(promptBuilder.systemPrompt())
            .user(promptBuilder.buildRecommendPrompt(cvText, activeJobs)
                  + "\n\nReturn top " + req.getTopK() + " matches only."
                  + "\n\nOutput format:\n" + converter.getFormat())
            .call()
            .content();

        return parseOrThrow(raw, converter, JobRecommendationResponse.class);
    }

    private <T> T parseOrThrow(String raw, BeanOutputConverter<T> converter, Class<T> type) {
        try {
            return converter.convert(raw);
        } catch (Exception e) {
            log.error("AI output parse failed for {}: {}", type.getSimpleName(), raw);
            throw new AppException(ErrorCode.AI_OUTPUT_PARSE_FAILED);
        }
    }
}
```

---

### Step 10 — `AnalysisController`

```java
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AnalysisController {

    AnalysisService analysisService;

    @PostMapping("/analyze")
    @PreAuthorize("hasRole('CANDIDATE') or hasRole('ADMIN')")
    public ApiResponse<CvAnalysisResponse> analyze(
            @Valid @RequestBody CvAnalyzeRequest request) {
        return ApiResponse.<CvAnalysisResponse>builder()
            .message("CV analysis completed")
            .data(analysisService.analyze(request))
            .build();
    }

    @PostMapping("/improve")
    @PreAuthorize("hasRole('CANDIDATE') or hasRole('ADMIN')")
    public ApiResponse<CvImprovementResponse> improve(
            @Valid @RequestBody CvImproveRequest request) {
        return ApiResponse.<CvImprovementResponse>builder()
            .message("CV improvement suggestions generated")
            .data(analysisService.improve(request))
            .build();
    }

    @PostMapping("/recommend")
    @PreAuthorize("hasRole('CANDIDATE') or hasRole('ADMIN')")
    public ApiResponse<JobRecommendationResponse> recommend(
            @Valid @RequestBody JobRecommendRequest request) {
        return ApiResponse.<JobRecommendationResponse>builder()
            .message("Job recommendations generated")
            .data(analysisService.recommend(request))
            .build();
    }
}
```

---

### Step 11 — Security: `InternalAuthFilter` + `SecurityConfig`

Identical pattern to user-service and job-service — copy `InternalAuthFilter.java` from
`user-service/src/.../configuration/InternalAuthFilter.java`. Change the package to
`vn.chuongpl.ai_engine_service.security`.

**`SecurityConfig.java`:**
```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    final InternalAuthFilter internalAuthFilter;

    private static final String[] SWAGGER = {
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
                .requestMatchers(SWAGGER).permitAll()
                .anyRequest().authenticated()
            );
        return http.build();
    }
}
```

---

### Step 12 — API Gateway: add route

In `api-gateway/src/main/resources/application.yaml`, add:

```yaml
- id: ai-engine-service
  uri: ${AI_SERVICE_URI:http://localhost:8085}
  predicates:
    - Path=/ai/**
```

No public routes — all AI endpoints require authentication.

---

### Step 13 — Infrastructure files

**`.env.example`** — add:
```
AI_SERVICE_PORT=8085
AI_SERVICE_URI=http://localhost:8085
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

**`Makefile`** — add:
```makefile
run-ai:
	cd ai_engine_service && ./mvnw spring-boot:run
```

**`CLAUDE.md` Service Map** — update `application_service` and add `ai_engine_service`:
```
| `ai_engine_service` | Java/Spring Boot 3.5.14 | 8085 | None (stateless) | CV scoring, skill gap, improvement tips, job recommendations |
```

**Ollama setup** (developer prerequisite):
```bash
# Install ollama and pull Llama 3.2
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama3.2
ollama serve   # starts at localhost:11434
```

---

## Prompt template files

### `skill.md` — system persona (loaded for every request)

See `skill.md` file created alongside this plan. It defines:
- AI persona as an expert HR consultant and technical recruiter
- Strict JSON-only output rule
- Language and tone guidelines
- Edge-case handling (empty CV, vague JD)

### `analyze_cv.md` — CV scoring + skill gap template

Variables: `{{CV_TEXT}}`, `{{JOB_TITLE}}`, `{{JOB_DESCRIPTION}}`, `{{JOB_SKILLS}}`,
`{{JOB_REQUIREMENTS}}`, `{{EXPERIENCE_LEVEL}}`

### `improve_cv.md` — improvement tips template

Variables: `{{CV_TEXT}}`, `{{JOB_TITLE}}`, `{{JOB_DESCRIPTION}}`, `{{JOB_SKILLS}}`,
`{{JOB_REQUIREMENTS}}`

### `recommend_jobs.md` — job recommendation ranking template

Variables: `{{CV_TEXT}}`, `{{JOBS_JSON}}`

---

## Complete API reference

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `POST` | `/api/ai/analyze` | CANDIDATE / ADMIN | Score CV vs job, skill gap |
| `POST` | `/api/ai/improve` | CANDIDATE / ADMIN | CV improvement suggestions |
| `POST` | `/api/ai/recommend` | CANDIDATE / ADMIN | Top-K job recommendations |

---

## Execution order

```
Step 1     Update pom.xml (Security, dotenv, springdoc)           ~10 min
Step 2     application.yaml full config                           ~10 min
Step 3     ErrorCode enum                                         ~5 min
Step 4     Request DTOs (3 classes)                               ~10 min
Step 5     CvTextExtractor (PDF + plain text)                     ~20 min
Step 6     JobClient + JobSummary (HTTP integration)              ~20 min
Step 7     AiConfig (ChatClient bean)                             ~5 min
Step 8     PromptBuilder (template loader)                        ~20 min
Step 9     AnalysisService (core AI logic)                        ~40 min   ← most complex
Step 10    AnalysisController                                      ~15 min
Step 11    InternalAuthFilter + SecurityConfig                    ~15 min
Step 12    Gateway route                                           ~5 min
Step 13    Infra files (.env, Makefile, CLAUDE.md)                ~10 min
Prompts    skill.md + 3 template files                            ~30 min

Total                                                             ~3.5 hours
```

---

## Key design notes

1. **Temperature 0.2**: Low temperature forces deterministic, consistently-structured JSON
   output from Llama 3. Higher temperature causes hallucinated field names.

2. **`BeanOutputConverter` format string appended to prompt**: Spring AI's converter generates
   a JSON Schema description string that is appended to every user prompt. This is the most
   reliable way to get Llama 3 to return valid structured output.

3. **Batch size for recommendations**: Fetching all active jobs at once would overflow the
   context window. `AI_RECOMMEND_BATCH` caps at 20 jobs per recommendation call. For larger
   catalogs, a pre-filter step (Elasticsearch keyword match on CV skills) should be added
   before the AI ranking step.

4. **No streaming**: `ChatClient.call().content()` is synchronous. AI inference on Llama 3.2
   with 8K context takes 5–30 seconds on CPU. For production, consider async endpoints
   (`SseEmitter` or WebSocket) and a job queue (RabbitMQ) to avoid HTTP timeouts.

5. **Ollama is local-only**: The plan uses Ollama as the LLM backend to keep data
   on-premises (CVs contain PII). To swap in a cloud API (Groq, Together.ai, OpenAI),
   change `spring.ai.ollama` to the equivalent Spring AI starter — no service code changes
   needed.

6. **No caching**: Analysis results are not cached. If repeated calls for the same
   CV+job pair become expensive, add Redis cache keyed by `SHA-256(cvText + jobId)`.
