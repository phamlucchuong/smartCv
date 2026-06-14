✅

# Application Service — Assessment Domain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `companyLogoInitials` to `ApplicationResponse`; implement the full Assessment domain in `application_service` including recruiter-side creation/assignment and candidate-side attempt lifecycle.

**Architecture:** Two new MongoDB collections (`assessments`, `assessment_attempts`). All assessment logic in a new `AssessmentService`. No new external HTTP calls — the service is self-contained. Auto-grading of MCQ questions happens at submit time. `companyLogoInitials` is a computed field added via a MapStruct `@AfterMapping`.

**Tech Stack:** Spring Boot 3.4.4, MongoDB, MapStruct, Mockito

**Prerequisite:** None. This plan is independent of Plans 1 and 2.

---

## File Map

**Create:**
- `enums/AssessmentStatus.java`
- `enums/QuestionType.java`
- `enums/AttemptStatus.java`
- `enums/AttemptResult.java`
- `features/assessment/Question.java` — embedded in Assessment
- `features/assessment/Assessment.java` — MongoDB document
- `features/assessment/AttemptAnswer.java` — embedded in AssessmentAttempt
- `features/assessment/AssessmentAttempt.java` — MongoDB document
- `features/assessment/AssessmentRepository.java`
- `features/assessment/AssessmentAttemptRepository.java`
- `dtos/request/AssessmentCreateRequest.java`
- `dtos/request/AssessmentAnswerRequest.java`
- `dtos/response/AssessmentResponse.java`
- `dtos/response/AttemptStateResponse.java`
- `dtos/response/AssessmentResultResponse.java`
- `features/assessment/AssessmentService.java`
- `features/assessment/AssessmentController.java`
- `src/test/java/.../features/assessment/AssessmentServiceTest.java`

**Modify:**
- `enums/ErrorCode.java` — add 5 new codes
- `dtos/response/ApplicationResponse.java` — add `companyLogoInitials`
- `features/application/ApplicationMapper.java` — compute `companyLogoInitials` via @AfterMapping

All paths relative to `application_service/src/main/java/vn/chuongpl/application_service/`.

---

## Task 1: ApplicationResponse — companyLogoInitials

**Files:**
- Modify: `dtos/response/ApplicationResponse.java`
- Modify: `features/application/ApplicationMapper.java`

- [ ] **Step 1: Add `companyLogoInitials` field to ApplicationResponse.java**

In `ApplicationResponse.java`, add this field after `companyName`:
```java
String companyLogoInitials;
```

- [ ] **Step 2: Add `@AfterMapping` to ApplicationMapper.java**

Replace the existing `ApplicationMapper.java` content with:
```java
package vn.chuongpl.application_service.features.application;

import org.mapstruct.*;
import vn.chuongpl.application_service.dtos.request.ApplicationStatusUpdateRequest;
import vn.chuongpl.application_service.dtos.response.ApplicationDetailResponse;
import vn.chuongpl.application_service.dtos.response.ApplicationResponse;

@Mapper(componentModel = "spring")
public interface ApplicationMapper {
    ApplicationResponse toResponse(Application application);

    ApplicationDetailResponse toDetailResponse(Application application);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateStatus(@MappingTarget Application application, ApplicationStatusUpdateRequest request);

    @AfterMapping
    default void computeLogoInitials(@MappingTarget ApplicationResponse response, Application app) {
        if (app.getCompanyName() != null && !app.getCompanyName().isBlank()) {
            String name = app.getCompanyName().trim();
            response.setCompanyLogoInitials(name.substring(0, Math.min(2, name.length())).toUpperCase());
        }
    }
}
```

- [ ] **Step 3: Compile check**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/application_service && ./mvnw compile -q && echo "OK"
```
Expected: `OK`

- [ ] **Step 4: Commit**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add application_service/src/main/java/vn/chuongpl/application_service/dtos/response/ApplicationResponse.java \
        application_service/src/main/java/vn/chuongpl/application_service/features/application/ApplicationMapper.java
git commit -m "feat(application-service): add companyLogoInitials computed field to ApplicationResponse"
```

---

## Task 2: New enums and ErrorCode

**Files:**
- Create: `enums/AssessmentStatus.java`
- Create: `enums/QuestionType.java`
- Create: `enums/AttemptStatus.java`
- Create: `enums/AttemptResult.java`
- Modify: `enums/ErrorCode.java`

- [ ] **Step 1: Create AssessmentStatus.java**

```java
package vn.chuongpl.application_service.enums;

public enum AssessmentStatus {
    DRAFT, ACTIVE
}
```

