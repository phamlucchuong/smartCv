# Job Service — Home Aggregates & Batch Endpoints Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `top-companies`, `resources`, `testimonials`, `faqs` to the home API and two new job endpoints (`/jobs/batch`, `/jobs/by-recruiter/{id}`) required by user-service.

**Architecture:** All new logic lives in `HomeService` (existing) and `JobService` (existing). No new collections or Spring beans. Static content (resources/testimonials/faqs) is hardcoded in the service layer. `top-companies` uses a MongoDB aggregation on the existing `jobs` collection.

**Tech Stack:** Spring Boot 3.5, MongoDB (MongoTemplate aggregation), Mockito

**Prerequisite:** None. This plan is independent.

---

## File Map

**Create:**
- `features/home/TopCompanyResponse.java` — DTO for top company aggregate result
- `features/home/ResourceItem.java` — static content DTO
- `features/home/TestimonialItem.java` — static content DTO
- `features/home/FaqItem.java` — static content DTO
- `src/test/.../features/home/HomeAggregatesServiceTest.java`
- `src/test/.../features/job/JobBatchServiceTest.java`

**Modify:**
- `features/home/HomeService.java` — add `getTopCompanies()`, `getResources()`, `getTestimonials()`, `getFaqs()`
- `features/home/HomeController.java` — add 4 new endpoints
- `features/job/JobRepository.java` — add 2 new query methods
- `features/job/JobService.java` — add `getJobsByIds()`, `getActiveJobsByRecruiter()`
- `features/job/JobController.java` — add `/batch` and `/by-recruiter/{id}` endpoints

All paths relative to `job_service/src/main/java/vn/chuongpl/job_service/`.

---

## Task 1: New DTOs

**Files:**
- Create: `features/home/TopCompanyResponse.java`
- Create: `features/home/ResourceItem.java`
- Create: `features/home/TestimonialItem.java`
- Create: `features/home/FaqItem.java`

- [ ] **Step 1: Create TopCompanyResponse.java**

```java
package vn.chuongpl.job_service.features.home;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class TopCompanyResponse {
    String recruiterId;
    String name;
    String location;
    long activeJobCount;
}
```

- [ ] **Step 2: Create ResourceItem.java**

```java
package vn.chuongpl.job_service.features.home;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ResourceItem {
    String id;
    String title;
    String description;
    String url;
    String category;
}
```

- [ ] **Step 3: Create TestimonialItem.java**

```java
package vn.chuongpl.job_service.features.home;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TestimonialItem {
    String id;
    String name;
    String role;
    String company;
    String quote;
}
```

- [ ] **Step 4: Create FaqItem.java**

```java
package vn.chuongpl.job_service.features.home;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class FaqItem {
    String id;
    String question;
    String answer;
    String category;
}
```

- [ ] **Step 5: Compile check**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/job_service && ./mvnw compile -q && echo "OK"
```
Expected: `OK`

- [ ] **Step 6: Commit**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add job_service/src/main/java/vn/chuongpl/job_service/features/home/TopCompanyResponse.java \
        job_service/src/main/java/vn/chuongpl/job_service/features/home/ResourceItem.java \
        job_service/src/main/java/vn/chuongpl/job_service/features/home/TestimonialItem.java \
        job_service/src/main/java/vn/chuongpl/job_service/features/home/FaqItem.java
git commit -m "chore(job-service): add home aggregate DTOs"
```

---

## Task 2: HomeService — top-companies (TDD)

**Files:**
- Modify: `features/home/HomeService.java`
- Create: `src/test/java/vn/chuongpl/job_service/features/home/HomeAggregatesServiceTest.java`

- [ ] **Step 1: Write failing test**

