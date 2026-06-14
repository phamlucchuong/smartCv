✅

# Application & Job Services Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (1) Enrich `ApplicationResponse` with job snapshot fields. (2) Add `GET /api/applications/by-job/{jobId}/mine` endpoint. (3) Add `GET /api/jobs/{id}/related` to `job_service`. (4) Add public home aggregates to `job_service` (`HomeController`). (5) Wire `ai_engine_service` to publish job suggestions event. (6) Update gateway public routes for new endpoints.

**Architecture:** `application_service` denormalizes job fields at submit time (same pattern as existing `jobTitle`). `job_service` adds two new controllers: one for related jobs (uses MongoDB `$in` on skills), one for home aggregates (MongoDB aggregation + Redis caching). `ai_engine_service` publishes a `job.suggestions.computed` event after recommendation. Gateway whitelist updated.

**Tech Stack:** Spring Boot 3.4.4/3.5.14, MongoDB aggregation, Spring Cache (Redis), RabbitMQ, Mockito

**Prerequisite:** Plan 1 and Plan 2 complete (user-service has `JobSuggestionsConsumer` ready to receive events).

---

## File Map

**application_service — Modify:**
- `features/application/Application.java` — add job snapshot fields
- `features/application/ApplicationController.java` — add `GET /by-job/{jobId}/mine`
- `features/application/ApplicationService.java` — enrich on submit + new query method
- `dtos/response/ApplicationResponse.java` — add new fields
- `src/test/.../service/ApplicationEnrichmentTest.java` — new test class

