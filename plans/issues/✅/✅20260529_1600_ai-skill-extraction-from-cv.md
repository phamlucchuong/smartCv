✅

# [feat] AI Skill Extraction from Candidate CV

## Overview

When a candidate uploads a CV, the system should automatically use AI to extract all skills
mentioned (explicitly or implied) from the CV text and merge them into the candidate's
`skills` list in their profile. The upload endpoint returns immediately; extraction runs
asynchronously via RabbitMQ so the candidate is never blocked waiting for Ollama.

Existing skills manually entered by the candidate are preserved — only new skills are appended
(case-insensitive deduplication).

---

## Reproduction steps

1. Candidate calls `POST /user/api/candidates/cv/upload` with a PDF CV file.
2. Observe: the endpoint returns `{url: "..."}` but `skills` on the candidate profile is
   unchanged — no AI extraction is triggered.
3. Candidate must manually type their skills into `PUT /user/api/candidates/{id}`.

---

## Expected behavior

1. `POST /user/api/candidates/cv/upload` completes as before, returning `{url}` immediately.
2. In the background, `ai_engine_service` receives a RabbitMQ message, extracts CV text via
   `CvTextExtractor`, calls the Ollama AI with a new `extract_skills.md` prompt, and receives a
   `SkillExtractionResponse{skills: ["Java", "Spring Boot", "Docker", ...]}`.
3. `ai_engine_service` calls `user-service` internal endpoint
   `PATCH /user/api/internal/candidates/by-user/{userId}/skills` with the extracted skills.
4. `user-service` merges extracted skills with existing ones (case-insensitive dedup, existing
   entries preserved as-is) and saves.
5. Next time the candidate calls `GET /user/api/candidates/me`, `skills` reflects the merged list.

---

## Current behavior

`POST /user/api/candidates/cv/upload` (in `CandidateController.uploadCv`) only:
1. Calls `S3Service.uploadCv()` → returns S3 URL.
2. Calls `CandidateService.saveCvUrl(userId, url)` → persists `cvUrl` on the candidate document.
3. Returns `CvUploadResponse{url}`.

No skill extraction is triggered. No RabbitMQ message is published. No AI call is made.

---

## Impact scope

- [ ] api-gateway
- [x] user-service
- [ ] job_service
- [ ] application_service
- [x] ai_engine_service
- [ ] notification-service
- [ ] Infrastructure (Docker / RabbitMQ / MongoDB / Elasticsearch)

---

## Implementation specification

### Phase 1 — user-service

#### 1. RabbitMQ — add `candidate.skill.extract.queue` declaration

File: `user-service/src/main/java/vn/chuongpl/user_service/configuration/RabbitMQConfig.java`

Add alongside existing `notification.exchange` declarations:

```java
public static final String SKILL_EXCHANGE      = "candidate.skill.exchange";
public static final String SKILL_EXTRACT_QUEUE = "candidate.skill.extract.queue";
public static final String SKILL_ROUTING_KEY   = "candidate.skill.extract";

@Bean public DirectExchange skillExchange()  { return new DirectExchange(SKILL_EXCHANGE); }
@Bean public Queue skillExtractQueue()        { return new Queue(SKILL_EXTRACT_QUEUE, true); }
@Bean public Binding skillBinding() {
    return BindingBuilder.bind(skillExtractQueue()).to(skillExchange()).with(SKILL_ROUTING_KEY);
}
```

#### 2. `CvSkillExtractMessage` record (new)

File: `user-service/src/main/java/vn/chuongpl/user_service/integration/ai/CvSkillExtractMessage.java`

```java
package vn.chuongpl.user_service.integration.ai;
public record CvSkillExtractMessage(String userId, String cvUrl) {}
```

#### 3. `SkillExtractPublisher` (new)

File: `user-service/src/main/java/vn/chuongpl/user_service/integration/ai/SkillExtractPublisher.java`