```java
package vn.chuongpl.job_service.features.home;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import vn.chuongpl.job_service.features.job.JobMapper;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HomeAggregatesServiceTest {
    @Mock MongoTemplate mongoTemplate;
    @Mock JobMapper jobMapper;
    @InjectMocks HomeService homeService;

    @Test
    void getTopCompanies_shouldReturnAggregatedResults() {
        TopCompanyResponse company = new TopCompanyResponse();
        company.setRecruiterId("r1");
        company.setName("TechCorp");
        company.setLocation("Hanoi");
        company.setActiveJobCount(5);

        @SuppressWarnings("unchecked")
        AggregationResults<TopCompanyResponse> mockResults = mock(AggregationResults.class);
        when(mockResults.getMappedResults()).thenReturn(List.of(company));
        when(mongoTemplate.aggregate(any(Aggregation.class), eq("jobs"), eq(TopCompanyResponse.class)))
                .thenReturn(mockResults);

        List<TopCompanyResponse> result = homeService.getTopCompanies();

        assertEquals(1, result.size());
        assertEquals("TechCorp", result.get(0).getName());
        assertEquals("r1", result.get(0).getRecruiterId());
        assertEquals(5L, result.get(0).getActiveJobCount());
    }
}
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/job_service
./mvnw test -Dtest=HomeAggregatesServiceTest -q 2>&1 | grep -E "Tests run|FAIL|ERROR|BUILD"
```
Expected: compilation error or test failure — `getTopCompanies()` not yet defined.

- [ ] **Step 3: Add `getTopCompanies()` to HomeService.java**

Add import at the top of HomeService (after existing imports):
```java
import vn.chuongpl.job_service.features.home.TopCompanyResponse;
```

Add method inside `HomeService` class body, after `getFeaturedJobs()`:
```java
@Cacheable(value = "home:top-companies", unless = "#result == null")
public List<TopCompanyResponse> getTopCompanies() {
    Aggregation agg = Aggregation.newAggregation(
            Aggregation.match(Criteria.where("status").is(JobStatus.ACTIVE).and("deleted").is(false)),
            Aggregation.group("recruiterId")
                    .count().as("activeJobCount")
                    .first("company").as("name")
                    .first("location").as("location"),
            Aggregation.project("activeJobCount", "name", "location").and("_id").as("recruiterId"),
            Aggregation.sort(Sort.by(Sort.Direction.DESC, "activeJobCount")),
            Aggregation.limit(8)
    );
    AggregationResults<TopCompanyResponse> results =
            mongoTemplate.aggregate(agg, "jobs", TopCompanyResponse.class);
    return results.getMappedResults();
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/job_service
./mvnw test -Dtest=HomeAggregatesServiceTest -q 2>&1 | grep -E "Tests run|BUILD"
```
Expected:
```
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

- [ ] **Step 5: Commit**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add job_service/src/main/java/vn/chuongpl/job_service/features/home/HomeService.java \
        job_service/src/test/java/vn/chuongpl/job_service/features/home/HomeAggregatesServiceTest.java
git commit -m "feat(job-service): add getTopCompanies aggregation (1 test passing)"
```

---

## Task 3: HomeService — static content (TDD)

**Files:**
- Modify: `features/home/HomeService.java`
- Modify: `src/test/java/.../features/home/HomeAggregatesServiceTest.java`

- [ ] **Step 1: Add 3 tests to HomeAggregatesServiceTest.java**

Add these 3 test methods inside the `HomeAggregatesServiceTest` class, after `getTopCompanies_shouldReturnAggregatedResults`:

```java
@Test
void getResources_shouldReturnNonEmptyList() {
    List<ResourceItem> result = homeService.getResources();
    assertFalse(result.isEmpty());
    assertNotNull(result.get(0).getTitle());
    assertNotNull(result.get(0).getUrl());
}

@Test
void getTestimonials_shouldReturnNonEmptyList() {
    List<TestimonialItem> result = homeService.getTestimonials();
    assertFalse(result.isEmpty());
    assertNotNull(result.get(0).getName());
    assertNotNull(result.get(0).getQuote());
}

@Test
void getFaqs_shouldReturnNonEmptyList() {
    List<FaqItem> result = homeService.getFaqs();
    assertFalse(result.isEmpty());
    assertNotNull(result.get(0).getQuestion());
    assertNotNull(result.get(0).getAnswer());
}
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/job_service
./mvnw test -Dtest=HomeAggregatesServiceTest -q 2>&1 | grep -E "Tests run|FAIL|ERROR|BUILD"
```
Expected: FAIL on the 3 new tests.

