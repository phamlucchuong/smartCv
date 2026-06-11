# User Service — Company Enrichment & Job Suggestions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `benefits`, `rating`, `reviewCount` to the company profile; add `GET /companies/{id}/jobs` and `GET /companies/{id}/related` endpoints; enrich the job suggestions response with full job card data.

**Architecture:** `Recruiter` entity gains 3 new fields (additive, no migration needed in MongoDB). `CompanyService` gets 2 new methods calling `JobClient`. `JobClient` gets 2 new methods calling the batch/recruiter endpoints added in Plan 1. `CandidateService.getJobSuggestions` is wrapped in a new `getEnrichedJobSuggestions` method; the controller endpoint is updated to return the enriched type.

**Tech Stack:** Spring Boot 3.4.4, MongoDB, RestTemplate (existing), Mockito

**Prerequisite:** Plan 1 (`job_service`) must be deployed so `GET /job/api/jobs/batch` and `GET /job/api/jobs/by-recruiter/{id}` are available.

---

## File Map

**Create:**
- `features/candidate/EnrichedJobSuggestion.java` — new DTO wrapping JobSuggestion + JobSummary
- `src/test/java/.../features/company/CompanyServiceExtensionsTest.java`
- `src/test/java/.../service/EnrichedSuggestionsServiceTest.java`

**Modify:**
- `features/recruiter/Recruiter.java` — add `benefits`, `rating`, `reviewCount`
- `dtos/request/RecruiterRequest.java` — add same 3 fields
- `features/company/CompanyResponse.java` — expose new fields + update `from()`
- `features/company/CompanyService.java` — add `getCompanyJobs()`, `getRelatedCompanies()`
- `features/company/CompanyController.java` — add 2 new endpoints
- `features/recruiter/RecruiterRepository.java` — add related-companies query
- `integration/job/JobClient.java` — add `getJobsByRecruiter()`, `getJobsByIds()`
- `features/candidate/CandidateService.java` — add `getEnrichedJobSuggestions()`
- `features/candidate/CandidateController.java` — update `/job-suggestions` return type

All paths relative to `user-service/src/main/java/vn/chuongpl/user_service/`.

---

## Task 1: Recruiter entity enrichment + CompanyResponse update

**Files:**
- Modify: `features/recruiter/Recruiter.java`
- Modify: `dtos/request/RecruiterRequest.java`
- Modify: `features/company/CompanyResponse.java`

- [ ] **Step 1: Add 3 fields to Recruiter.java**

In `Recruiter.java`, add these fields in the `// ── Company info ──` section, after `industry`:
```java
// ── Enrichment ────────────────────────────────────────────────────────────
@Builder.Default
@Field(name = "benefits")
java.util.List<String> benefits = new java.util.ArrayList<>();

@Field(name = "rating")
Double rating;

@Field(name = "review_count")
Integer reviewCount;
```

- [ ] **Step 2: Add 3 fields to RecruiterRequest.java**

In `RecruiterRequest.java`, add these fields after `industry`:
```java
java.util.List<String> benefits;
Double rating;
Integer reviewCount;
```

- [ ] **Step 3: Update CompanyResponse.java**

Replace the existing `CompanyResponse.java` content with:
```java
package vn.chuongpl.user_service.features.company;

import lombok.*;
import lombok.experimental.FieldDefaults;
import vn.chuongpl.user_service.features.recruiter.Recruiter;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CompanyResponse {
    String id;
    String name;
    String logoUrl;
    String coverImageUrl;
    String industry;
    String size;
    String location;
    String website;
    String description;
    Integer foundedYear;
    Integer activeJobCount;
    List<String> benefits;
    Double rating;
    Integer reviewCount;

    public static CompanyResponse from(Recruiter r) {
        return CompanyResponse.builder()
                .id(r.getId())
                .name(r.getCompanyName())
                .logoUrl(r.getLogoUrl())
                .coverImageUrl(r.getCoverImageUrl())
                .industry(r.getIndustry())
                .size(r.getCompanySize())
                .location(r.getCompanyAddress())
                .website(r.getCompanyWebsite())
                .description(r.getCompanyDescription())
                .foundedYear(r.getFoundedYear())
                .benefits(r.getBenefits())
                .rating(r.getRating())
                .reviewCount(r.getReviewCount())
                .build();
    }
}
```