**job_service — Create:**
- `features/job/HomeController.java` — GET /api/home/*
- `features/job/HomeService.java` — MongoDB aggregation queries
- `features/job/HomeResponse.java` — stats/categories DTOs
- `src/test/.../service/HomeServiceTest.java`

**job_service — Modify:**
- `features/job/JobController.java` — add `GET /{id}/related`
- `features/job/JobService.java` — add `getRelatedJobs()` method
- `features/job/JobRepository.java` — add batch/related queries
- `src/test/.../service/JobServiceRelatedTest.java`

**ai_engine_service — Modify:**
- `features/analysis/AnalysisService.java` — publish suggestions event after recommend()
- RabbitMQ config — add job.suggestions exchange/queue

**api-gateway — Modify:**
- `src/main/resources/application.yaml` — add public routes

All paths are relative to their respective service `src/main/java/` root.

---

## Task 1: Enrich ApplicationResponse with Job Snapshot Fields

**Files:**
- Modify: `application_service/.../features/application/Application.java`
- Modify: `application_service/.../dtos/response/ApplicationResponse.java`
- Create: `application_service/src/test/.../service/ApplicationEnrichmentTest.java`

- [ ] **Step 1: Add snapshot fields to Application.java**

Read `application_service/src/main/java/vn/chuongpl/application_service/features/application/Application.java`.

After the existing `jobTitle` field, add:
```java
@Field(name = "company_name")
String companyName;

@Field(name = "job_location")
String jobLocation;

@Field(name = "salary_min")
Double salaryMin;

@Field(name = "salary_max")
Double salaryMax;

@Field(name = "job_skills")
java.util.List<String> jobSkills;

@Field(name = "job_type")
String jobType;
```

- [ ] **Step 2: Add snapshot fields to ApplicationResponse.java**

Read `application_service/src/main/java/vn/chuongpl/application_service/dtos/response/ApplicationResponse.java`.

Add after the existing `jobId` field:
```java
String companyName;
String jobLocation;
Double salaryMin;
Double salaryMax;
java.util.List<String> jobSkills;
String jobType;
```

- [ ] **Step 3: Check existing JobClient in application_service**

Read `application_service/src/main/java/vn/chuongpl/application_service/integration/job/JobClient.java`.

It should have a `getActiveJob(String jobId)` method. Verify what `JobResponse` or similar DTO it returns and what fields are available (company, location, salary, skills, jobType).

- [ ] **Step 4: Update application_service JobResponse DTO (if needed)**

If `application_service/src/main/java/vn/chuongpl/application_service/integration/job/` does not have `location`, `salaryMin`, `salaryMax`, `skills`, `jobType` in its job DTO, add them.

Read the existing DTO file (likely `JobResponse.java` or `ActiveJobResponse.java` in that package) and add the missing fields:
```java
String company;
String location;
Double salaryMin;
Double salaryMax;
java.util.List<String> skills;
String jobType;
```

- [ ] **Step 5: Write failing test**

```java
package vn.chuongpl.application_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.chuongpl.application_service.dtos.request.ApplicationCreateRequest;
import vn.chuongpl.application_service.dtos.response.ApplicationResponse;
import vn.chuongpl.application_service.enums.ApplicationStatus;
import vn.chuongpl.application_service.enums.ErrorCode;
import vn.chuongpl.application_service.exception.AppException;
import vn.chuongpl.application_service.features.application.Application;
import vn.chuongpl.application_service.features.application.ApplicationRepository;
import vn.chuongpl.application_service.features.application.ApplicationService;
import vn.chuongpl.application_service.integration.job.JobClient;
import vn.chuongpl.application_service.integration.user.UserClient;
import vn.chuongpl.application_service.integration.notification.NotificationPublisher;
import vn.chuongpl.application_service.integration.ai.AiScoringPublisher;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApplicationEnrichmentTest {
    @Mock ApplicationRepository applicationRepository;
    @Mock JobClient jobClient;
    @Mock UserClient userClient;
    @Mock NotificationPublisher notificationPublisher;
    @Mock AiScoringPublisher aiScoringPublisher;
    @InjectMocks ApplicationService applicationService;

    @Test
    void submit_shouldCopyJobSnapshotFieldsIntoApplication() {
        // Arrange — set up job with location, salary, skills, jobType
        // Exact type depends on your JobClient response class; adjust class name if different
        var jobResponse = buildMockJobResponse("j1", "ACME Corp", "Hanoi", 1000.0, 2000.0,
                List.of("Java", "Spring"), "FULL_TIME");
        when(jobClient.getActiveJob("j1")).thenReturn(jobResponse);
        when(userClient.getCandidateEmail(any())).thenReturn("test@example.com");
        when(applicationRepository.findByCandidateIdAndJobIdAndDeletedFalse(any(), any()))
                .thenReturn(Optional.empty());
        when(applicationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ApplicationCreateRequest req = ApplicationCreateRequest.builder()
                .candidateId("c1").jobId("j1").cvUrl("cv.pdf").build();

        ApplicationResponse result = applicationService.submit(req);

        assertEquals("ACME Corp", result.getCompanyName());
        assertEquals("Hanoi", result.getJobLocation());
        assertEquals(1000.0, result.getSalaryMin());
        assertEquals(2000.0, result.getSalaryMax());
        assertEquals(List.of("Java", "Spring"), result.getJobSkills());
        assertEquals("FULL_TIME", result.getJobType());
    }

    // Helper — replace with actual JobResponse class name/builder from integration/job package
    private Object buildMockJobResponse(String id, String company, String location,
                                         Double salMin, Double salMax,
                                         List<String> skills, String jobType) {
        // Read integration/job/JobClient.java to find the actual return type, then replace this method
        // For now this documents the expectation
        throw new UnsupportedOperationException("Replace with actual JobResponse type from integration/job/");
    }
}
```

**Note:** Before running, read `application_service/src/main/java/vn/chuongpl/application_service/integration/job/JobClient.java` to find the exact return type and mock setup. Replace `buildMockJobResponse` with actual mock construction.

- [ ] **Step 6: Implement snapshot copy in ApplicationService.submit()**

Read `ApplicationService.java` and find the `submit()` method. After the line that calls `jobClient.getActiveJob(request.getJobId())`, add the snapshot copy:

```java
// Copy job snapshot into application for denormalized display
application.setCompanyName(job.getCompany());
application.setJobLocation(job.getLocation());
application.setSalaryMin(job.getSalaryMin());
application.setSalaryMax(job.getSalaryMax());
application.setJobSkills(job.getSkills());
application.setJobType(job.getJobType());
```

Also update the `ApplicationResponse` mapping (in `ApplicationService` or its mapper) to include the new fields. If MapStruct is used, the new fields with matching names will be auto-mapped — just verify by running tests.

- [ ] **Step 7: Run tests**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/application_service
mvn test -q 2>&1 | grep -E "Tests run|BUILD"
```
Expected: all existing tests pass + new test passes

- [ ] **Step 8: Commit**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add application_service/src/main/java/vn/chuongpl/application_service/features/application/Application.java \
        application_service/src/main/java/vn/chuongpl/application_service/dtos/response/ApplicationResponse.java \
        application_service/src/main/java/vn/chuongpl/application_service/features/application/ApplicationService.java \
        application_service/src/test/
git commit -m "feat(application_service): enrich ApplicationResponse with job snapshot fields"
```

---

## Task 2: GET /api/applications/by-job/{jobId}/mine

**Files:**
- Modify: `application_service/.../features/application/ApplicationController.java`
- Modify: `application_service/.../features/application/ApplicationService.java`
- Modify: `application_service/.../features/application/ApplicationRepository.java`

- [ ] **Step 1: Add repository method**

In `ApplicationRepository.java`, add:
```java
java.util.Optional<Application> findByCandidateIdAndJobIdAndDeletedFalse(
        String candidateId, String jobId);
```

(May already exist — check first. If it does, skip this step.)

- [ ] **Step 2: Add service method to ApplicationService.java**

```java
public vn.chuongpl.application_service.dtos.response.ApplicationResponse getMyApplicationForJob(
        String candidateId, String jobId) {
    Application app = applicationRepository
            .findByCandidateIdAndJobIdAndDeletedFalse(candidateId, jobId)
            .orElseThrow(() -> new vn.chuongpl.application_service.exception.AppException(
                    vn.chuongpl.application_service.enums.ErrorCode.APPLICATION_NOT_FOUND));
    return buildBasicResponse(app);
}
```

Where `buildBasicResponse(app)` is the existing method used in `getById()` for candidates — find this method by reading ApplicationService.java and reuse it.

- [ ] **Step 3: Add endpoint to ApplicationController.java**

```java
@GetMapping("/by-job/{jobId}/mine")
@PreAuthorize("hasRole('CANDIDATE')")
public vn.chuongpl.application_service.dtos.ApiResponse<
        vn.chuongpl.application_service.dtos.response.ApplicationResponse> getMyApplicationForJob(
        @PathVariable String jobId,
        @org.springframework.security.core.annotation.AuthenticationPrincipal String userId) {
    return vn.chuongpl.application_service.dtos.ApiResponse
            .<vn.chuongpl.application_service.dtos.response.ApplicationResponse>builder()
            .data(applicationService.getMyApplicationForJob(userId, jobId))
            .build();
}
```

**Note:** `userId` here is the candidateId passed by the gateway. If application_service uses a separate lookup (userId → candidateId), adapt accordingly by reading how other CANDIDATE endpoints handle the userId-to-candidateId mapping in ApplicationService.

- [ ] **Step 4: Compile check**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/application_service && mvn compile -q && echo "OK"
```
Expected: `OK`

- [ ] **Step 5: Commit**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add application_service/src/main/java/vn/chuongpl/application_service/
git commit -m "feat(application_service): add GET /by-job/{jobId}/mine endpoint"
```

---

## Task 3: Related Jobs Endpoint in job_service

**Files:**
- Modify: `job_service/.../features/job/JobRepository.java`
- Modify: `job_service/.../features/job/JobService.java`
- Modify: `job_service/.../features/job/JobController.java`
- Create: `job_service/src/test/.../service/JobServiceRelatedTest.java`

- [ ] **Step 1: Add repository method**

Read `job_service/src/main/java/vn/chuongpl/job_service/features/job/JobRepository.java`.

Add:
```java
// Find active jobs sharing skills with target job, excluding target job itself
java.util.List<Job> findTop5ByStatusAndSkillsInAndIdNotAndDeletedFalse(
        vn.chuongpl.job_service.enums.JobStatus status,
        java.util.List<String> skills,
        String excludeId);
```

- [ ] **Step 2: Write failing test**

```java
package vn.chuongpl.job_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.chuongpl.job_service.dtos.response.JobResponse;
import vn.chuongpl.job_service.enums.JobStatus;
import vn.chuongpl.job_service.exception.AppException;
import vn.chuongpl.job_service.features.job.Job;
import vn.chuongpl.job_service.features.job.JobRepository;
import vn.chuongpl.job_service.features.job.JobService;
import vn.chuongpl.job_service.integration.elasticsearch.JobIndexService;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JobServiceRelatedTest {
    @Mock JobRepository jobRepository;
    @Mock JobIndexService jobIndexService;
    @InjectMocks JobService jobService;

    @Test
    void getRelatedJobs_shouldReturn5JobsSharingSkills() {
        Job target = Job.builder().id("j1").skills(List.of("Java", "Spring")).status(JobStatus.ACTIVE).deleted(false).build();
        Job related = Job.builder().id("j2").title("Backend Dev").skills(List.of("Java")).status(JobStatus.ACTIVE).deleted(false).build();

        when(jobRepository.findByIdAndDeletedFalse("j1")).thenReturn(Optional.of(target));
        when(jobRepository.findTop5ByStatusAndSkillsInAndIdNotAndDeletedFalse(
                JobStatus.ACTIVE, List.of("Java", "Spring"), "j1"))
                .thenReturn(List.of(related));

        List<JobResponse> result = jobService.getRelatedJobs("j1");

        assertEquals(1, result.size());
        assertEquals("j2", result.get(0).getId());
    }

    @Test
    void getRelatedJobs_shouldThrowWhenJobNotFound() {
        when(jobRepository.findByIdAndDeletedFalse("x")).thenReturn(Optional.empty());

        assertThrows(AppException.class, () -> jobService.getRelatedJobs("x"));
    }
}
```

- [ ] **Step 3: Run tests — expect FAIL**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/job_service
mvn test -Dtest=JobServiceRelatedTest -q 2>&1 | grep -E "Tests run|FAIL|ERROR"
```
Expected: compile error or failure — method doesn't exist

- [ ] **Step 4: Add getRelatedJobs to JobService.java**

Read `job_service/src/main/java/vn/chuongpl/job_service/features/job/JobService.java` to find the existing `getJobById` method and the mapper pattern. Add:

```java
public java.util.List<vn.chuongpl.job_service.dtos.response.JobResponse> getRelatedJobs(String jobId) {
    Job target = jobRepository.findByIdAndDeletedFalse(jobId)
            .orElseThrow(() -> new vn.chuongpl.job_service.exception.AppException(
                    vn.chuongpl.job_service.enums.ErrorCode.JOB_NOT_FOUND));
    java.util.List<String> skills = target.getSkills();
    if (skills == null || skills.isEmpty()) return java.util.List.of();
    return jobRepository.findTop5ByStatusAndSkillsInAndIdNotAndDeletedFalse(
                    vn.chuongpl.job_service.enums.JobStatus.ACTIVE, skills, jobId)
            .stream()
            .map(jobMapper::toJobResponse)  // use existing mapper field name
            .toList();
}
```

**Note:** Read JobService.java to find the actual mapper field name (likely `jobMapper` or injected via constructor). Replace `jobMapper::toJobResponse` with the correct mapper call.

- [ ] **Step 5: Add endpoint to JobController.java**

```java
@GetMapping("/{id}/related")
public vn.chuongpl.job_service.dtos.ApiResponse<
        java.util.List<vn.chuongpl.job_service.dtos.response.JobResponse>> getRelatedJobs(
        @PathVariable String id) {
    return vn.chuongpl.job_service.dtos.ApiResponse
            .<java.util.List<vn.chuongpl.job_service.dtos.response.JobResponse>>builder()
            .data(jobService.getRelatedJobs(id))
            .build();
}
```

- [ ] **Step 6: Run tests — expect PASS**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/job_service
mvn test -Dtest=JobServiceRelatedTest -q 2>&1 | grep -E "Tests run|BUILD"
```
Expected:
```
Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

- [ ] **Step 7: Update gateway public routes**

In `api-gateway/src/main/resources/application.yaml`, add to `app.public-routes`:
```yaml
    - method: GET
      path: /job/api/jobs/*/related