- [ ] **Step 3: Add static content methods to HomeService.java**

Add these private static final fields near the top of HomeService (after field declarations):
```java
private static final List<ResourceItem> STATIC_RESOURCES = List.of(
        new ResourceItem("1", "How to Write a Winning CV", "Practical tips to make your CV stand out to recruiters.", "/resources/cv-guide", "guide"),
        new ResourceItem("2", "Top 10 Interview Questions", "Prepare for the most common questions and nail your next interview.", "/resources/interview-prep", "article"),
        new ResourceItem("3", "Salary Negotiation Tips", "How to negotiate your offer confidently and professionally.", "/resources/salary-negotiation", "guide"),
        new ResourceItem("4", "Remote Work Best Practices", "Stay productive and visible when working from home.", "/resources/remote-work", "article")
);

private static final List<TestimonialItem> STATIC_TESTIMONIALS = List.of(
        new TestimonialItem("1", "Nguyen Van A", "Software Engineer", "TechCorp", "SmartCV helped me land my dream job in just 3 weeks. The AI matching is spot on!"),
        new TestimonialItem("2", "Tran Thi B", "Product Manager", "StartupXYZ", "I uploaded my CV and had interview invitations within days. Highly recommend!"),
        new TestimonialItem("3", "Le Van C", "Data Analyst", "FinanceGroup", "The job suggestions were surprisingly accurate for my background. Great platform.")
);

private static final List<FaqItem> STATIC_FAQS = List.of(
        new FaqItem("1", "Is SmartCV free to use for job seekers?", "Yes, creating an account and applying for jobs is completely free for candidates.", "general"),
        new FaqItem("2", "How does the AI job matching work?", "Our AI analyzes your CV skills and experience to rank jobs by relevance, so you see the best matches first.", "ai"),
        new FaqItem("3", "Can I upload multiple CVs?", "Yes, you can upload and manage multiple CV versions and choose which one to send per application.", "cv"),
        new FaqItem("4", "How do I withdraw a job application?", "Go to My Applications, find the application, and click Withdraw. This is available while the application is still Pending or Under Review.", "applications")
);
```

Add these methods inside `HomeService` class body, after `getTopCompanies()`:
```java
public List<ResourceItem> getResources() {
    return STATIC_RESOURCES;
}

public List<TestimonialItem> getTestimonials() {
    return STATIC_TESTIMONIALS;
}

public List<FaqItem> getFaqs() {
    return STATIC_FAQS;
}
```

Also add these imports at the top of HomeService:
```java
import vn.chuongpl.job_service.features.home.ResourceItem;
import vn.chuongpl.job_service.features.home.TestimonialItem;
import vn.chuongpl.job_service.features.home.FaqItem;
```

- [ ] **Step 4: Run tests — expect PASS (4 total)**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/job_service
./mvnw test -Dtest=HomeAggregatesServiceTest -q 2>&1 | grep -E "Tests run|BUILD"
```
Expected:
```
Tests run: 4, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

- [ ] **Step 5: Commit**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add job_service/src/main/java/vn/chuongpl/job_service/features/home/HomeService.java \
        job_service/src/test/java/vn/chuongpl/job_service/features/home/HomeAggregatesServiceTest.java
