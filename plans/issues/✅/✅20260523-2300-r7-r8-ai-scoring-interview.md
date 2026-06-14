# R7 + R8 — Auto AI Scoring on Apply & Mock Interview Questions

## Scope

- **R7** — Tự động chấm điểm AI khi ứng viên submit application (async qua RabbitMQ)
- **R8** — Endpoint sinh câu hỏi phỏng vấn cho recruiter (`POST /api/ai/interview-questions`)

---

## Current Assessment

**application_service:**
- `Application` entity không có field AI (aiScore, matchedSkills, missingSkills, aiStatus)
- Sau `submit()` không publish sự kiện nào cho AI
- Không có endpoint nhận callback kết quả AI

**ai_engine_service:**
- Không có `spring-boot-starter-amqp` → không consume được queue
- Không có `ApplicationClient` để callback kết quả về application_service
- Không có endpoint interview questions

**Luồng hiện tại (thiếu):**
```
Candidate submit → Application PENDING → [không có gì xảy ra tiếp]
```

**Luồng mục tiêu sau R7:**
```
Candidate submit → Application PENDING + aiStatus=PENDING
    → publish cv.scoring.queue
    → ai_engine_service consume → analyze(cvUrl, jobId)
    → callback PATCH /api/applications/{id}/ai-score
    → Application aiStatus=SCORED, aiScore=85, matchedSkills=[...], missingSkills=[...]
```

---

## R7 — Auto AI Scoring on Apply

### R7.1 — Enum `AiScoringStatus.java`

**File:** `application_service/src/main/java/.../enums/AiScoringStatus.java`

```java
package vn.chuongpl.application_service.enums;

public enum AiScoringStatus {
    PENDING,   // published to queue, waiting for AI
    SCORED,    // AI returned score successfully
    FAILED     // AI call failed (timeout, parse error)
}
```

### R7.2 — Thêm fields AI vào `Application.java`

**File:** `application_service/src/main/java/.../features/application/Application.java`

Thêm sau field `cvUrl`:

```java
@Field(name = "ai_score")
Integer aiScore;

@Field(name = "matched_skills")
List<String> matchedSkills;

@Field(name = "missing_skills")
List<String> missingSkills;

@Builder.Default
@Field(name = "ai_status")
AiScoringStatus aiStatus = AiScoringStatus.PENDING;
```

Import: `import java.util.List;`

### R7.3 — `CvScoringMessage.java`

**File:** `application_service/src/main/java/.../integration/ai/CvScoringMessage.java`

```java
package vn.chuongpl.application_service.integration.ai;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CvScoringMessage {
    String applicationId;
    String cvUrl;
    String jobId;
}
```

### R7.4 — `AiScoringPublisher.java`

**File:** `application_service/src/main/java/.../integration/ai/AiScoringPublisher.java`

```java
package vn.chuongpl.application_service.integration.ai;

import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
import vn.chuongpl.application_service.config.RabbitMQConfig;
import vn.chuongpl.application_service.features.application.Application;

@Component
@RequiredArgsConstructor
public class AiScoringPublisher {

    final RabbitTemplate rabbitTemplate;

    public void publishScoringRequest(Application app) {
        if (app.getCvUrl() == null || app.getCvUrl().isBlank()) return;

        CvScoringMessage message = CvScoringMessage.builder()
                .applicationId(app.getId())
                .cvUrl(app.getCvUrl())
                .jobId(app.getJobId())
                .build();

        rabbitTemplate.convertAndSend(
                RabbitMQConfig.CV_SCORING_EXCHANGE,
                RabbitMQConfig.CV_SCORING_KEY,
                message
        );
    }
}
```

### R7.5 — Cập nhật `RabbitMQConfig.java` (application_service)

Thêm vào `RabbitMQConfig`:

```java
public static final String CV_SCORING_EXCHANGE = "cv.scoring.exchange";
public static final String CV_SCORING_KEY      = "cv.scoring";

@Bean DirectExchange cvScoringExchange() {
    return new DirectExchange(CV_SCORING_EXCHANGE);
}

@Bean Queue cvScoringQueue() {
    return new Queue("cv.scoring.queue", true);
}

@Bean Binding cvScoringBinding(DirectExchange cvScoringExchange) {
    return BindingBuilder.bind(cvScoringQueue()).to(cvScoringExchange).with(CV_SCORING_KEY);
}
```