```

- [ ] **Step 8: Commit**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add job_service/src/main/java/vn/chuongpl/job_service/features/job/ \
        job_service/src/test/ \
        api-gateway/src/main/resources/application.yaml
git commit -m "feat(job_service): add GET /{id}/related endpoint (2 tests passing)"
```

---

## Task 4: Public Home Aggregates in job_service

**Files:**
- Create: `job_service/.../features/job/HomeService.java`
- Create: `job_service/.../features/job/HomeController.java`
- Create: `job_service/.../dtos/response/HomeStatsResponse.java`
- Create: `job_service/.../dtos/response/JobCategoryResponse.java`
- Create: `job_service/src/test/.../service/HomeServiceTest.java`

- [ ] **Step 1: Check if Redis/Cache is configured in job_service**

Read `job_service/src/main/resources/application.yaml`. If `spring.cache` or `spring.data.redis` is not configured, add:
```yaml
spring:
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      password: ${REDIS_PASSWORD:}
  cache:
    type: redis
    redis:
      time-to-live: 600000   # 10 minutes
```

Also read `job_service/pom.xml` — if `spring-boot-starter-data-redis` and `spring-boot-starter-cache` are missing, add them:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-cache</artifactId>
</dependency>
```

And add `@EnableCaching` to the main application class (`JobServiceApplication.java`).

- [ ] **Step 2: Create HomeStatsResponse.java**

```java
package vn.chuongpl.job_service.dtos.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class HomeStatsResponse {
    long openJobCount;
    long hiringCompanyCount;
    long remoteJobCount;
    String avgResponseTime;  // static "24h"
}
```

- [ ] **Step 3: Create JobCategoryResponse.java**

```java
package vn.chuongpl.job_service.dtos.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class JobCategoryResponse {
    String name;
    long jobCount;
}
```

- [ ] **Step 4: Write failing tests for HomeService**

```java
package vn.chuongpl.job_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.chuongpl.job_service.dtos.response.HomeStatsResponse;
import vn.chuongpl.job_service.dtos.response.JobCategoryResponse;
import vn.chuongpl.job_service.dtos.response.JobResponse;
import vn.chuongpl.job_service.enums.JobStatus;
import vn.chuongpl.job_service.enums.JobType;
import vn.chuongpl.job_service.features.job.HomeService;
import vn.chuongpl.job_service.features.job.Job;
import vn.chuongpl.job_service.features.job.JobMapper;
import vn.chuongpl.job_service.features.job.JobRepository;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HomeServiceTest {
    @Mock JobRepository jobRepository;
    @Mock JobMapper jobMapper;
    @InjectMocks HomeService homeService;

    @Test
    void getStats_shouldReturnCountsFromRepository() {
        when(jobRepository.countByStatusAndDeletedFalse(JobStatus.ACTIVE)).thenReturn(100L);
        when(jobRepository.countDistinctCompanyByStatusAndDeletedFalse(JobStatus.ACTIVE)).thenReturn(30L);
        when(jobRepository.countByStatusAndJobTypeAndDeletedFalse(JobStatus.ACTIVE, JobType.REMOTE)).thenReturn(15L);

        HomeStatsResponse stats = homeService.getStats();

        assertEquals(100L, stats.getOpenJobCount());
        assertEquals(30L, stats.getHiringCompanyCount());
        assertEquals(15L, stats.getRemoteJobCount());
        assertEquals("24h", stats.getAvgResponseTime());
    }

    @Test
    void getFeaturedJobs_shouldReturnUpTo6ActiveJobs() {
        Job j = Job.builder().id("j1").status(JobStatus.ACTIVE).deleted(false).build();
        when(jobRepository.findTop6ByStatusAndDeletedFalseOrderByCreatedAtDesc(JobStatus.ACTIVE))
                .thenReturn(List.of(j));
        when(jobMapper.toJobResponse(j)).thenReturn(JobResponse.builder().id("j1").build());

        List<JobResponse> result = homeService.getFeaturedJobs();

        assertEquals(1, result.size());
        assertEquals("j1", result.get(0).getId());
    }
}
```

- [ ] **Step 5: Run tests — expect FAIL**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/job_service
mvn test -Dtest=HomeServiceTest -q 2>&1 | grep -E "Tests run|FAIL|ERROR"
```
Expected: compile error — HomeService doesn't exist