- [ ] **Step 4: Compile check**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/user-service && ./mvnw compile -q && echo "OK"
```
Expected: `OK`

- [ ] **Step 5: Commit**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add user-service/src/main/java/vn/chuongpl/user_service/features/recruiter/Recruiter.java \
        user-service/src/main/java/vn/chuongpl/user_service/dtos/request/RecruiterRequest.java \
        user-service/src/main/java/vn/chuongpl/user_service/features/company/CompanyResponse.java
git commit -m "feat(user-service): add benefits, rating, reviewCount to Recruiter and CompanyResponse"
```

---

## Task 2: JobClient extensions

**Files:**
- Modify: `integration/job/JobClient.java`

- [ ] **Step 1: Add `getJobsByRecruiter()` and `getJobsByIds()` to JobClient.java**

Add these imports at the top of JobClient (after existing imports):
```java
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.core.ParameterizedTypeReference;
```

Note: `ParameterizedTypeReference` and `RestTemplate` are already imported. Add `java.util.List` and `java.util.stream.Collectors` if not present.

Add these 2 methods inside the `JobClient` class body, after `getJobById()`:
```java
public List<JobSummary> getJobsByRecruiter(String recruiterId) {
    try {
        var response = restTemplate.exchange(
                jobServiceUrl + "/api/jobs/by-recruiter/" + recruiterId,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<JobApiResponse<List<JobSummary>>>() {}
        );
        if (response.getBody() != null && response.getBody().getData() != null) {
            return response.getBody().getData();
        }
    } catch (Exception e) {
        log.warn("Failed to fetch jobs for recruiter {}: {}", recruiterId, e.getMessage());
    }
    return List.of();
}

public List<JobSummary> getJobsByIds(List<String> jobIds) {
    if (jobIds == null || jobIds.isEmpty()) return List.of();
    String ids = jobIds.stream().collect(Collectors.joining(","));
    try {
        var response = restTemplate.exchange(
                jobServiceUrl + "/api/jobs/batch?ids=" + ids,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<JobApiResponse<List<JobSummary>>>() {}
        );
        if (response.getBody() != null && response.getBody().getData() != null) {
            return response.getBody().getData();
        }
    } catch (Exception e) {
        log.warn("Failed to fetch jobs by ids {}: {}", ids, e.getMessage());
    }
    return List.of();
}
```

- [ ] **Step 2: Compile check**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/user-service && ./mvnw compile -q && echo "OK"
```
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add user-service/src/main/java/vn/chuongpl/user_service/integration/job/JobClient.java
git commit -m "feat(user-service): add getJobsByRecruiter and getJobsByIds to JobClient"
```

---

## Task 3: CompanyService extensions (TDD)

**Files:**
- Modify: `features/recruiter/RecruiterRepository.java`
- Modify: `features/company/CompanyService.java`
- Create: `src/test/java/vn/chuongpl/user_service/features/company/CompanyServiceExtensionsTest.java`

- [ ] **Step 1: Write failing tests**

```java
package vn.chuongpl.user_service.features.company;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import vn.chuongpl.user_service.enums.RecruiterStatus;
import vn.chuongpl.user_service.features.recruiter.Recruiter;
import vn.chuongpl.user_service.features.recruiter.RecruiterRepository;
import vn.chuongpl.user_service.integration.job.JobClient;
import vn.chuongpl.user_service.integration.job.JobSummary;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CompanyServiceExtensionsTest {
    @Mock RecruiterRepository recruiterRepository;
    @Mock MongoTemplate mongoTemplate;
    @Mock JobClient jobClient;
    @InjectMocks CompanyService companyService;

    @Test
    void getCompanyJobs_shouldDelegateToJobClient() {
        JobSummary job = new JobSummary();
        job.setId("j1");
        job.setTitle("Backend Engineer");
        when(jobClient.getJobsByRecruiter("r1")).thenReturn(List.of(job));

        List<JobSummary> result = companyService.getCompanyJobs("r1");

        assertEquals(1, result.size());
        assertEquals("j1", result.get(0).getId());
        verify(jobClient).getJobsByRecruiter("r1");
    }

    @Test
    void getCompanyJobs_shouldReturnEmptyListWhenJobClientFails() {
        when(jobClient.getJobsByRecruiter("r1")).thenReturn(List.of());

        List<JobSummary> result = companyService.getCompanyJobs("r1");

        assertTrue(result.isEmpty());
    }

    @Test
    void getRelatedCompanies_shouldReturnSameIndustryCompanies() {
        Recruiter current = Recruiter.builder().id("r1").industry("IT").status(RecruiterStatus.APPROVED).build();
        Recruiter related = Recruiter.builder().id("r2").companyName("OtherCorp").industry("IT").status(RecruiterStatus.APPROVED).build();
        when(recruiterRepository.findByIdAndDeletedFalse("r1")).thenReturn(Optional.of(current));
        when(recruiterRepository.findTop5ByIndustryAndIdNotAndStatusAndDeletedFalse("IT", "r1", RecruiterStatus.APPROVED))
                .thenReturn(List.of(related));

        List<CompanyResponse> result = companyService.getRelatedCompanies("r1");

        assertEquals(1, result.size());
        assertEquals("r2", result.get(0).getId());
    }

    @Test
    void getRelatedCompanies_shouldReturnEmptyListWhenNoIndustry() {
        Recruiter current = Recruiter.builder().id("r1").industry(null).status(RecruiterStatus.APPROVED).build();
        when(recruiterRepository.findByIdAndDeletedFalse("r1")).thenReturn(Optional.of(current));

        List<CompanyResponse> result = companyService.getRelatedCompanies("r1");

        assertTrue(result.isEmpty());
        verifyNoMoreInteractions(recruiterRepository);
    }
}
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/user-service
./mvnw test -Dtest=CompanyServiceExtensionsTest -q 2>&1 | grep -E "Tests run|FAIL|ERROR|BUILD"
```
Expected: compilation error — methods and repository method not yet defined.