- [ ] **Step 2: Create QuestionType.java**

```java
package vn.chuongpl.application_service.enums;

public enum QuestionType {
    MCQ, TEXT
}
```

- [ ] **Step 3: Create AttemptStatus.java**

```java
package vn.chuongpl.application_service.enums;

public enum AttemptStatus {
    IN_PROGRESS, SUBMITTED, EXPIRED
}
```

- [ ] **Step 4: Create AttemptResult.java**

```java
package vn.chuongpl.application_service.enums;

public enum AttemptResult {
    PASS, FAIL, PENDING
}
```

- [ ] **Step 5: Add 5 error codes to ErrorCode.java**

Add these entries after `JOB_SERVICE_UNAVAILABLE(7007, ...)`:
```java
ASSESSMENT_NOT_FOUND(8001, "Assessment not found"),
ATTEMPT_NOT_FOUND(8002, "Attempt not found"),
ATTEMPT_ALREADY_IN_PROGRESS(8003, "An attempt is already in progress for this assessment"),
ATTEMPT_ALREADY_SUBMITTED(8004, "This attempt has already been submitted"),
ATTEMPT_NOT_SUBMITTED(8005, "Attempt has not been submitted yet");
```

- [ ] **Step 6: Compile check**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/application_service && ./mvnw compile -q && echo "OK"
```
Expected: `OK`

- [ ] **Step 7: Commit**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add application_service/src/main/java/vn/chuongpl/application_service/enums/AssessmentStatus.java \
        application_service/src/main/java/vn/chuongpl/application_service/enums/QuestionType.java \
        application_service/src/main/java/vn/chuongpl/application_service/enums/AttemptStatus.java \
        application_service/src/main/java/vn/chuongpl/application_service/enums/AttemptResult.java \
        application_service/src/main/java/vn/chuongpl/application_service/enums/ErrorCode.java
git commit -m "chore(application-service): add assessment enums and error codes"
```

---

## Task 3: Assessment entity + repository

**Files:**
- Create: `features/assessment/Question.java`
- Create: `features/assessment/Assessment.java`
- Create: `features/assessment/AssessmentRepository.java`

- [ ] **Step 1: Create Question.java**

```java
package vn.chuongpl.application_service.features.assessment;

import lombok.*;
import lombok.experimental.FieldDefaults;
import vn.chuongpl.application_service.enums.QuestionType;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Question {
    String id;
    String text;
    @Builder.Default
    List<String> options = new java.util.ArrayList<>();
    Integer correctOptionIndex;
    @Builder.Default
    QuestionType type = QuestionType.MCQ;
}
```

- [ ] **Step 2: Create Assessment.java**

```java
package vn.chuongpl.application_service.features.assessment;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.MongoId;
import vn.chuongpl.application_service.enums.AssessmentStatus;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "assessments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Assessment {
    @MongoId
    String id;

    @Field("job_id")
    String jobId;

    @Field("recruiter_id")
    String recruiterId;

    String title;
    String description;

    @Builder.Default
    List<Question> questions = new ArrayList<>();

    @Field("time_limit_minutes")
    int timeLimitMinutes;

    @Builder.Default
    AssessmentStatus status = AssessmentStatus.DRAFT;

    @Field("created_at")
    LocalDateTime createdAt;
}
```

- [ ] **Step 3: Create AssessmentRepository.java**

```java
package vn.chuongpl.application_service.features.assessment;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssessmentRepository extends MongoRepository<Assessment, String> {
    List<Assessment> findByRecruiterId(String recruiterId);
}
```

- [ ] **Step 4: Compile check**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/application_service && ./mvnw compile -q && echo "OK"
```
Expected: `OK`

- [ ] **Step 5: Commit**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add application_service/src/main/java/vn/chuongpl/application_service/features/assessment/Question.java \
        application_service/src/main/java/vn/chuongpl/application_service/features/assessment/Assessment.java \
        application_service/src/main/java/vn/chuongpl/application_service/features/assessment/AssessmentRepository.java
git commit -m "chore(application-service): add Assessment entity and repository"
```

---

## Task 4: AssessmentAttempt entity + repository

**Files:**
- Create: `features/assessment/AttemptAnswer.java`
- Create: `features/assessment/AssessmentAttempt.java`
- Create: `features/assessment/AssessmentAttemptRepository.java`

- [ ] **Step 1: Create AttemptAnswer.java**

```java
package vn.chuongpl.application_service.features.assessment;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AttemptAnswer {
    String questionId;
    Integer selectedOptionIndex;
    String textAnswer;
}
```

- [ ] **Step 2: Create AssessmentAttempt.java**