- [ ] **Step 6: Add repository methods to JobRepository.java**

```java
long countByStatusAndDeletedFalse(vn.chuongpl.job_service.enums.JobStatus status);
long countByStatusAndJobTypeAndDeletedFalse(
        vn.chuongpl.job_service.enums.JobStatus status,
        vn.chuongpl.job_service.enums.JobType jobType);
java.util.List<Job> findTop6ByStatusAndDeletedFalseOrderByCreatedAtDesc(
        vn.chuongpl.job_service.enums.JobStatus status);

// For distinct company count — use MongoTemplate in HomeService instead of repository
// (Spring Data can't do count(distinct) via method names alone)
```

- [ ] **Step 7: Create HomeService.java**

```java
package vn.chuongpl.job_service.features.job;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;
import vn.chuongpl.job_service.dtos.response.HomeStatsResponse;
import vn.chuongpl.job_service.dtos.response.JobCategoryResponse;
import vn.chuongpl.job_service.dtos.response.JobResponse;
import vn.chuongpl.job_service.enums.JobStatus;
import vn.chuongpl.job_service.enums.JobType;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class HomeService {
    JobRepository jobRepository;
    MongoTemplate mongoTemplate;
    JobMapper jobMapper;

    @Cacheable(value = "home-stats")
    public HomeStatsResponse getStats() {
        long openJobs = jobRepository.countByStatusAndDeletedFalse(JobStatus.ACTIVE);
        long remoteJobs = jobRepository.countByStatusAndJobTypeAndDeletedFalse(
                JobStatus.ACTIVE, JobType.REMOTE);
        // distinct company count via MongoTemplate
        long companies = mongoTemplate.query(Job.class)
                .distinct("company")
                .matching(org.springframework.data.mongodb.core.query.Criteria
                        .where("status").is(JobStatus.ACTIVE)
                        .and("deleted").is(false))
                .as(String.class)
                .all().size();
        return HomeStatsResponse.builder()
                .openJobCount(openJobs)
                .hiringCompanyCount(companies)
                .remoteJobCount(remoteJobs)
                .avgResponseTime("24h")
                .build();
    }

    @Cacheable(value = "home-categories")
    public List<JobCategoryResponse> getCategories() {
        return Arrays.stream(JobType.values())
                .map(type -> JobCategoryResponse.builder()
                        .name(type.name())
                        .jobCount(jobRepository.countByStatusAndJobTypeAndDeletedFalse(
                                JobStatus.ACTIVE, type))
                        .build())
                .toList();
    }

    @Cacheable(value = "home-featured-jobs")
    public List<JobResponse> getFeaturedJobs() {
        return jobRepository.findTop6ByStatusAndDeletedFalseOrderByCreatedAtDesc(JobStatus.ACTIVE)
                .stream().map(jobMapper::toJobResponse).toList();
    }

    public List<String> getResources() {
        return List.of(
            "Resume Writing Tips for 2026",
            "How to Ace a Technical Interview",
            "Salary Negotiation Guide",
            "Top Skills Employers Want in 2026"
        );
    }
}
```