### R7.6 — Cập nhật `ApplicationService.submit()`

Inject `AiScoringPublisher`, sau `applicationRepository.save(app)`:

```java
AiScoringPublisher aiScoringPublisher;   // thêm vào field

// trong submit(), sau save:
Application saved = applicationRepository.save(app);
aiScoringPublisher.publishScoringRequest(saved);
return applicationMapper.toResponse(saved);
```

### R7.7 — `AiScoreUpdateRequest.java`

**File:** `application_service/src/main/java/.../dtos/request/AiScoreUpdateRequest.java`

```java
package vn.chuongpl.application_service.dtos.request;

import lombok.*;
import vn.chuongpl.application_service.enums.AiScoringStatus;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiScoreUpdateRequest {
    int aiScore;
    List<String> matchedSkills;
    List<String> missingSkills;
    AiScoringStatus aiStatus;  // SCORED hoặc FAILED
}
```

### R7.8 — `ApplicationService.updateAiScore()`

Thêm method vào `ApplicationService`:

```java
public void updateAiScore(String id, AiScoreUpdateRequest request) {
    Application app = applicationRepository.findByIdAndDeletedFalse(id)
            .orElseThrow(() -> new AppException(ErrorCode.APPLICATION_NOT_FOUND));

    app.setAiScore(request.getAiScore());
    app.setMatchedSkills(request.getMatchedSkills());
    app.setMissingSkills(request.getMissingSkills());
    app.setAiStatus(request.getAiStatus() != null ? request.getAiStatus() : AiScoringStatus.SCORED);
    app.setUpdatedAt(LocalDateTime.now());
    applicationRepository.save(app);
}
```

### R7.9 — Endpoint `PATCH /{id}/ai-score` trong `ApplicationController`

```java
@PatchMapping("/{id}/ai-score")
@PreAuthorize("hasRole('ADMIN')")
public ApiResponse<Void> updateAiScore(@PathVariable String id,
                                       @RequestBody AiScoreUpdateRequest request) {
    applicationService.updateAiScore(id, request);
    return ApiResponse.<Void>builder().build();
}
```

> **Note:** `ADMIN` là role được ai_engine_service dùng khi gọi internal (qua header `X-User-Scope: ADMIN`).

### R7.10 — Cập nhật `ApplicationResponse` và `ApplicationDetailResponse`

Thêm vào cả hai DTO:

```java
Integer aiScore;
List<String> matchedSkills;
List<String> missingSkills;
AiScoringStatus aiStatus;
```

`ApplicationMapper` tự auto-map vì tên field trùng khớp — không cần sửa.

---

### R7.11 — `pom.xml` ai_engine_service — Thêm AMQP

**File:** `ai_engine_service/pom.xml`

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-amqp</artifactId>
</dependency>
```

### R7.12 — `application.yaml` ai_engine_service — Thêm RabbitMQ + app URL

```yaml
spring:
  rabbitmq:
    host: ${RABBITMQ_HOST:localhost}
    port: ${RABBITMQ_PORT:5672}
    username: ${RABBITMQ_USER:admin}
    password: ${RABBITMQ_PASSWORD:admin123}