git commit -m "feat(job-service): add static resources, testimonials, faqs to HomeService (4 tests passing)"
```

---

## Task 4: HomeController — 4 new endpoints

**Files:**
- Modify: `features/home/HomeController.java`

- [ ] **Step 1: Add imports and 4 new methods to HomeController.java**

Add these imports at the top of HomeController (after existing imports):
```java
import vn.chuongpl.job_service.features.home.TopCompanyResponse;
import vn.chuongpl.job_service.features.home.ResourceItem;
import vn.chuongpl.job_service.features.home.TestimonialItem;
import vn.chuongpl.job_service.features.home.FaqItem;
```

Add these 4 methods inside the `HomeController` class body, after `getFeaturedJobs()`:
```java
@GetMapping("/top-companies")
public ApiResponse<List<TopCompanyResponse>> getTopCompanies() {
    return ApiResponse.<List<TopCompanyResponse>>builder().data(homeService.getTopCompanies()).build();
}

@GetMapping("/resources")
public ApiResponse<List<ResourceItem>> getResources() {
    return ApiResponse.<List<ResourceItem>>builder().data(homeService.getResources()).build();
}

@GetMapping("/testimonials")
public ApiResponse<List<TestimonialItem>> getTestimonials() {
    return ApiResponse.<List<TestimonialItem>>builder().data(homeService.getTestimonials()).build();
}

@GetMapping("/faqs")
public ApiResponse<List<FaqItem>> getFaqs() {
    return ApiResponse.<List<FaqItem>>builder().data(homeService.getFaqs()).build();
}
```

Also add `import java.util.List;` if not already present.

- [ ] **Step 2: Compile check**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/job_service && ./mvnw compile -q && echo "OK"
```
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add job_service/src/main/java/vn/chuongpl/job_service/features/home/HomeController.java
git commit -m "feat(job-service): add home top-companies, resources, testimonials, faqs endpoints"
```

---

## Task 5: JobService — batch and recruiter endpoints (TDD)

**Files:**
- Modify: `features/job/JobRepository.java`
- Modify: `features/job/JobService.java`
- Create: `src/test/java/vn/chuongpl/job_service/features/job/JobBatchServiceTest.java`

- [ ] **Step 1: Write failing tests**

```java
package vn.chuongpl.job_service.features.job;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;
import vn.chuongpl.job_service.dtos.PageResponse;
import vn.chuongpl.job_service.dtos.response.JobResponse;
import vn.chuongpl.job_service.enums.JobStatus;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import vn.chuongpl.job_service.integration.elasticsearch.JobIndexService;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JobBatchServiceTest {
    @Mock JobRepository jobRepository;
    @Mock JobIndexService jobIndexService;
    @Mock JobMapper jobMapper;
    @Mock RabbitTemplate rabbitTemplate;
    @InjectMocks JobService jobService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(jobService, "defaultPageSize", 10);
    }

    @Test
    void getJobsByIds_shouldReturnMappedResponses() {
        Job job1 = Job.builder().id("j1").status(JobStatus.ACTIVE).build();
        Job job2 = Job.builder().id("j2").status(JobStatus.ACTIVE).build();
        JobResponse resp1 = new JobResponse(); resp1.setId("j1");
        JobResponse resp2 = new JobResponse(); resp2.setId("j2");
        when(jobRepository.findAllByIdInAndDeletedFalse(List.of("j1", "j2"))).thenReturn(List.of(job1, job2));
        when(jobMapper.toJobResponse(job1)).thenReturn(resp1);
        when(jobMapper.toJobResponse(job2)).thenReturn(resp2);

        List<JobResponse> result = jobService.getJobsByIds(List.of("j1", "j2"));

        assertEquals(2, result.size());
        assertEquals("j1", result.get(0).getId());
        assertEquals("j2", result.get(1).getId());
    }

    @Test
    void getJobsByIds_shouldReturnEmptyListForEmptyInput() {
        List<JobResponse> result = jobService.getJobsByIds(List.of());

        assertTrue(result.isEmpty());
        verifyNoInteractions(jobRepository);
    }

    @Test
    void getActiveJobsByRecruiter_shouldReturnOnlyActiveJobsForRecruiter() {
        Job job1 = Job.builder().id("j1").recruiterId("r1").status(JobStatus.ACTIVE).build();
        JobResponse resp1 = new JobResponse(); resp1.setId("j1");
        when(jobRepository.findTop20ByRecruiterIdAndStatusAndDeletedFalse("r1", JobStatus.ACTIVE))
                .thenReturn(List.of(job1));
        when(jobMapper.toJobResponse(job1)).thenReturn(resp1);

        List<JobResponse> result = jobService.getActiveJobsByRecruiter("r1");

        assertEquals(1, result.size());
        assertEquals("j1", result.get(0).getId());
    }
}
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/job_service
./mvnw test -Dtest=JobBatchServiceTest -q 2>&1 | grep -E "Tests run|FAIL|ERROR|BUILD"
```
Expected: compilation error — methods not yet defined.

- [ ] **Step 3: Add repository methods to JobRepository.java**

Add these two methods to the `JobRepository` interface body, after existing methods:
```java
List<Job> findAllByIdInAndDeletedFalse(List<String> ids);