**Note:** `JobMapper` may be a MapStruct interface. Read `job_service/src/main/java/vn/chuongpl/job_service/features/job/` to find the actual mapper class/interface name and adjust. If `JobResponse.builder()` is not available (no `@Builder` on `JobResponse`), use the mapper call from existing `JobService` as the pattern.

- [ ] **Step 8: Run tests — expect PASS**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/job_service
mvn test -Dtest=HomeServiceTest -q 2>&1 | grep -E "Tests run|BUILD"
```
Expected:
```
Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

- [ ] **Step 9: Create HomeController.java**

```java
package vn.chuongpl.job_service.features.job;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;
import vn.chuongpl.job_service.dtos.ApiResponse;
import vn.chuongpl.job_service.dtos.response.HomeStatsResponse;
import vn.chuongpl.job_service.dtos.response.JobCategoryResponse;
import vn.chuongpl.job_service.dtos.response.JobResponse;

import java.util.List;

@RestController
@RequestMapping("/api/home")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class HomeController {
    HomeService homeService;

    @GetMapping("/stats")
    public ApiResponse<HomeStatsResponse> getStats() {
        return ApiResponse.<HomeStatsResponse>builder().data(homeService.getStats()).build();
    }

    @GetMapping("/categories")
    public ApiResponse<List<JobCategoryResponse>> getCategories() {
        return ApiResponse.<List<JobCategoryResponse>>builder().data(homeService.getCategories()).build();
    }

    @GetMapping("/featured-jobs")
    public ApiResponse<List<JobResponse>> getFeaturedJobs() {
        return ApiResponse.<List<JobResponse>>builder().data(homeService.getFeaturedJobs()).build();
    }

    @GetMapping("/resources")
    public ApiResponse<List<String>> getResources() {
        return ApiResponse.<List<String>>builder().data(homeService.getResources()).build();
    }
}
```