app:
  application-service:
    base-url: ${APPLICATION_SERVICE_URL:http://localhost:8083/application}
```

### R7.13 — `RabbitMQConfig.java` (ai_engine_service)

**File:** `ai_engine_service/src/main/java/.../config/RabbitMQConfig.java`

Consumer-side chỉ cần declare exchange + queue (idempotent):

```java
package vn.chuongpl.ai_engine_service.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {
    public static final String CV_SCORING_EXCHANGE = "cv.scoring.exchange";
    public static final String CV_SCORING_KEY      = "cv.scoring";
    public static final String CV_SCORING_QUEUE    = "cv.scoring.queue";

    @Bean DirectExchange cvScoringExchange() {
        return new DirectExchange(CV_SCORING_EXCHANGE);
    }

    @Bean Queue cvScoringQueue() {
        return new Queue(CV_SCORING_QUEUE, true);
    }

    @Bean Binding cvScoringBinding() {
        return BindingBuilder.bind(cvScoringQueue()).to(cvScoringExchange()).with(CV_SCORING_KEY);
    }

    @Bean MessageConverter jackson2MessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
```

### R7.14 — `CvScoringMessage.java` (ai_engine_service)

**File:** `ai_engine_service/src/main/java/.../integration/application/CvScoringMessage.java`

```java
package vn.chuongpl.ai_engine_service.integration.application;

public record CvScoringMessage(
        String applicationId,
        String cvUrl,
        String jobId
) {}
```

### R7.15 — `AiScoreResult.java` (ai_engine_service)

**File:** `ai_engine_service/src/main/java/.../integration/application/AiScoreResult.java`

Matches `AiScoreUpdateRequest` in application_service:

```java
package vn.chuongpl.ai_engine_service.integration.application;

import java.util.List;

public record AiScoreResult(
        int aiScore,
        List<String> matchedSkills,
        List<String> missingSkills,
        String aiStatus   // "SCORED" hoặc "FAILED"
) {}
```

### R7.16 — `ApplicationClient.java` (ai_engine_service)

**File:** `ai_engine_service/src/main/java/.../integration/application/ApplicationClient.java`

```java
package vn.chuongpl.ai_engine_service.integration.application;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@RequiredArgsConstructor
@Slf4j
public class ApplicationClient {

    private final RestTemplate restTemplate;

    @Value("${app.application-service.base-url}")
    String baseUrl;

    @Value("${app.gateway.internal-secret}")
    String gatewaySecret;

    public void updateAiScore(String applicationId, AiScoreResult result) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Gateway-Secret", gatewaySecret);
            headers.set("X-User-Id",    "ai-engine");
            headers.set("X-User-Scope", "ADMIN");

            restTemplate.exchange(
                    baseUrl + "/api/applications/" + applicationId + "/ai-score",
                    HttpMethod.PATCH,
                    new HttpEntity<>(result, headers),
                    Void.class
            );
        } catch (Exception e) {
            log.error("Failed to callback ai-score for {}: {}", applicationId, e.getMessage());
        }
    }
}
```

### R7.17 — `CvScoringConsumer.java` (ai_engine_service)

**File:** `ai_engine_service/src/main/java/.../features/analysis/CvScoringConsumer.java`

```java
package vn.chuongpl.ai_engine_service.features.analysis;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import vn.chuongpl.ai_engine_service.config.RabbitMQConfig;
import vn.chuongpl.ai_engine_service.dtos.response.CvAnalysisResponse;
import vn.chuongpl.ai_engine_service.integration.application.AiScoreResult;
import vn.chuongpl.ai_engine_service.integration.application.ApplicationClient;
import vn.chuongpl.ai_engine_service.integration.application.CvScoringMessage;

@Component
@RequiredArgsConstructor
@Slf4j
public class CvScoringConsumer {

    private final AnalysisService analysisService;
    private final ApplicationClient applicationClient;