```java
@Component @RequiredArgsConstructor @Slf4j
public class SkillExtractPublisher {
    private final AmqpTemplate amqpTemplate;

    public void publish(String userId, String cvUrl) {
        try {
            amqpTemplate.convertAndSend(
                RabbitMQConfig.SKILL_EXCHANGE,
                RabbitMQConfig.SKILL_ROUTING_KEY,
                new CvSkillExtractMessage(userId, cvUrl)
            );
        } catch (Exception e) {
            log.warn("Failed to publish skill-extract event for userId={}: {}", userId, e.getMessage());
        }
    }
}
```

Publish must NOT throw — a failure to publish must not break the CV upload response.

#### 4. `CandidateController.uploadCv()` — publish after upload

File: `user-service/src/main/java/vn/chuongpl/user_service/features/candidate/CandidateController.java`

After `candidateService.saveCvUrl(userId, url)`:
```java
skillExtractPublisher.publish(userId, url);
```

Inject `SkillExtractPublisher` into the controller.

#### 5. `SkillMergeRequest` DTO (new)

File: `user-service/src/main/java/vn/chuongpl/user_service/dtos/request/SkillMergeRequest.java`

```java
@Data @NoArgsConstructor @AllArgsConstructor
public class SkillMergeRequest {
    List<String> skills;
}
```

#### 6. `CandidateService.mergeSkills()` (new method)

File: `user-service/src/main/java/vn/chuongpl/user_service/features/candidate/CandidateService.java`

```java
public void mergeSkills(String userId, List<String> newSkills) {
    Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId)
        .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));

    List<String> existing = candidate.getSkills() != null ? candidate.getSkills() : new ArrayList<>();
    Set<String> existingLower = existing.stream()
        .map(String::toLowerCase).collect(Collectors.toSet());

    List<String> toAdd = newSkills.stream()
        .filter(s -> s != null && !s.isBlank())
        .filter(s -> !existingLower.contains(s.toLowerCase()))
        .collect(Collectors.toList());

    existing.addAll(toAdd);
    candidate.setSkills(existing);
    candidate.setUpdatedAt(LocalDateTime.now());
    candidateRepository.save(candidate);
}
```

Merge rules:
- Case-insensitive comparison: `"Java"` == `"java"` → not duplicated.
- Preserve original case of existing entries.
- New entries added as-is (using the case returned by AI).
- Blank/null entries from AI response are silently skipped.

#### 7. `InternalCandidateController` (new)

File: `user-service/src/main/java/vn/chuongpl/user_service/features/candidate/InternalCandidateController.java`

```java
@RestController
@RequestMapping("/api/internal/candidates")
@RequiredArgsConstructor
public class InternalCandidateController {
    private final CandidateService candidateService;

    /** Called by ai_engine_service after skill extraction. */
    @PatchMapping("/by-user/{userId}/skills")
    public ApiResponse<Void> mergeSkills(@PathVariable String userId,
                                          @RequestBody SkillMergeRequest request) {
        candidateService.mergeSkills(userId, request.getSkills());
        return ApiResponse.<Void>builder().message("Skills merged").build();
    }
}
```

Guarded by `InternalAuthFilter` (X-Gateway-Secret). Already covered by
`SecurityConfig` rule: `.requestMatchers("/api/internal/**").permitAll()` ✅

---

### Phase 2 — ai_engine_service

#### 8. `extract_skills.md` prompt (new)

File: `ai_engine_service/src/main/resources/prompts/extract_skills.md`

```markdown
# Task: Extract Skills from CV

Parse the candidate's CV and return ALL skills, technologies, tools, and competencies the
candidate possesses — both explicitly listed and clearly implied by their work history or
project descriptions.

---

## Candidate CV

{{CV_TEXT}}

---

## Instructions

1. Identify every technical skill: programming languages, frameworks, databases, cloud platforms,
   DevOps tools, testing frameworks, protocols, etc.
2. Identify professional skills that appear as competencies: e.g. "Agile", "Scrum",
   "Technical Leadership", "System Design".
3. Normalize each skill to its canonical name:
   - "ReactJS" → "React", "Golang" → "Go", "Postgres" → "PostgreSQL".
4. Remove duplicates. Do NOT include vague terms like "programming", "development", or "coding".
5. Return as many skills as actually found (no minimum). Aim for at most 50; skip
   unrecognizable or noise terms. If fewer than 5 skills are found, return what is there
   rather than fabricating entries.

Return ONLY the JSON object below:
```json
{"skills": ["<skill1>", "<skill2>", ...]}
```
```