```java
package vn.chuongpl.application_service.features.assessment;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.MongoId;
import vn.chuongpl.application_service.enums.AttemptResult;
import vn.chuongpl.application_service.enums.AttemptStatus;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "assessment_attempts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AssessmentAttempt {
    @MongoId
    String id;

    @Field("assessment_id")
    String assessmentId;

    @Field("candidate_id")
    String candidateId;

    @Field("application_id")
    String applicationId;

    @Builder.Default
    AttemptStatus status = AttemptStatus.IN_PROGRESS;

    @Builder.Default
    List<AttemptAnswer> answers = new ArrayList<>();

    @Field("started_at")
    LocalDateTime startedAt;

    @Field("submitted_at")
    LocalDateTime submittedAt;

    Double score;

    AttemptResult result;
}
```

- [ ] **Step 3: Create AssessmentAttemptRepository.java**

```java
package vn.chuongpl.application_service.features.assessment;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import vn.chuongpl.application_service.enums.AttemptStatus;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssessmentAttemptRepository extends MongoRepository<AssessmentAttempt, String> {
    List<AssessmentAttempt> findByCandidateId(String candidateId);

    Optional<AssessmentAttempt> findByCandidateIdAndAssessmentIdAndStatus(
            String candidateId, String assessmentId, AttemptStatus status);
}
```

- [ ] **Step 4: Compile check**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/application_service && ./mvnw compile -q && echo "OK"
```
Expected: `OK`

- [ ] **Step 5: Commit**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add application_service/src/main/java/vn/chuongpl/application_service/features/assessment/AttemptAnswer.java \
        application_service/src/main/java/vn/chuongpl/application_service/features/assessment/AssessmentAttempt.java \
        application_service/src/main/java/vn/chuongpl/application_service/features/assessment/AssessmentAttemptRepository.java
git commit -m "chore(application-service): add AssessmentAttempt entity and repository"
```

---

## Task 5: Request/Response DTOs

**Files:**
- Create: `dtos/request/AssessmentCreateRequest.java`
- Create: `dtos/request/AssessmentAnswerRequest.java`
- Create: `dtos/response/AssessmentResponse.java`
- Create: `dtos/response/AttemptStateResponse.java`
- Create: `dtos/response/AssessmentResultResponse.java`

- [ ] **Step 1: Create AssessmentCreateRequest.java**

```java
package vn.chuongpl.application_service.dtos.request;

import lombok.Data;
import lombok.NoArgsConstructor;
import vn.chuongpl.application_service.features.assessment.Question;

import java.util.List;

@Data
@NoArgsConstructor
public class AssessmentCreateRequest {
    String jobId;
    String title;
    String description;
    List<Question> questions;
    int timeLimitMinutes;
}
```

- [ ] **Step 2: Create AssessmentAnswerRequest.java**

```java
package vn.chuongpl.application_service.dtos.request;

import lombok.Data;
import lombok.NoArgsConstructor;
import vn.chuongpl.application_service.features.assessment.AttemptAnswer;

import java.util.List;

@Data
@NoArgsConstructor
public class AssessmentAnswerRequest {
    List<AttemptAnswer> answers;
}
```

- [ ] **Step 3: Create AssessmentResponse.java**

```java
package vn.chuongpl.application_service.dtos.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import vn.chuongpl.application_service.enums.AssessmentStatus;
import vn.chuongpl.application_service.features.assessment.Question;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AssessmentResponse {
    String id;
    String jobId;
    String recruiterId;
    String title;
    String description;
    List<Question> questions;
    int timeLimitMinutes;
    AssessmentStatus status;
    LocalDateTime createdAt;
}
```

- [ ] **Step 4: Create AttemptStateResponse.java**

```java
package vn.chuongpl.application_service.dtos.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import vn.chuongpl.application_service.enums.AttemptStatus;
import vn.chuongpl.application_service.features.assessment.AttemptAnswer;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AttemptStateResponse {
    String attemptId;
    String assessmentId;
    AttemptStatus status;
    List<AttemptAnswer> answers;
    LocalDateTime startedAt;
}
```

- [ ] **Step 5: Create AssessmentResultResponse.java**

```java
package vn.chuongpl.application_service.dtos.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import vn.chuongpl.application_service.enums.AttemptResult;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AssessmentResultResponse {
    String attemptId;
    Double score;
    AttemptResult result;
    LocalDateTime submittedAt;
}
```