- [ ] **Step 10: Update gateway public routes**

In `api-gateway/src/main/resources/application.yaml`, add to `app.public-routes`:
```yaml
    - method: GET
      path: /job/api/home/**
```

- [ ] **Step 11: Full test run for job_service**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/job_service
mvn test -q 2>&1 | grep -E "Tests run|BUILD"
```
Expected: all tests pass, BUILD SUCCESS

- [ ] **Step 12: Commit**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add job_service/ api-gateway/src/main/resources/application.yaml
git commit -m "feat(job_service): add HomeController (stats, categories, featured-jobs) with Redis caching"
```

---

## Task 5: AI Engine — Publish Job Suggestions Event

**Files:**
- Modify: `ai_engine_service/.../features/analysis/AnalysisService.java`
- Read first: `ai_engine_service/src/main/java/vn/chuongpl/ai_engine_service/` to understand RabbitMQ setup

- [ ] **Step 1: Read existing ai_engine_service RabbitMQ config**

```bash
find /home/chuongpl/projects/smartCV/smartCv-be/ai_engine_service/src/main/java -name "*.java" | xargs grep -l "RabbitMQ\|AmqpTemplate\|exchange\|queue" 2>/dev/null
```

Read those files to understand existing RabbitMQ setup (exchange name, template injection pattern).