- [ ] **Step 3: Add repository method to RecruiterRepository.java**

Add this method to the `RecruiterRepository` interface body, after existing methods:
```java
List<Recruiter> findTop5ByIndustryAndIdNotAndStatusAndDeletedFalse(
        String industry, String id, vn.chuongpl.user_service.enums.RecruiterStatus status);
```

- [ ] **Step 4: Add `JobClient` dependency and new methods to CompanyService.java**

In `CompanyService.java`, add `JobClient` field declaration after `MongoTemplate mongoTemplate`:
```java
JobClient jobClient;
```

Add these imports at the top of CompanyService (after existing imports):
```java
import vn.chuongpl.user_service.integration.job.JobClient;
import vn.chuongpl.user_service.integration.job.JobSummary;
```

Add these 2 methods inside the `CompanyService` class body, after `getByIds()`:
```java
public List<JobSummary> getCompanyJobs(String companyId) {
    return jobClient.getJobsByRecruiter(companyId);
}

public List<CompanyResponse> getRelatedCompanies(String companyId) {
    Recruiter current = recruiterRepository.findByIdAndDeletedFalse(companyId)
            .orElseThrow(() -> new AppException(ErrorCode.COMPANY_NOT_FOUND));
    if (current.getIndustry() == null || current.getIndustry().isBlank()) {
        return List.of();
    }
    return recruiterRepository.findTop5ByIndustryAndIdNotAndStatusAndDeletedFalse(
                    current.getIndustry(), companyId, RecruiterStatus.APPROVED)
            .stream()
            .map(CompanyResponse::from)
            .toList();
}
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/user-service
./mvnw test -Dtest=CompanyServiceExtensionsTest -q 2>&1 | grep -E "Tests run|BUILD"
```
Expected:
```
Tests run: 4, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

- [ ] **Step 6: Commit**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add user-service/src/main/java/vn/chuongpl/user_service/features/recruiter/RecruiterRepository.java \
        user-service/src/main/java/vn/chuongpl/user_service/features/company/CompanyService.java \
        user-service/src/test/java/vn/chuongpl/user_service/features/company/CompanyServiceExtensionsTest.java
git commit -m "feat(user-service): add getCompanyJobs and getRelatedCompanies to CompanyService (4 tests passing)"
```

---

## Task 4: CompanyController — 2 new endpoints

**Files:**
- Modify: `features/company/CompanyController.java`

- [ ] **Step 1: Add 2 new methods to CompanyController.java**

Add this import at the top of CompanyController (after existing imports):
```java
import vn.chuongpl.user_service.integration.job.JobSummary;
```

Add these 2 methods inside the `CompanyController` class body, after `getFollowed()`:
```java
@GetMapping("/{id}/jobs")
public ApiResponse<List<JobSummary>> getCompanyJobs(@PathVariable String id) {
    return ApiResponse.<List<JobSummary>>builder()
            .data(companyService.getCompanyJobs(id))
            .build();
}

@GetMapping("/{id}/related")
public ApiResponse<List<CompanyResponse>> getRelatedCompanies(@PathVariable String id) {
    return ApiResponse.<List<CompanyResponse>>builder()
            .data(companyService.getRelatedCompanies(id))
            .build();
}
```