    @RabbitListener(queues = RabbitMQConfig.CV_SCORING_QUEUE)
    public void handleCvScoring(CvScoringMessage message) {
        log.info("Processing CV scoring for applicationId={}", message.applicationId());

        try {
            CvAnalysisResponse result = analysisService.autoScore(message.cvUrl(), message.jobId());

            applicationClient.updateAiScore(message.applicationId(), new AiScoreResult(
                    result.matchScore(),
                    result.matchedSkills(),
                    result.missingSkills(),
                    "SCORED"
            ));

            log.info("AI scoring complete for applicationId={} score={}", message.applicationId(), result.matchScore());

        } catch (Exception e) {
            log.error("AI scoring failed for applicationId={}: {}", message.applicationId(), e.getMessage());
            applicationClient.updateAiScore(message.applicationId(), new AiScoreResult(0, null, null, "FAILED"));
        }
    }
}
```

### R7.18 — `AnalysisService.autoScore()` (ai_engine_service)

Thêm method vào `AnalysisService.java`:

```java
public CvAnalysisResponse autoScore(String cvUrl, String jobId) {
    String cvText = cvTextExtractor.resolveCvText(null, cvUrl);
    JobSummary job = jobClient.getJobById(jobId);

    String prompt = promptBuilder.buildAnalyzePrompt(Map.of(
            "CV_TEXT", cvText,
            "JOB_TITLE", nvl(job.title()),
            "JOB_DESCRIPTION", nvl(job.description()),
            "JOB_SKILLS", String.join(", ", safeList(job.skills())),
            "JOB_REQUIREMENTS", String.join("\n- ", safeList(job.requirements())),
            "EXPERIENCE_LEVEL", nvl(job.experienceLevel())
    ));

    String aiContent = callAi(prompt);
    return parse(aiContent, CvAnalysisResponse.class);
}
```

---

### R7 — File Summary

| Service | File | Action |
|---------|------|--------|
| `application_service` | `enums/AiScoringStatus.java` | New |
| `application_service` | `features/application/Application.java` | Add 4 AI fields |
| `application_service` | `integration/ai/CvScoringMessage.java` | New |
| `application_service` | `integration/ai/AiScoringPublisher.java` | New |
| `application_service` | `config/RabbitMQConfig.java` | Add cv.scoring exchange/queue/binding |
| `application_service` | `features/application/ApplicationService.java` | Inject publisher, call in `submit()`, add `updateAiScore()` |
| `application_service` | `dtos/request/AiScoreUpdateRequest.java` | New |
| `application_service` | `features/application/ApplicationController.java` | Add `PATCH /{id}/ai-score` |
| `application_service` | `dtos/response/ApplicationResponse.java` | Add 4 AI fields |
| `application_service` | `dtos/response/ApplicationDetailResponse.java` | Add 4 AI fields |
| `ai_engine_service` | `pom.xml` | Add `spring-boot-starter-amqp` |
| `ai_engine_service` | `src/main/resources/application.yaml` | Add rabbitmq config + app.application-service.base-url |
| `ai_engine_service` | `config/RabbitMQConfig.java` | New — consumer-side declare |
| `ai_engine_service` | `integration/application/CvScoringMessage.java` | New |
| `ai_engine_service` | `integration/application/AiScoreResult.java` | New |
| `ai_engine_service` | `integration/application/ApplicationClient.java` | New |
| `ai_engine_service` | `features/analysis/CvScoringConsumer.java` | New |
| `ai_engine_service` | `features/analysis/AnalysisService.java` | Add `autoScore()` |

---

## R8 — Mock Interview Questions

### R8.1 — Prompt template `interview_questions.md`

**File:** `ai_engine_service/src/main/resources/prompts/interview_questions.md`

```markdown
You are a senior technical interviewer preparing for a candidate screening.

## Candidate CV
{{CV_TEXT}}

## Job Position
Title: {{JOB_TITLE}}
Description: {{JOB_DESCRIPTION}}
Required Skills: {{JOB_SKILLS}}
Requirements:
- {{JOB_REQUIREMENTS}}

## Task
Generate exactly 5 targeted interview questions for this specific candidate.
Focus on:
1. Verifying key claims in the CV that are critical for this role.
2. Probing the candidate's weakest areas relative to the job requirements.
3. Behavioral questions about past relevant experience.
4. Technical depth questions on the most important required skills.
5. One scenario-based problem related to the actual job context.

Questions should be specific to THIS candidate's CV, not generic.

## Output Format
Return ONLY valid JSON, no markdown fences, no explanatory text:
{
  "questions": [
    "Question 1 text here",
    "Question 2 text here",
    "Question 3 text here",
    "Question 4 text here",
    "Question 5 text here"
  ]
}
```

### R8.2 — `InterviewQuestionsRequest.java`

**File:** `ai_engine_service/src/main/java/.../dtos/request/InterviewQuestionsRequest.java`

```java
package vn.chuongpl.ai_engine_service.dtos.request;

public record InterviewQuestionsRequest(
        String cvText,  // optional — raw text
        String cvUrl,   // optional — PDF URL (dùng khi cvText null)
        String jobId    // required
) {}
```

Validation: ít nhất một trong `cvText`/`cvUrl` phải có giá trị — check trong service.

### R8.3 — `InterviewQuestionsResponse.java`

**File:** `ai_engine_service/src/main/java/.../dtos/response/InterviewQuestionsResponse.java`

```java
package vn.chuongpl.ai_engine_service.dtos.response;