- [ ] **Step 6: Compile check**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/application_service && ./mvnw compile -q && echo "OK"
```
Expected: `OK`

- [ ] **Step 7: Commit**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add application_service/src/main/java/vn/chuongpl/application_service/dtos/request/AssessmentCreateRequest.java \
        application_service/src/main/java/vn/chuongpl/application_service/dtos/request/AssessmentAnswerRequest.java \
        application_service/src/main/java/vn/chuongpl/application_service/dtos/response/AssessmentResponse.java \
        application_service/src/main/java/vn/chuongpl/application_service/dtos/response/AttemptStateResponse.java \
        application_service/src/main/java/vn/chuongpl/application_service/dtos/response/AssessmentResultResponse.java
git commit -m "chore(application-service): add assessment request/response DTOs"
```

---

## Task 6: AssessmentService (TDD)

**Files:**
- Create: `features/assessment/AssessmentService.java`
- Create: `src/test/java/vn/chuongpl/application_service/features/assessment/AssessmentServiceTest.java`

- [ ] **Step 1: Write failing tests**

```java
package vn.chuongpl.application_service.features.assessment;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.chuongpl.application_service.dtos.request.AssessmentAnswerRequest;
import vn.chuongpl.application_service.dtos.request.AssessmentCreateRequest;
import vn.chuongpl.application_service.dtos.response.AssessmentResultResponse;
import vn.chuongpl.application_service.dtos.response.AssessmentResponse;
import vn.chuongpl.application_service.dtos.response.AttemptStateResponse;
import vn.chuongpl.application_service.enums.*;
import vn.chuongpl.application_service.exception.AppException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AssessmentServiceTest {
    @Mock AssessmentRepository assessmentRepository;
    @Mock AssessmentAttemptRepository attemptRepository;
    @InjectMocks AssessmentService assessmentService;

    // ── Recruiter: createAssessment ────────────────────────────────────────

    @Test
    void createAssessment_shouldSaveWithDraftStatusAndReturnResponse() {
        AssessmentCreateRequest req = new AssessmentCreateRequest();
        req.setTitle("Java Test");
        req.setDescription("Basic Java knowledge");
        req.setQuestions(List.of());
        req.setTimeLimitMinutes(30);

        Assessment saved = Assessment.builder()
                .id("a1").title("Java Test").status(AssessmentStatus.DRAFT)
                .recruiterId("r1").createdAt(LocalDateTime.now()).build();
        when(assessmentRepository.save(any(Assessment.class))).thenReturn(saved);

        AssessmentResponse response = assessmentService.createAssessment(req, "r1");

        assertEquals("a1", response.getId());
        assertEquals(AssessmentStatus.DRAFT, response.getStatus());
        verify(assessmentRepository).save(any(Assessment.class));
    }

    // ── Recruiter: assignToCandidate ───────────────────────────────────────

    @Test
    void assignToCandidate_shouldCreateInProgressAttemptAndActivateAssessment() {
        Assessment assessment = Assessment.builder()
                .id("a1").recruiterId("r1").status(AssessmentStatus.DRAFT).build();
        when(assessmentRepository.findById("a1")).thenReturn(Optional.of(assessment));
        when(attemptRepository.save(any(AssessmentAttempt.class))).thenAnswer(i -> i.getArgument(0));
        when(assessmentRepository.save(any(Assessment.class))).thenReturn(assessment);

        assessmentService.assignToCandidate("a1", "c1", "r1");

        ArgumentCaptor<AssessmentAttempt> captor = ArgumentCaptor.forClass(AssessmentAttempt.class);
        verify(attemptRepository).save(captor.capture());
        assertEquals("c1", captor.getValue().getCandidateId());
        assertEquals(AttemptStatus.IN_PROGRESS, captor.getValue().getStatus());

        assertEquals(AssessmentStatus.ACTIVE, assessment.getStatus());
    }

    // ── Candidate: startAttempt ────────────────────────────────────────────

    @Test
    void startAttempt_shouldCreateNewAttemptAndReturnAttemptId() {
        Assessment assessment = Assessment.builder().id("a1").status(AssessmentStatus.ACTIVE).build();
        when(assessmentRepository.findById("a1")).thenReturn(Optional.of(assessment));
        when(attemptRepository.findByCandidateIdAndAssessmentIdAndStatus("c1", "a1", AttemptStatus.IN_PROGRESS))
                .thenReturn(Optional.empty());
        AssessmentAttempt saved = AssessmentAttempt.builder().id("att1").build();
        when(attemptRepository.save(any(AssessmentAttempt.class))).thenReturn(saved);

        String attemptId = assessmentService.startAttempt("a1", "c1");

        assertEquals("att1", attemptId);
    }

    @Test
    void startAttempt_shouldThrowWhenAttemptAlreadyInProgress() {
        Assessment assessment = Assessment.builder().id("a1").status(AssessmentStatus.ACTIVE).build();
        when(assessmentRepository.findById("a1")).thenReturn(Optional.of(assessment));
        AssessmentAttempt existing = AssessmentAttempt.builder().id("att1").status(AttemptStatus.IN_PROGRESS).build();
        when(attemptRepository.findByCandidateIdAndAssessmentIdAndStatus("c1", "a1", AttemptStatus.IN_PROGRESS))
                .thenReturn(Optional.of(existing));

        AppException ex = assertThrows(AppException.class, () -> assessmentService.startAttempt("a1", "c1"));
        assertEquals(ErrorCode.ATTEMPT_ALREADY_IN_PROGRESS, ex.getErrorCode());
    }

    // ── Candidate: saveAnswers ─────────────────────────────────────────────

    @Test
    void saveAnswers_shouldReplaceAnswerListAndPersist() {
        AssessmentAttempt attempt = AssessmentAttempt.builder()
                .id("att1").candidateId("c1").status(AttemptStatus.IN_PROGRESS)
                .answers(new ArrayList<>()).build();
        when(attemptRepository.findById("att1")).thenReturn(Optional.of(attempt));

        AssessmentAnswerRequest req = new AssessmentAnswerRequest();
        req.setAnswers(List.of(new AttemptAnswer("q1", 2, null)));

        assessmentService.saveAnswers("att1", req, "c1");

        assertEquals(1, attempt.getAnswers().size());
        assertEquals("q1", attempt.getAnswers().get(0).getQuestionId());
        verify(attemptRepository).save(attempt);
    }

    @Test
    void saveAnswers_shouldThrowWhenAttemptAlreadySubmitted() {
        AssessmentAttempt attempt = AssessmentAttempt.builder()
                .id("att1").candidateId("c1").status(AttemptStatus.SUBMITTED).build();
        when(attemptRepository.findById("att1")).thenReturn(Optional.of(attempt));

        AppException ex = assertThrows(AppException.class,
                () -> assessmentService.saveAnswers("att1", new AssessmentAnswerRequest(), "c1"));
        assertEquals(ErrorCode.ATTEMPT_ALREADY_SUBMITTED, ex.getErrorCode());
    }

    // ── Candidate: submitAttempt ───────────────────────────────────────────

    @Test
    void submitAttempt_shouldGradeMcqQuestionsAndSetPassResult() {
        Question q1 = Question.builder().id("q1").type(QuestionType.MCQ).correctOptionIndex(1).build();
        Question q2 = Question.builder().id("q2").type(QuestionType.MCQ).correctOptionIndex(0).build();
        Assessment assessment = Assessment.builder().id("a1")
                .questions(List.of(q1, q2)).build();

        AttemptAnswer ans1 = new AttemptAnswer("q1", 1, null); // correct
        AttemptAnswer ans2 = new AttemptAnswer("q2", 1, null); // wrong
        AssessmentAttempt attempt = AssessmentAttempt.builder()
                .id("att1").candidateId("c1").assessmentId("a1")
                .status(AttemptStatus.IN_PROGRESS)
                .answers(new ArrayList<>(List.of(ans1, ans2))).build();

        when(attemptRepository.findById("att1")).thenReturn(Optional.of(attempt));
        when(assessmentRepository.findById("a1")).thenReturn(Optional.of(assessment));
        when(attemptRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        assessmentService.submitAttempt("att1", "c1");

        assertEquals(AttemptStatus.SUBMITTED, attempt.getStatus());
        assertEquals(50.0, attempt.getScore());
        assertEquals(AttemptResult.FAIL, attempt.getResult());
        assertNotNull(attempt.getSubmittedAt());
    }

    @Test
    void submitAttempt_shouldSetPendingResultWhenTextQuestionsPresent() {
        Question q1 = Question.builder().id("q1").type(QuestionType.MCQ).correctOptionIndex(0).build();
        Question q2 = Question.builder().id("q2").type(QuestionType.TEXT).build();
        Assessment assessment = Assessment.builder().id("a1").questions(List.of(q1, q2)).build();

        AttemptAnswer ans1 = new AttemptAnswer("q1", 0, null); // correct
        AttemptAnswer ans2 = new AttemptAnswer("q2", null, "My answer");
        AssessmentAttempt attempt = AssessmentAttempt.builder()
                .id("att1").candidateId("c1").assessmentId("a1")
                .status(AttemptStatus.IN_PROGRESS)
                .answers(new ArrayList<>(List.of(ans1, ans2))).build();

        when(attemptRepository.findById("att1")).thenReturn(Optional.of(attempt));
        when(assessmentRepository.findById("a1")).thenReturn(Optional.of(assessment));
        when(attemptRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        assessmentService.submitAttempt("att1", "c1");

        assertEquals(AttemptResult.PENDING, attempt.getResult());
    }

    // ── Candidate: getResult ───────────────────────────────────────────────

    @Test
    void getResult_shouldThrowWhenAttemptNotYetSubmitted() {
        AssessmentAttempt attempt = AssessmentAttempt.builder()
                .id("att1").candidateId("c1").status(AttemptStatus.IN_PROGRESS).build();
        when(attemptRepository.findById("att1")).thenReturn(Optional.of(attempt));

        AppException ex = assertThrows(AppException.class,
                () -> assessmentService.getResult("att1", "c1"));
        assertEquals(ErrorCode.ATTEMPT_NOT_SUBMITTED, ex.getErrorCode());
    }
}
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/application_service
./mvnw test -Dtest=AssessmentServiceTest -q 2>&1 | grep -E "Tests run|FAIL|ERROR|BUILD"
```
Expected: compilation error — `AssessmentService` not yet created.