- [ ] **Step 2: Compile check**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/user-service && ./mvnw compile -q && echo "OK"
```
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add user-service/src/main/java/vn/chuongpl/user_service/features/company/CompanyController.java
git commit -m "feat(user-service): add /{id}/jobs and /{id}/related company endpoints"
```

---

## Task 5: Enriched Job Suggestions (TDD)

**Files:**
- Create: `features/candidate/EnrichedJobSuggestion.java`
- Modify: `features/candidate/CandidateService.java`
- Modify: `features/candidate/CandidateController.java`
- Create: `src/test/java/vn/chuongpl/user_service/service/EnrichedSuggestionsServiceTest.java`

- [ ] **Step 1: Create EnrichedJobSuggestion.java**

```java
package vn.chuongpl.user_service.features.candidate;

import lombok.*;
import lombok.experimental.FieldDefaults;
import vn.chuongpl.user_service.integration.job.JobSummary;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EnrichedJobSuggestion {
    String jobId;
    Integer matchScore;
    String matchReason;
    List<String> alignedSkills;
    LocalDateTime suggestedAt;
    JobSummary job;
}
```

- [ ] **Step 2: Write failing tests**

```java
package vn.chuongpl.user_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.chuongpl.user_service.features.candidate.*;
import vn.chuongpl.user_service.features.candidate.settings.CandidateSettings;
import vn.chuongpl.user_service.features.recruiter.RecruiterRepository;
import vn.chuongpl.user_service.features.user.UserRepository;
import vn.chuongpl.user_service.integration.job.JobClient;
import vn.chuongpl.user_service.integration.job.JobSummary;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EnrichedSuggestionsServiceTest {
    @Mock CandidateRepository candidateRepository;
    @Mock UserRepository userRepository;
    @Mock CandidateMapper candidateMapper;
    @Mock JobClient jobClient;
    @InjectMocks CandidateService candidateService;

    @Test
    void getEnrichedJobSuggestions_shouldMergeJobDataIntoBySuggestions() {
        JobSuggestion suggestion = JobSuggestion.builder()
                .jobId("j1").matchScore(90).matchReason("Good match").alignedSkills(List.of("Java")).build();
        Candidate c = Candidate.builder().userId("u1")
                .jobSuggestions(new ArrayList<>(List.of(suggestion)))
                .settings(new CandidateSettings())
                .build();
        when(candidateRepository.findByUserIdAndDeletedFalse("u1")).thenReturn(Optional.of(c));

        JobSummary jobSummary = new JobSummary();
        jobSummary.setId("j1");
        jobSummary.setTitle("Backend Engineer");
        when(jobClient.getJobsByIds(List.of("j1"))).thenReturn(List.of(jobSummary));

        List<EnrichedJobSuggestion> result = candidateService.getEnrichedJobSuggestions("u1");

        assertEquals(1, result.size());
        assertEquals("j1", result.get(0).getJobId());
        assertEquals(90, result.get(0).getMatchScore());
        assertNotNull(result.get(0).getJob());
        assertEquals("Backend Engineer", result.get(0).getJob().getTitle());
    }

    @Test
    void getEnrichedJobSuggestions_shouldReturnSuggestionWithNullJobWhenJobClientFails() {
        JobSuggestion suggestion = JobSuggestion.builder()
                .jobId("j1").matchScore(80).build();
        Candidate c = Candidate.builder().userId("u1")
                .jobSuggestions(new ArrayList<>(List.of(suggestion)))
                .settings(new CandidateSettings())
                .build();
        when(candidateRepository.findByUserIdAndDeletedFalse("u1")).thenReturn(Optional.of(c));
        when(jobClient.getJobsByIds(List.of("j1"))).thenReturn(List.of());

        List<EnrichedJobSuggestion> result = candidateService.getEnrichedJobSuggestions("u1");

        assertEquals(1, result.size());
        assertNull(result.get(0).getJob());
    }

    @Test
    void getEnrichedJobSuggestions_shouldReturnEmptyListWhenNoSuggestions() {
        Candidate c = Candidate.builder().userId("u1")
                .jobSuggestions(new ArrayList<>())
                .settings(new CandidateSettings())
                .build();
        when(candidateRepository.findByUserIdAndDeletedFalse("u1")).thenReturn(Optional.of(c));

        List<EnrichedJobSuggestion> result = candidateService.getEnrichedJobSuggestions("u1");

        assertTrue(result.isEmpty());
        verifyNoInteractions(jobClient);
    }
}
```