List<Job> findTop20ByRecruiterIdAndStatusAndDeletedFalse(String recruiterId, JobStatus status);
```

- [ ] **Step 4: Add service methods to JobService.java**

Add these two methods inside the `JobService` class body, after `getRelatedJobs()`:
```java
public List<JobResponse> getJobsByIds(List<String> ids) {
    if (ids == null || ids.isEmpty()) return List.of();
    return jobRepository.findAllByIdInAndDeletedFalse(ids).stream()
            .map(jobMapper::toJobResponse)
            .toList();
}

public List<JobResponse> getActiveJobsByRecruiter(String recruiterId) {
    return jobRepository.findTop20ByRecruiterIdAndStatusAndDeletedFalse(recruiterId, JobStatus.ACTIVE)
            .stream()
            .map(jobMapper::toJobResponse)
            .toList();
}
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/job_service
./mvnw test -Dtest=JobBatchServiceTest -q 2>&1 | grep -E "Tests run|BUILD"
```
Expected:
```
Tests run: 3, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

- [ ] **Step 6: Commit**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add job_service/src/main/java/vn/chuongpl/job_service/features/job/JobRepository.java \
        job_service/src/main/java/vn/chuongpl/job_service/features/job/JobService.java \
        job_service/src/test/java/vn/chuongpl/job_service/features/job/JobBatchServiceTest.java
git commit -m "feat(job-service): add getJobsByIds and getActiveJobsByRecruiter service methods (3 tests passing)"
```

---

## Task 6: JobController — 2 new endpoints

**Files:**
- Modify: `features/job/JobController.java`

- [ ] **Step 1: Add 2 new endpoint methods to JobController.java**

Add these imports at the top of JobController (after existing imports):
```java
import java.util.Arrays;
import java.util.List;
```

Add these 2 methods inside the `JobController` class body, after `getRelatedJobs()`:
```java
@GetMapping("/batch")
public ApiResponse<List<JobResponse>> getJobsByIds(@RequestParam String ids) {
    List<String> idList = ids == null || ids.isBlank()
            ? List.of()
            : Arrays.asList(ids.split(","));
    return ApiResponse.<List<JobResponse>>builder()
            .data(jobService.getJobsByIds(idList))
            .build();
}

@GetMapping("/by-recruiter/{recruiterId}")
public ApiResponse<List<JobResponse>> getByRecruiter(@PathVariable String recruiterId) {
    return ApiResponse.<List<JobResponse>>builder()
            .data(jobService.getActiveJobsByRecruiter(recruiterId))
            .build();
}
```

- [ ] **Step 2: Full compile + all tests pass**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/job_service
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
git add job_service/src/main/java/vn/chuongpl/job_service/features/job/JobController.java
git commit -m "feat(job-service): add /jobs/batch and /jobs/by-recruiter/{id} endpoints (Plan 1 complete)"
```