import java.util.List;

public record InterviewQuestionsResponse(List<String> questions) {}
```

### R8.4 — `PromptBuilder.buildInterviewQuestionsPrompt()`

Thêm method vào `PromptBuilder.java`:

```java
public String buildInterviewQuestionsPrompt(Map<String, Object> vars) {
    return apply(load("prompts/interview_questions.md"), vars);
}
```

### R8.5 — `AnalysisService.generateInterviewQuestions()`

Thêm method vào `AnalysisService.java`:

```java
public InterviewQuestionsResponse generateInterviewQuestions(InterviewQuestionsRequest request) {
    if ((request.cvText() == null || request.cvText().isBlank())
            && (request.cvUrl() == null || request.cvUrl().isBlank())) {
        throw new AppException(ErrorCode.CV_TEXT_REQUIRED);
    }

    String cvText = cvTextExtractor.resolveCvText(request.cvText(), request.cvUrl());
    JobSummary job = jobClient.getJobById(request.jobId());

    String prompt = promptBuilder.buildInterviewQuestionsPrompt(Map.of(
            "CV_TEXT", cvText,
            "JOB_TITLE", nvl(job.title()),
            "JOB_DESCRIPTION", nvl(job.description()),
            "JOB_SKILLS", String.join(", ", safeList(job.skills())),
            "JOB_REQUIREMENTS", String.join("\n- ", safeList(job.requirements()))
    ));

    String aiContent = callAi(prompt);
    return parse(aiContent, InterviewQuestionsResponse.class);
}
```

### R8.6 — Endpoint trong `AnalysisController`

Thêm vào `AnalysisController.java`:

```java
@PostMapping("/interview-questions")
@PreAuthorize("hasAnyAuthority('ROLE_RECRUITER','ROLE_ADMIN')")
public ApiResponse<InterviewQuestionsResponse> interviewQuestions(
        @RequestBody InterviewQuestionsRequest request) {
    return ApiResponse.<InterviewQuestionsResponse>builder()
            .data(analysisService.generateInterviewQuestions(request))
            .message("Interview questions generated successfully")
            .build();
}
```

### R8 — File Summary

| Service | File | Action |
|---------|------|--------|
| `ai_engine_service` | `src/main/resources/prompts/interview_questions.md` | New |
| `ai_engine_service` | `dtos/request/InterviewQuestionsRequest.java` | New |
| `ai_engine_service` | `dtos/response/InterviewQuestionsResponse.java` | New |
| `ai_engine_service` | `features/analysis/PromptBuilder.java` | Add `buildInterviewQuestionsPrompt()` |
| `ai_engine_service` | `features/analysis/AnalysisService.java` | Add `generateInterviewQuestions()` |
| `ai_engine_service` | `features/analysis/AnalysisController.java` | Add `POST /api/ai/interview-questions` |

---

## Execution Order

```
R7.1–R7.10   application_service changes          ~2 hours
R7.11–R7.18  ai_engine_service amqp + consumer    ~3 hours
R8.1–R8.6    ai_engine_service interview endpoint  ~1 hour

Total                                              ~6 hours / 1 ngày
```

**Thứ tự khuyến nghị:** R7 application_service → R7 ai_engine_service → R8
(R8 độc lập, làm sau R7 để tiết kiệm context — chỉ cần thêm vào ai_engine_service)

---

## Notes

### Xử lý lỗi AI timeout
- `CvScoringConsumer` đã wrap try/catch: nếu AI fail → callback với `aiStatus=FAILED`
- Frontend poll `GET /api/applications/{id}` để check `aiStatus` — hiển thị loading nếu `PENDING`, lỗi nếu `FAILED`

### Idempotency
- `updateAiScore()` ghi đè bất kể trạng thái hiện tại — an toàn nếu queue retry

### gateway — thêm route PUBLIC cho ai-score callback
Endpoint `PATCH /api/applications/{id}/ai-score` chỉ dùng internal. Đảm bảo Security config trong application_service
cho phép request có `X-Gateway-Secret` header (đã có qua `InternalAuthFilter`).