- [ ] **Step 3: Create AssessmentService.java**

```java
package vn.chuongpl.application_service.features.assessment;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import vn.chuongpl.application_service.dtos.request.AssessmentAnswerRequest;
import vn.chuongpl.application_service.dtos.request.AssessmentCreateRequest;
import vn.chuongpl.application_service.dtos.response.AssessmentResponse;
import vn.chuongpl.application_service.dtos.response.AssessmentResultResponse;
import vn.chuongpl.application_service.dtos.response.AttemptStateResponse;
import vn.chuongpl.application_service.enums.*;
import vn.chuongpl.application_service.exception.AppException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class AssessmentService {

    AssessmentRepository assessmentRepository;
    AssessmentAttemptRepository attemptRepository;

    // ── Recruiter ──────────────────────────────────────────────────────────────

    public AssessmentResponse createAssessment(AssessmentCreateRequest req, String recruiterId) {
        Assessment assessment = Assessment.builder()
                .recruiterId(recruiterId)
                .jobId(req.getJobId())
                .title(req.getTitle())
                .description(req.getDescription())
                .questions(req.getQuestions() != null ? req.getQuestions() : List.of())
                .timeLimitMinutes(req.getTimeLimitMinutes())
                .status(AssessmentStatus.DRAFT)
                .createdAt(LocalDateTime.now())
                .build();
        Assessment saved = assessmentRepository.save(assessment);
        return toResponse(saved);
    }

    public void assignToCandidate(String assessmentId, String candidateId, String recruiterId) {
        Assessment assessment = findAssessmentById(assessmentId);
        AssessmentAttempt attempt = AssessmentAttempt.builder()
                .assessmentId(assessmentId)
                .candidateId(candidateId)
                .status(AttemptStatus.IN_PROGRESS)
                .startedAt(LocalDateTime.now())
                .build();
        attemptRepository.save(attempt);
        if (assessment.getStatus() == AssessmentStatus.DRAFT) {
            assessment.setStatus(AssessmentStatus.ACTIVE);
            assessmentRepository.save(assessment);
        }
    }

    // ── Candidate ──────────────────────────────────────────────────────────────

    public List<AttemptStateResponse> getMyAssessments(String candidateId) {
        return attemptRepository.findByCandidateId(candidateId).stream()
                .map(this::toAttemptStateResponse)
                .toList();
    }

    public AssessmentResponse getAssessment(String assessmentId) {
        Assessment assessment = findAssessmentById(assessmentId);
        AssessmentResponse response = toResponse(assessment);
        // Strip correct answers before returning to candidate
        if (response.getQuestions() != null) {
            response.getQuestions().forEach(q -> q.setCorrectOptionIndex(null));
        }
        return response;
    }

    public String startAttempt(String assessmentId, String candidateId) {
        findAssessmentById(assessmentId);
        attemptRepository.findByCandidateIdAndAssessmentIdAndStatus(
                        candidateId, assessmentId, AttemptStatus.IN_PROGRESS)
                .ifPresent(a -> { throw new AppException(ErrorCode.ATTEMPT_ALREADY_IN_PROGRESS); });

        AssessmentAttempt attempt = AssessmentAttempt.builder()
                .assessmentId(assessmentId)
                .candidateId(candidateId)
                .status(AttemptStatus.IN_PROGRESS)
                .startedAt(LocalDateTime.now())
                .build();
        return attemptRepository.save(attempt).getId();
    }

    public void saveAnswers(String attemptId, AssessmentAnswerRequest req, String candidateId) {
        AssessmentAttempt attempt = findAttemptById(attemptId);
        assertOwner(attempt, candidateId);
        if (attempt.getStatus() == AttemptStatus.SUBMITTED) {
            throw new AppException(ErrorCode.ATTEMPT_ALREADY_SUBMITTED);
        }
        attempt.setAnswers(req.getAnswers() != null ? req.getAnswers() : List.of());
        attemptRepository.save(attempt);
    }

    public void submitAttempt(String attemptId, String candidateId) {
        AssessmentAttempt attempt = findAttemptById(attemptId);
        assertOwner(attempt, candidateId);
        if (attempt.getStatus() == AttemptStatus.SUBMITTED) {
            throw new AppException(ErrorCode.ATTEMPT_ALREADY_SUBMITTED);
        }
        Assessment assessment = findAssessmentById(attempt.getAssessmentId());

        Map<String, Question> questionMap = assessment.getQuestions().stream()
                .collect(Collectors.toMap(Question::getId, q -> q));

        boolean hasText = assessment.getQuestions().stream()
                .anyMatch(q -> q.getType() == QuestionType.TEXT);

        long mcqTotal = assessment.getQuestions().stream()
                .filter(q -> q.getType() == QuestionType.MCQ).count();
        long mcqCorrect = attempt.getAnswers().stream()
                .filter(a -> {
                    Question q = questionMap.get(a.getQuestionId());
                    return q != null && q.getType() == QuestionType.MCQ
                            && q.getCorrectOptionIndex() != null
                            && q.getCorrectOptionIndex().equals(a.getSelectedOptionIndex());
                }).count();

        double score = mcqTotal > 0 ? (double) mcqCorrect / mcqTotal * 100 : 0.0;
        AttemptResult result;
        if (hasText) {
            result = AttemptResult.PENDING;
        } else {
            result = score >= 70 ? AttemptResult.PASS : AttemptResult.FAIL;
        }

        attempt.setScore(score);
        attempt.setResult(result);
        attempt.setStatus(AttemptStatus.SUBMITTED);
        attempt.setSubmittedAt(LocalDateTime.now());
        attemptRepository.save(attempt);
    }

    public AttemptStateResponse getAttemptState(String attemptId, String candidateId) {
        AssessmentAttempt attempt = findAttemptById(attemptId);
        assertOwner(attempt, candidateId);
        return toAttemptStateResponse(attempt);
    }

    public AssessmentResultResponse getResult(String attemptId, String candidateId) {
        AssessmentAttempt attempt = findAttemptById(attemptId);
        assertOwner(attempt, candidateId);
        if (attempt.getStatus() != AttemptStatus.SUBMITTED) {
            throw new AppException(ErrorCode.ATTEMPT_NOT_SUBMITTED);
        }
        return AssessmentResultResponse.builder()
                .attemptId(attempt.getId())
                .score(attempt.getScore())
                .result(attempt.getResult())
                .submittedAt(attempt.getSubmittedAt())
                .build();
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private Assessment findAssessmentById(String id) {
        return assessmentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ASSESSMENT_NOT_FOUND));
    }

    private AssessmentAttempt findAttemptById(String id) {
        return attemptRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ATTEMPT_NOT_FOUND));
    }

    private void assertOwner(AssessmentAttempt attempt, String candidateId) {
        if (!candidateId.equals(attempt.getCandidateId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
    }

    private AssessmentResponse toResponse(Assessment a) {
        return AssessmentResponse.builder()
                .id(a.getId())
                .jobId(a.getJobId())
                .recruiterId(a.getRecruiterId())
                .title(a.getTitle())
                .description(a.getDescription())
                .questions(a.getQuestions())
                .timeLimitMinutes(a.getTimeLimitMinutes())
                .status(a.getStatus())
                .createdAt(a.getCreatedAt())
                .build();
    }

    private AttemptStateResponse toAttemptStateResponse(AssessmentAttempt a) {
        return AttemptStateResponse.builder()
                .attemptId(a.getId())
                .assessmentId(a.getAssessmentId())
                .status(a.getStatus())
                .answers(a.getAnswers())
                .startedAt(a.getStartedAt())
                .build();
    }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/application_service
./mvnw test -Dtest=AssessmentServiceTest -q 2>&1 | grep -E "Tests run|BUILD"
```
Expected:
```
Tests run: 9, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

- [ ] **Step 5: Commit**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add application_service/src/main/java/vn/chuongpl/application_service/features/assessment/AssessmentService.java \
        application_service/src/test/java/vn/chuongpl/application_service/features/assessment/AssessmentServiceTest.java
git commit -m "feat(application-service): implement AssessmentService with full attempt lifecycle (9 tests passing)"
```