- [ ] **Step 2: Create JobSuggestionsPublisher in ai_engine_service**

In `ai_engine_service/src/main/java/vn/chuongpl/ai_engine_service/integration/` (or wherever publishers live), create:

```java
package vn.chuongpl.ai_engine_service.integration;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class JobSuggestionsPublisher {
    private final RabbitTemplate rabbitTemplate;

    private static final String EXCHANGE = "job.suggestions.exchange";
    private static final String ROUTING_KEY = "job.suggestions";

    public void publish(String userId, List<Map<String, Object>> suggestions) {
        try {
            Map<String, Object> message = Map.of("userId", userId, "suggestions", suggestions);
            rabbitTemplate.convertAndSend(EXCHANGE, ROUTING_KEY, message);
            log.info("Published job suggestions for userId={}, count={}", userId, suggestions.size());
        } catch (Exception e) {
            log.warn("Failed to publish job suggestions for userId={}: {}", userId, e.getMessage());
        }
    }
}
```

**Note:** The exact message structure must match `JobSuggestionsMessage` in user-service (`userId`, `suggestions` list). If ai_engine_service uses a different serialization format, align both sides.

- [ ] **Step 3: Inject publisher and call after recommend()**

Read `ai_engine_service/src/main/java/vn/chuongpl/ai_engine_service/features/analysis/AnalysisService.java`.