#### 9. `SkillExtractionResponse` record (new)

File: `ai_engine_service/src/main/java/vn/chuongpl/ai_engine_service/dtos/response/SkillExtractionResponse.java`

```java
package vn.chuongpl.ai_engine_service.dtos.response;
import java.util.List;
public record SkillExtractionResponse(List<String> skills) {}
```

#### 10. `PromptBuilder.buildExtractSkillsPrompt()` (new method)

File: `ai_engine_service/src/main/java/vn/chuongpl/ai_engine_service/features/analysis/PromptBuilder.java`

Add a method that loads `extract_skills.md` and substitutes `{{CV_TEXT}}`, following the same
pattern as `buildAnalyzePrompt()` and other existing builder methods.

#### 11. `AnalysisService.extractSkills()` (new method)

File: `ai_engine_service/src/main/java/vn/chuongpl/ai_engine_service/features/analysis/AnalysisService.java`

```java
public SkillExtractionResponse extractSkills(String cvUrl) {
    String cvText = cvTextExtractor.resolveCvText(null, cvUrl);
    String prompt = promptBuilder.buildExtractSkillsPrompt(Map.of("CV_TEXT", cvText));
    String aiContent = callAi(prompt);
    return parse(aiContent, SkillExtractionResponse.class);
}
```

Reuses existing `cvTextExtractor`, `promptBuilder`, `callAi()`, and `parse()` — no new patterns.

#### 12. `CvSkillExtractMessage` record (new)

File: `ai_engine_service/src/main/java/vn/chuongpl/ai_engine_service/integration/user/CvSkillExtractMessage.java`

```java
package vn.chuongpl.ai_engine_service.integration.user;
public record CvSkillExtractMessage(String userId, String cvUrl) {}
```

Must match the record published by user-service (same field names for Jackson deserialization).

#### 13. `UserClient` (new)

File: `ai_engine_service/src/main/java/vn/chuongpl/ai_engine_service/integration/user/UserClient.java`

```java
@Component @RequiredArgsConstructor @Slf4j
public class UserClient {
    private final RestTemplate restTemplate;

    @Value("${app.user-service.base-url}")
    private String baseUrl;

    @Value("${app.gateway.internal-secret}")
    private String gatewaySecret;

    public void mergeSkills(String userId, List<String> skills) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Gateway-Secret", gatewaySecret);
            headers.set("X-User-Id", "ai-engine");
            headers.set("X-User-Scope", "ROLE_ADMIN");

            restTemplate.exchange(
                baseUrl + "/api/internal/candidates/by-user/" + userId + "/skills",
                HttpMethod.PATCH,
                new HttpEntity<>(Map.of("skills", skills), headers),
                Void.class
            );
        } catch (Exception e) {
            log.error("Failed to merge skills for userId={}: {}", userId, e.getMessage());
        }
    }
}
```

Pattern mirrors `ApplicationClient.updateAiScore()` exactly. Failures are logged but do not
propagate (skill extraction failure must not crash the consumer).

#### 14. `SkillExtractionConsumer` (new)

File: `ai_engine_service/src/main/java/vn/chuongpl/ai_engine_service/features/analysis/SkillExtractionConsumer.java`

```java
@Component @RequiredArgsConstructor @Slf4j
public class SkillExtractionConsumer {
    private final AnalysisService analysisService;
    private final UserClient userClient;

    @RabbitListener(queues = RabbitMQConfig.SKILL_EXTRACT_QUEUE)
    public void handleSkillExtraction(CvSkillExtractMessage message) {
        log.info("Extracting skills for userId={}", message.userId());
        try {
            SkillExtractionResponse result = analysisService.extractSkills(message.cvUrl());
            userClient.mergeSkills(message.userId(), result.skills());
            log.info("Skills merged for userId={} count={}", message.userId(), result.skills().size());
        } catch (Exception e) {
            log.error("Skill extraction failed for userId={}: {}", message.userId(), e.getMessage());
        }
    }
}
```