---

## Task 7: AssessmentController

**Files:**
- Create: `features/assessment/AssessmentController.java`

- [ ] **Step 1: Create AssessmentController.java**

```java
package vn.chuongpl.application_service.features.assessment;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.chuongpl.application_service.dtos.ApiResponse;
import vn.chuongpl.application_service.dtos.request.AssessmentAnswerRequest;
import vn.chuongpl.application_service.dtos.request.AssessmentCreateRequest;
import vn.chuongpl.application_service.dtos.response.AssessmentResponse;
import vn.chuongpl.application_service.dtos.response.AssessmentResultResponse;
import vn.chuongpl.application_service.dtos.response.AttemptStateResponse;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class AssessmentController {

    AssessmentService assessmentService;

    // ── Recruiter endpoints ────────────────────────────────────────────────────

    @PostMapping("/api/assessments")
    @PreAuthorize("hasRole('RECRUITER')")
    public ApiResponse<AssessmentResponse> createAssessment(
            @RequestBody AssessmentCreateRequest request,
            @AuthenticationPrincipal String userId) {
        return ApiResponse.<AssessmentResponse>builder()
                .data(assessmentService.createAssessment(request, userId))
                .build();
    }

    @PatchMapping("/api/assessments/{id}/assign")
    @PreAuthorize("hasRole('RECRUITER')")
    public ApiResponse<Void> assignToCandidate(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal String userId) {
        assessmentService.assignToCandidate(id, body.get("candidateId"), userId);
        return ApiResponse.<Void>builder().message("Assessment assigned").build();
    }

    // ── Candidate endpoints ────────────────────────────────────────────────────

    @GetMapping("/api/assessments/my")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ApiResponse<List<AttemptStateResponse>> getMyAssessments(@AuthenticationPrincipal String userId) {
        return ApiResponse.<List<AttemptStateResponse>>builder()
                .data(assessmentService.getMyAssessments(userId))
                .build();
    }

    @GetMapping("/api/assessments/{id}")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ApiResponse<AssessmentResponse> getAssessment(@PathVariable String id) {
        return ApiResponse.<AssessmentResponse>builder()
                .data(assessmentService.getAssessment(id))
                .build();
    }

    @PostMapping("/api/assessments/{id}/start")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ApiResponse<Map<String, String>> startAttempt(
            @PathVariable String id,
            @AuthenticationPrincipal String userId) {
        String attemptId = assessmentService.startAttempt(id, userId);
        return ApiResponse.<Map<String, String>>builder()
                .data(Map.of("attemptId", attemptId))
                .build();
    }

    @GetMapping("/api/attempts/{attemptId}")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ApiResponse<AttemptStateResponse> getAttemptState(
            @PathVariable String attemptId,
            @AuthenticationPrincipal String userId) {
        return ApiResponse.<AttemptStateResponse>builder()
                .data(assessmentService.getAttemptState(attemptId, userId))
                .build();
    }

    @PostMapping("/api/attempts/{attemptId}/answers")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ApiResponse<Void> saveAnswers(
            @PathVariable String attemptId,
            @RequestBody AssessmentAnswerRequest request,
            @AuthenticationPrincipal String userId) {
        assessmentService.saveAnswers(attemptId, request, userId);
        return ApiResponse.<Void>builder().message("Answers saved").build();
    }

    @PostMapping("/api/attempts/{attemptId}/submit")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ApiResponse<Void> submitAttempt(
            @PathVariable String attemptId,
            @AuthenticationPrincipal String userId) {
        assessmentService.submitAttempt(attemptId, userId);
        return ApiResponse.<Void>builder().message("Assessment submitted").build();
    }

    @GetMapping("/api/attempts/{attemptId}/result")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ApiResponse<AssessmentResultResponse> getResult(
            @PathVariable String attemptId,
            @AuthenticationPrincipal String userId) {
        return ApiResponse.<AssessmentResultResponse>builder()
                .data(assessmentService.getResult(attemptId, userId))
                .build();
    }
}
```

- [ ] **Step 2: Full compile + all tests pass**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/application_service
./mvnw test -q 2>&1 | grep -E "Tests run|BUILD"
```
Expected:
```
Tests run: *, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

- [ ] **Step 3: Commit**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add application_service/src/main/java/vn/chuongpl/application_service/features/assessment/AssessmentController.java
git commit -m "feat(application-service): add AssessmentController with 9 endpoints (Plan 3 complete)"
```