- [ ] **Step 3: Run tests — expect FAIL**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/user-service
./mvnw test -Dtest=EnrichedSuggestionsServiceTest -q 2>&1 | grep -E "Tests run|FAIL|ERROR|BUILD"
```
Expected: compilation error — `getEnrichedJobSuggestions` and `JobClient` dependency not yet in `CandidateService`.

- [ ] **Step 4: Add `JobClient` field and `getEnrichedJobSuggestions()` to CandidateService.java**

In `CandidateService.java`, add this field after the existing field declarations (note: `CandidateService` uses `@RequiredArgsConstructor` + `@FieldDefaults(makeFinal = true)`):
```java
JobClient jobClient;
```

Add these imports at the top of CandidateService (after existing imports):
```java
import vn.chuongpl.user_service.features.candidate.EnrichedJobSuggestion;
import vn.chuongpl.user_service.integration.job.JobClient;
import vn.chuongpl.user_service.integration.job.JobSummary;
import java.util.Map;
import java.util.stream.Collectors;
```

Add this method inside `CandidateService` class body, after `getJobSuggestions()`:
```java
public List<EnrichedJobSuggestion> getEnrichedJobSuggestions(String userId) {
    List<JobSuggestion> suggestions = getJobSuggestions(userId);
    if (suggestions.isEmpty()) return List.of();

    List<String> jobIds = suggestions.stream().map(JobSuggestion::getJobId).toList();
    Map<String, JobSummary> jobMap = jobClient.getJobsByIds(jobIds).stream()
            .collect(Collectors.toMap(JobSummary::getId, j -> j));

    return suggestions.stream()
            .map(s -> EnrichedJobSuggestion.builder()
                    .jobId(s.getJobId())
                    .matchScore(s.getMatchScore())
                    .matchReason(s.getMatchReason())
                    .alignedSkills(s.getAlignedSkills())
                    .suggestedAt(s.getSuggestedAt())
                    .job(jobMap.get(s.getJobId()))
                    .build())
            .toList();
}
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/user-service
./mvnw test -Dtest=EnrichedSuggestionsServiceTest -q 2>&1 | grep -E "Tests run|BUILD"
```
Expected:
```
Tests run: 3, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

- [ ] **Step 6: Update CandidateController to use enriched suggestions**

In `CandidateController.java`, find the existing `getJobSuggestions` method:
```java
@GetMapping("/job-suggestions")
@PreAuthorize("hasRole('CANDIDATE')")
public ApiResponse<List<JobSuggestion>> getJobSuggestions(@AuthenticationPrincipal String userId) {
    return ApiResponse.<List<JobSuggestion>>builder()
            .data(candidateService.getJobSuggestions(userId))
            .build();
}
```

Replace it with:
```java
@GetMapping("/job-suggestions")
@PreAuthorize("hasRole('CANDIDATE')")
public ApiResponse<List<EnrichedJobSuggestion>> getJobSuggestions(@AuthenticationPrincipal String userId) {
    return ApiResponse.<List<EnrichedJobSuggestion>>builder()
            .data(candidateService.getEnrichedJobSuggestions(userId))
            .build();
}
```

Add import at the top of CandidateController:
```java
import vn.chuongpl.user_service.features.candidate.EnrichedJobSuggestion;
```

- [ ] **Step 7: Full compile + all tests pass**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/user-service
./mvnw test -q 2>&1 | grep -E "Tests run|BUILD"
```
Expected:
```
Tests run: *, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

- [ ] **Step 8: Commit**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add user-service/src/main/java/vn/chuongpl/user_service/features/candidate/EnrichedJobSuggestion.java \
        user-service/src/main/java/vn/chuongpl/user_service/features/candidate/CandidateService.java \
        user-service/src/main/java/vn/chuongpl/user_service/features/candidate/CandidateController.java \
        user-service/src/test/java/vn/chuongpl/user_service/service/EnrichedSuggestionsServiceTest.java
git commit -m "feat(user-service): add enriched job suggestions with job card data (3 tests passing, Plan 2 complete)"
```