Failures are swallowed — the message is not requeued (consistent with `CvScoringConsumer` pattern).
DLQ configuration (from plan.md Post-MVP G7) will handle unrecoverable failures.

#### 15. `RabbitMQConfig` — add consumer-side queue declaration

File: `ai_engine_service/src/main/java/vn/chuongpl/ai_engine_service/config/RabbitMQConfig.java`

Add alongside existing `CV_SCORING_*` constants and beans:

```java
public static final String SKILL_EXCHANGE    = "candidate.skill.exchange";
public static final String SKILL_EXTRACT_QUEUE = "candidate.skill.extract.queue";
public static final String SKILL_ROUTING_KEY  = "candidate.skill.extract";

@Bean DirectExchange skillExchange()    { return new DirectExchange(SKILL_EXCHANGE); }
@Bean Queue skillExtractQueue()         { return new Queue(SKILL_EXTRACT_QUEUE, true); }
@Bean Binding skillBinding() {
    return BindingBuilder.bind(skillExtractQueue()).to(skillExchange()).with(SKILL_ROUTING_KEY);
}
```

Both user-service and ai_engine_service must declare the same exchange + queue so RabbitMQ
idempotently creates them regardless of which service starts first.

#### 16. `application.yaml` — add user-service URL

File: `ai_engine_service/src/main/resources/application.yaml`

Under `app:` section:
```yaml
app:
  user-service:
    base-url: ${USER_SERVICE_URL:http://localhost:8081/user}
```

---

## Related code

| File | Role |
|------|------|
| `user-service/.../candidate/CandidateController.java` | Add `SkillExtractPublisher.publish()` call after S3 upload |
| `user-service/.../candidate/CandidateService.java` | Add `mergeSkills(userId, newSkills)` |
| `user-service/.../candidate/InternalCandidateController.java` | New — `PATCH /api/internal/candidates/by-user/{userId}/skills` |
| `user-service/.../configuration/RabbitMQConfig.java` | Add `candidate.skill.exchange` + queue |
| `user-service/.../integration/ai/SkillExtractPublisher.java` | New — publishes RabbitMQ event |
| `user-service/.../integration/ai/CvSkillExtractMessage.java` | New — message model |
| `user-service/.../dtos/request/SkillMergeRequest.java` | New — internal endpoint DTO |
| `ai_engine_service/.../analysis/SkillExtractionConsumer.java` | New — RabbitMQ consumer |
| `ai_engine_service/.../analysis/AnalysisService.java` | Add `extractSkills(cvUrl)` |
| `ai_engine_service/.../analysis/PromptBuilder.java` | Add `buildExtractSkillsPrompt()` |
| `ai_engine_service/.../dtos/response/SkillExtractionResponse.java` | New — AI response DTO |
| `ai_engine_service/.../integration/user/UserClient.java` | New — calls user-service internal endpoint |
| `ai_engine_service/.../integration/user/CvSkillExtractMessage.java` | New — message model (consumer side) |
| `ai_engine_service/.../config/RabbitMQConfig.java` | Add `candidate.skill.exchange` + queue |
| `ai_engine_service/.../resources/prompts/extract_skills.md` | New — AI prompt |
| `ai_engine_service/.../resources/application.yaml` | Add `app.user-service.base-url` |

---

## Notes

- `SecurityConfig` already permits `/api/internal/**` ✅ — no gateway config change needed.
- API Gateway routes already cover `/user/**` → user-service ✅ — no new route needed.
- The `SkillExtractPublisher.publish()` swallows exceptions so a RabbitMQ outage never breaks
  the CV upload response returned to the candidate.
- `SkillExtractionConsumer` swallows exceptions to match `CvScoringConsumer` pattern. DLQ
  configuration (plan.md G7) is out of scope for this issue.
- The `RestTemplate` bean is already declared in `AppConfig.java` in `ai_engine_service` ✅.
- `CvTextExtractor.resolveCvText(null, cvUrl)` handles both PDF and plain text ✅.
- There is no manually-triggered `POST /api/ai/extract-skills` endpoint; this is intentionally
  out of scope. All extraction is driven by the CV upload event.