Find the `recommend()` method. After it computes the job list, add:
```java
// Publish suggestions to user-service for persistent cache
try {
    // Convert recommendations to suggestion message format
    List<Map<String, Object>> suggestionData = recommendations.stream()
            .map(r -> Map.<String, Object>of(
                    "jobId", r.getJobId(),
                    "matchScore", r.getMatchScore(),
                    "matchReason", r.getMatchReason(),
                    "alignedSkills", r.getAlignedSkills(),
                    "suggestedAt", java.time.LocalDateTime.now().toString()))
            .toList();
    jobSuggestionsPublisher.publish(userId, suggestionData);
} catch (Exception e) {
    log.warn("Failed to publish suggestions: {}", e.getMessage());
}
```

Inject `JobSuggestionsPublisher jobSuggestionsPublisher` as a field.

**Note:** The exact field names depend on the actual recommendation response DTO in ai_engine_service. Read the `recommend()` method return type to get correct field names.

- [ ] **Step 4: Add job.suggestions exchange to ai_engine_service RabbitMQ config**

Read the existing RabbitMQ config in ai_engine_service. Add:
```java
@Bean
public org.springframework.amqp.core.DirectExchange jobSuggestionsExchange() {
    return new org.springframework.amqp.core.DirectExchange("job.suggestions.exchange");
}
```

- [ ] **Step 5: Compile check**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/ai_engine_service && mvn compile -q && echo "OK"
```
Expected: `OK`

- [ ] **Step 6: Commit**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add ai_engine_service/
git commit -m "feat(ai_engine_service): publish job suggestions event after recommend()"
```

---

## Task 6: Final Integration Check

- [ ] **Step 1: Run all service tests**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
for service in user-service application_service job_service ai_engine_service; do
  echo "=== $service ==="
  cd $service && mvn test -q 2>&1 | grep -E "Tests run|BUILD" && cd ..
done
```
Expected: all services report `BUILD SUCCESS`

- [ ] **Step 2: Verify gateway config has all new public routes**

```bash
grep -A2 "path:" /home/chuongpl/projects/smartCV/smartCv-be/api-gateway/src/main/resources/application.yaml | grep -E "companies|home|related|by-job"
```
Expected output includes:
```
path: /user/api/companies
path: /user/api/companies/**
path: /job/api/home/**
path: /job/api/jobs/*/related
```

- [ ] **Step 3: Commit gateway changes if not already committed**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add api-gateway/src/main/resources/application.yaml
git diff --cached --name-only | grep gateway && git commit -m "chore(api-gateway): finalize public route whitelist for P0+P1+P2 features" || echo "Gateway already committed"
```

- [ ] **Step 4: Final commit for the plan files themselves**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add plans/
git commit -m "docs: add implementation plans for web-candidate missing APIs (3 plans)"
```
