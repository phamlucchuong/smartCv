# User Service — Company Directory & Wishlists Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement public Company Directory (reads from Recruiter collection) and Candidate Wishlist (saved jobs) features in `user-service`.

**Architecture:** New `features/company` package exposes read-only company data sourced from `Recruiter` documents. New `features/wishlist` package adds a `wishlists` MongoDB collection. Both features consume job details via a new `integration/job/JobClient` using RestTemplate (same pattern as application_service). Gateway gets new public route whitelist entries.

**Tech Stack:** Spring Boot 3.4.4, MongoDB (MongoTemplate for dynamic company queries), Spring Data MongoDB, Mockito (unit tests), Maven

---

## File Map

**Create (user-service):**
- `integration/job/JobApiResponse.java` — generic response wrapper for HTTP calls to job_service
- `integration/job/JobSummary.java` — lightweight job DTO
- `integration/job/JobClient.java` — RestTemplate client to job_service public endpoints
- `features/company/CompanyResponse.java` — public-facing company DTO (no sensitive recruiter fields)
- `features/company/CompanyService.java` — query logic over RecruiterRepository/MongoTemplate
- `features/company/CompanyController.java` — GET /api/companies, GET /api/companies/{id}
- `features/wishlist/Wishlist.java` — MongoDB document (collection: wishlists)
- `features/wishlist/WishlistRepository.java` — Spring Data repository
- `features/wishlist/WishlistResponse.java` — DTO with joined job details
- `features/wishlist/WishlistService.java` — business logic
- `features/wishlist/WishlistSaveRequest.java` — request DTO
- `features/wishlist/WishlistController.java` — GET/POST/DELETE /api/wishlists
- `src/test/.../service/CompanyServiceTest.java`
- `src/test/.../service/WishlistServiceTest.java`

**Modify:**
- `enums/ErrorCode.java` — add `COMPANY_NOT_FOUND`
- `src/main/resources/application.yaml` — add `integration.job-service-url`
- `api-gateway/src/main/resources/application.yaml` — add public route entries

**Deferred to Plan 3:** `GET /api/companies/{id}/jobs` (needs job_service count endpoint first). `activeJobCount` returns `null` in Plan 1.

All paths below are relative to `user-service/src/main/java/vn/chuongpl/user_service/`.

---

## Task 1: ErrorCode + Config

**Files:**
- Modify: `user-service/src/main/java/vn/chuongpl/user_service/enums/ErrorCode.java`
- Modify: `user-service/src/main/resources/application.yaml`

- [ ] **Step 1: Add COMPANY_NOT_FOUND to ErrorCode.java**

After `RECRUITER_NOT_FOUND(5002, "Recruiter profile not found"),` add:
```java
COMPANY_NOT_FOUND(5003, "Company not found"),
```

- [ ] **Step 2: Add integration block to application.yaml**

At the end of `user-service/src/main/resources/application.yaml`, add:
```yaml
integration:
  job-service-url: ${JOB_SERVICE_URL:http://localhost:8082/job}
```

- [ ] **Step 3: Commit**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add user-service/src/main/java/vn/chuongpl/user_service/enums/ErrorCode.java \
        user-service/src/main/resources/application.yaml
git commit -m "chore(user-service): add COMPANY_NOT_FOUND error code and job-service-url config"
```

---

## Task 2: Job Integration Client

**Files:**
- Create: `user-service/src/main/java/vn/chuongpl/user_service/integration/job/JobApiResponse.java`
- Create: `user-service/src/main/java/vn/chuongpl/user_service/integration/job/JobSummary.java`
- Create: `user-service/src/main/java/vn/chuongpl/user_service/integration/job/JobClient.java`

- [ ] **Step 1: Create JobApiResponse.java**

```java
package vn.chuongpl.user_service.integration.job;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class JobApiResponse<T> {
    private boolean ok;
    private int code;
    private String message;
    private T data;
}
```

- [ ] **Step 2: Create JobSummary.java**

```java
package vn.chuongpl.user_service.integration.job;

import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
public class JobSummary {
    String id;
    String title;
    String company;
    String location;
    Double salaryMin;
    Double salaryMax;
    String jobType;
    String status;
    List<String> skills;
}
```

- [ ] **Step 3: Create JobClient.java**

```java
package vn.chuongpl.user_service.integration.job;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@RequiredArgsConstructor
@Slf4j
public class JobClient {
    private final RestTemplate restTemplate;

    @Value("${integration.job-service-url}")
    private String jobServiceUrl;

    public JobSummary getJobById(String jobId) {
        try {
            var response = restTemplate.exchange(
                    jobServiceUrl + "/api/jobs/" + jobId,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<JobApiResponse<JobSummary>>() {}
            );
            if (response.getBody() != null) {
                return response.getBody().getData();
            }
        } catch (Exception e) {
            log.warn("Failed to fetch job {}: {}", jobId, e.getMessage());
        }
        return null;
    }
}
```

- [ ] **Step 4: Compile check**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/user-service && mvn compile -q
```
Expected: `BUILD SUCCESS`

- [ ] **Step 5: Commit**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add user-service/src/main/java/vn/chuongpl/user_service/integration/job/
git commit -m "feat(user-service): add JobClient for job_service HTTP integration"
```

---

## Task 3: Company Directory — Service (TDD)

**Files:**
- Create: `user-service/src/main/java/vn/chuongpl/user_service/features/company/CompanyResponse.java`
- Create: `user-service/src/main/java/vn/chuongpl/user_service/features/company/CompanyService.java`
- Create: `user-service/src/test/java/vn/chuongpl/user_service/service/CompanyServiceTest.java`

- [ ] **Step 1: Create CompanyResponse.java**

```java
package vn.chuongpl.user_service.features.company;

import lombok.*;
import lombok.experimental.FieldDefaults;
import vn.chuongpl.user_service.features.recruiter.Recruiter;

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
    Integer activeJobCount;  // null until Plan 3 wires job count endpoint

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
                .build();
    }
}
```

- [ ] **Step 2: Create CompanyService.java stub**

```java
package vn.chuongpl.user_service.features.company;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;
import vn.chuongpl.user_service.dtos.PageResponse;
import vn.chuongpl.user_service.features.recruiter.RecruiterRepository;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class CompanyService {
    RecruiterRepository recruiterRepository;
    MongoTemplate mongoTemplate;

    public PageResponse<CompanyResponse> getAll(int page, int size, String query,
                                                 String industry, String companySize, String location) {
        throw new UnsupportedOperationException();
    }

    public CompanyResponse getById(String id) {
        throw new UnsupportedOperationException();
    }
}
```

- [ ] **Step 3: Write failing tests**

```java
package vn.chuongpl.user_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import vn.chuongpl.user_service.dtos.PageResponse;
import vn.chuongpl.user_service.enums.ErrorCode;
import vn.chuongpl.user_service.enums.RecruiterStatus;
import vn.chuongpl.user_service.exception.AppException;
import vn.chuongpl.user_service.features.company.CompanyResponse;
import vn.chuongpl.user_service.features.company.CompanyService;
import vn.chuongpl.user_service.features.recruiter.Recruiter;
import vn.chuongpl.user_service.features.recruiter.RecruiterRepository;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CompanyServiceTest {
    @Mock RecruiterRepository recruiterRepository;
    @Mock MongoTemplate mongoTemplate;
    @InjectMocks CompanyService companyService;

    @Test
    void getAll_shouldReturnPagedApprovedCompanies() {
        Recruiter r = Recruiter.builder().id("r1").companyName("ACME")
                .status(RecruiterStatus.APPROVED).deleted(false).build();
        when(mongoTemplate.find(any(Query.class), eq(Recruiter.class))).thenReturn(List.of(r));
        when(mongoTemplate.count(any(Query.class), eq(Recruiter.class))).thenReturn(1L);

        PageResponse<CompanyResponse> result = companyService.getAll(1, 10, null, null, null, null);

        assertEquals(1, result.getItems().size());
        assertEquals("ACME", result.getItems().get(0).getName());
        assertEquals(1L, result.getTotal());
    }

    @Test
    void getById_shouldThrowWhenRecruiterNotFound() {
        when(recruiterRepository.findByIdAndDeletedFalse("x")).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> companyService.getById("x"));
        assertEquals(ErrorCode.COMPANY_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    void getById_shouldThrowWhenStatusNotApproved() {
        Recruiter pending = Recruiter.builder().id("r1")
                .status(RecruiterStatus.PENDING).deleted(false).build();
        when(recruiterRepository.findByIdAndDeletedFalse("r1")).thenReturn(Optional.of(pending));

        AppException ex = assertThrows(AppException.class, () -> companyService.getById("r1"));
        assertEquals(ErrorCode.COMPANY_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    void getById_shouldReturnCompanyWithNullActiveJobCount() {
        Recruiter approved = Recruiter.builder().id("r1").companyName("ACME Inc")
                .status(RecruiterStatus.APPROVED).deleted(false).build();
        when(recruiterRepository.findByIdAndDeletedFalse("r1")).thenReturn(Optional.of(approved));

        CompanyResponse result = companyService.getById("r1");

        assertEquals("ACME Inc", result.getName());
        assertNull(result.getActiveJobCount());
    }
}
```

- [ ] **Step 4: Run tests — expect FAIL**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/user-service
mvn test -Dtest=CompanyServiceTest -q 2>&1 | grep -E "Tests run|FAIL|ERROR|UnsupportedOperationException"
```
Expected: Tests fail or error with `UnsupportedOperationException`

- [ ] **Step 5: Implement CompanyService methods**

Replace the two stub methods with:
```java
public PageResponse<CompanyResponse> getAll(int page, int size, String query,
                                             String industry, String companySize, String location) {
    int safeSize = size > 0 ? size : 10;
    int pageIdx = page > 0 ? page - 1 : 0;

    org.springframework.data.mongodb.core.query.Criteria criteria =
            org.springframework.data.mongodb.core.query.Criteria.where("deleted").is(false)
                    .and("status").is(vn.chuongpl.user_service.enums.RecruiterStatus.APPROVED);
    if (query != null && !query.isBlank())
        criteria.and("companyName").regex(query, "i");
    if (industry != null && !industry.isBlank())
        criteria.and("industry").is(industry);
    if (companySize != null && !companySize.isBlank())
        criteria.and("companySize").is(companySize);
    if (location != null && !location.isBlank())
        criteria.and("companyAddress").regex(location, "i");

    org.springframework.data.mongodb.core.query.Query mongoQuery =
            new org.springframework.data.mongodb.core.query.Query(criteria)
                    .with(org.springframework.data.domain.PageRequest.of(
                            pageIdx, safeSize,
                            org.springframework.data.domain.Sort.by("companyName")));

    java.util.List<vn.chuongpl.user_service.features.recruiter.Recruiter> recruiters =
            mongoTemplate.find(mongoQuery, vn.chuongpl.user_service.features.recruiter.Recruiter.class);
    long total = mongoTemplate.count(
            new org.springframework.data.mongodb.core.query.Query(criteria),
            vn.chuongpl.user_service.features.recruiter.Recruiter.class);

    return vn.chuongpl.user_service.dtos.PageResponse.<CompanyResponse>builder()
            .items(recruiters.stream().map(CompanyResponse::from).toList())
            .total(total)
            .page(pageIdx + 1)
            .pageSize(safeSize)
            .totalPages((int) Math.ceil((double) total / safeSize))
            .build();
}

public CompanyResponse getById(String id) {
    vn.chuongpl.user_service.features.recruiter.Recruiter recruiter =
            recruiterRepository.findByIdAndDeletedFalse(id)
                    .filter(r -> r.getStatus() == vn.chuongpl.user_service.enums.RecruiterStatus.APPROVED)
                    .orElseThrow(() -> new vn.chuongpl.user_service.exception.AppException(
                            vn.chuongpl.user_service.enums.ErrorCode.COMPANY_NOT_FOUND));
    return CompanyResponse.from(recruiter);
}
```

Add imports at top of CompanyService.java (replace the class header with):
```java
package vn.chuongpl.user_service.features.company;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import vn.chuongpl.user_service.dtos.PageResponse;
import vn.chuongpl.user_service.enums.ErrorCode;
import vn.chuongpl.user_service.enums.RecruiterStatus;
import vn.chuongpl.user_service.exception.AppException;
import vn.chuongpl.user_service.features.recruiter.Recruiter;
import vn.chuongpl.user_service.features.recruiter.RecruiterRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class CompanyService {
    RecruiterRepository recruiterRepository;
    MongoTemplate mongoTemplate;

    public PageResponse<CompanyResponse> getAll(int page, int size, String query,
                                                 String industry, String companySize, String location) {
        int safeSize = size > 0 ? size : 10;
        int pageIdx = page > 0 ? page - 1 : 0;

        Criteria criteria = Criteria.where("deleted").is(false)
                .and("status").is(RecruiterStatus.APPROVED);
        if (query != null && !query.isBlank())      criteria.and("companyName").regex(query, "i");
        if (industry != null && !industry.isBlank()) criteria.and("industry").is(industry);
        if (companySize != null && !companySize.isBlank()) criteria.and("companySize").is(companySize);
        if (location != null && !location.isBlank())  criteria.and("companyAddress").regex(location, "i");

        Query mongoQuery = new Query(criteria)
                .with(PageRequest.of(pageIdx, safeSize, Sort.by("companyName")));
        List<Recruiter> recruiters = mongoTemplate.find(mongoQuery, Recruiter.class);
        long total = mongoTemplate.count(new Query(criteria), Recruiter.class);

        return PageResponse.<CompanyResponse>builder()
                .items(recruiters.stream().map(CompanyResponse::from).toList())
                .total(total)
                .page(pageIdx + 1)
                .pageSize(safeSize)
                .totalPages((int) Math.ceil((double) total / safeSize))
                .build();
    }

    public CompanyResponse getById(String id) {
        Recruiter recruiter = recruiterRepository.findByIdAndDeletedFalse(id)
                .filter(r -> r.getStatus() == RecruiterStatus.APPROVED)
                .orElseThrow(() -> new AppException(ErrorCode.COMPANY_NOT_FOUND));
        return CompanyResponse.from(recruiter);
    }
}
```

- [ ] **Step 6: Run tests — expect PASS**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/user-service
mvn test -Dtest=CompanyServiceTest -q 2>&1 | grep -E "Tests run|BUILD"
```
Expected:
```
Tests run: 4, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

- [ ] **Step 7: Commit**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add user-service/src/main/java/vn/chuongpl/user_service/features/company/ \
        user-service/src/test/java/vn/chuongpl/user_service/service/CompanyServiceTest.java
git commit -m "feat(user-service): add Company Directory service (4 tests passing)"
```

---

## Task 4: CompanyController + Gateway Routes

**Files:**
- Create: `user-service/src/main/java/vn/chuongpl/user_service/features/company/CompanyController.java`
- Modify: `api-gateway/src/main/resources/application.yaml`

- [ ] **Step 1: Create CompanyController.java**

```java
package vn.chuongpl.user_service.features.company;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;
import vn.chuongpl.user_service.dtos.ApiResponse;
import vn.chuongpl.user_service.dtos.PageResponse;

@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class CompanyController {
    CompanyService companyService;

    @GetMapping
    public ApiResponse<PageResponse<CompanyResponse>> getAll(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String industry,
            @RequestParam(required = false) String companySize,
            @RequestParam(required = false) String location) {
        return ApiResponse.<PageResponse<CompanyResponse>>builder()
                .data(companyService.getAll(page, size, query, industry, companySize, location))
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<CompanyResponse> getById(@PathVariable String id) {
        return ApiResponse.<CompanyResponse>builder()
                .data(companyService.getById(id))
                .build();
    }
}
```

- [ ] **Step 2: Add public routes to gateway application.yaml**

In `api-gateway/src/main/resources/application.yaml`, inside the `app.public-routes` list, append:
```yaml
    - method: GET
      path: /user/api/companies
    - method: GET
      path: /user/api/companies/**
```

- [ ] **Step 3: Compile check**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/user-service && mvn compile -q && echo "OK"
```
Expected: `OK`

- [ ] **Step 4: Commit**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add user-service/src/main/java/vn/chuongpl/user_service/features/company/CompanyController.java \
        api-gateway/src/main/resources/application.yaml
git commit -m "feat(user-service): add CompanyController and public gateway routes"
```

---

## Task 5: Wishlist Entity + Repository + Response DTO

**Files:**
- Create: `user-service/src/main/java/vn/chuongpl/user_service/features/wishlist/Wishlist.java`
- Create: `user-service/src/main/java/vn/chuongpl/user_service/features/wishlist/WishlistRepository.java`
- Create: `user-service/src/main/java/vn/chuongpl/user_service/features/wishlist/WishlistResponse.java`

- [ ] **Step 1: Create Wishlist.java**

```java
package vn.chuongpl.user_service.features.wishlist;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.time.LocalDateTime;

@Document(collection = "wishlists")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Wishlist {
    @MongoId
    String id;

    @Field(name = "candidate_id")
    String candidateId;

    @Field(name = "job_id")
    String jobId;

    @Field(name = "saved_at")
    LocalDateTime savedAt;

    @Builder.Default
    boolean deleted = false;
}
```

- [ ] **Step 2: Create WishlistRepository.java**

```java
package vn.chuongpl.user_service.features.wishlist;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface WishlistRepository extends MongoRepository<Wishlist, String> {
    // Finds any entry (including soft-deleted) — used for idempotent re-activation in save()
    Optional<Wishlist> findByCandidateIdAndJobId(String candidateId, String jobId);
    // Used in remove() and contains()
    Optional<Wishlist> findByCandidateIdAndJobIdAndDeletedFalse(String candidateId, String jobId);
    List<Wishlist> findAllByCandidateIdAndDeletedFalse(String candidateId);
    boolean existsByCandidateIdAndJobIdAndDeletedFalse(String candidateId, String jobId);
}
```

- [ ] **Step 3: Create WishlistResponse.java**

```java
package vn.chuongpl.user_service.features.wishlist;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WishlistResponse {
    String jobId;
    String title;
    String company;
    Double salaryMin;
    Double salaryMax;
    String location;
    List<String> skills;
    String jobType;
    String jobStatus;
    LocalDateTime savedAt;
}
```

- [ ] **Step 4: Commit**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add user-service/src/main/java/vn/chuongpl/user_service/features/wishlist/Wishlist.java \
        user-service/src/main/java/vn/chuongpl/user_service/features/wishlist/WishlistRepository.java \
        user-service/src/main/java/vn/chuongpl/user_service/features/wishlist/WishlistResponse.java
git commit -m "feat(user-service): add Wishlist entity, repository, and response DTO"
```

---

## Task 6: WishlistService (TDD)

**Files:**
- Create: `user-service/src/main/java/vn/chuongpl/user_service/features/wishlist/WishlistService.java`
- Create: `user-service/src/test/java/vn/chuongpl/user_service/service/WishlistServiceTest.java`

- [ ] **Step 1: Create WishlistService.java stub**

```java
package vn.chuongpl.user_service.features.wishlist;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import vn.chuongpl.user_service.features.candidate.CandidateRepository;
import vn.chuongpl.user_service.integration.job.JobClient;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class WishlistService {
    WishlistRepository wishlistRepository;
    CandidateRepository candidateRepository;
    JobClient jobClient;

    public List<WishlistResponse> getMyWishlists(String userId) { throw new UnsupportedOperationException(); }
    public void save(String userId, String jobId) { throw new UnsupportedOperationException(); }
    public void remove(String userId, String jobId) { throw new UnsupportedOperationException(); }
    public boolean contains(String userId, String jobId) { throw new UnsupportedOperationException(); }
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
import vn.chuongpl.user_service.enums.ErrorCode;
import vn.chuongpl.user_service.exception.AppException;
import vn.chuongpl.user_service.features.candidate.Candidate;
import vn.chuongpl.user_service.features.candidate.CandidateRepository;
import vn.chuongpl.user_service.features.wishlist.Wishlist;
import vn.chuongpl.user_service.features.wishlist.WishlistRepository;
import vn.chuongpl.user_service.features.wishlist.WishlistResponse;
import vn.chuongpl.user_service.features.wishlist.WishlistService;
import vn.chuongpl.user_service.integration.job.JobClient;
import vn.chuongpl.user_service.integration.job.JobSummary;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WishlistServiceTest {
    @Mock WishlistRepository wishlistRepository;
    @Mock CandidateRepository candidateRepository;
    @Mock JobClient jobClient;
    @InjectMocks WishlistService wishlistService;

    final Candidate candidate = Candidate.builder().id("c1").userId("u1").build();

    @Test
    void getMyWishlists_shouldReturnListWithJobDetails() {
        Wishlist w = Wishlist.builder().id("w1").candidateId("c1").jobId("j1")
                .savedAt(LocalDateTime.now()).build();
        JobSummary job = new JobSummary();
        job.setId("j1"); job.setTitle("Engineer"); job.setCompany("ACME");
        job.setSkills(List.of("Java")); job.setStatus("ACTIVE");

        when(candidateRepository.findByUserIdAndDeletedFalse("u1")).thenReturn(Optional.of(candidate));
        when(wishlistRepository.findAllByCandidateIdAndDeletedFalse("c1")).thenReturn(List.of(w));
        when(jobClient.getJobById("j1")).thenReturn(job);

        List<WishlistResponse> result = wishlistService.getMyWishlists("u1");

        assertEquals(1, result.size());
        assertEquals("Engineer", result.get(0).getTitle());
        assertEquals("j1", result.get(0).getJobId());
        assertEquals("ACTIVE", result.get(0).getJobStatus());
    }

    @Test
    void getMyWishlists_shouldThrowWhenCandidateNotFound() {
        when(candidateRepository.findByUserIdAndDeletedFalse("u99")).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> wishlistService.getMyWishlists("u99"));
        assertEquals(ErrorCode.CANDIDATE_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    void save_shouldCreateNewEntryWhenNotExists() {
        when(candidateRepository.findByUserIdAndDeletedFalse("u1")).thenReturn(Optional.of(candidate));
        when(wishlistRepository.findByCandidateIdAndJobId("c1", "j1")).thenReturn(Optional.empty());

        wishlistService.save("u1", "j1");

        verify(wishlistRepository).save(argThat(w ->
                "c1".equals(w.getCandidateId()) && "j1".equals(w.getJobId()) && !w.isDeleted()));
    }

    @Test
    void save_shouldReactivateSoftDeletedEntry() {
        Wishlist deleted = Wishlist.builder().id("w1").candidateId("c1").jobId("j1").deleted(true).build();
        when(candidateRepository.findByUserIdAndDeletedFalse("u1")).thenReturn(Optional.of(candidate));
        when(wishlistRepository.findByCandidateIdAndJobId("c1", "j1")).thenReturn(Optional.of(deleted));

        wishlistService.save("u1", "j1");

        verify(wishlistRepository).save(argThat(w -> "w1".equals(w.getId()) && !w.isDeleted()));
    }

    @Test
    void remove_shouldSoftDelete() {
        Wishlist existing = Wishlist.builder().id("w1").candidateId("c1").jobId("j1").deleted(false).build();
        when(candidateRepository.findByUserIdAndDeletedFalse("u1")).thenReturn(Optional.of(candidate));
        when(wishlistRepository.findByCandidateIdAndJobIdAndDeletedFalse("c1", "j1"))
                .thenReturn(Optional.of(existing));

        wishlistService.remove("u1", "j1");

        verify(wishlistRepository).save(argThat(Wishlist::isDeleted));
    }

    @Test
    void contains_shouldReturnTrueWhenSaved() {
        when(candidateRepository.findByUserIdAndDeletedFalse("u1")).thenReturn(Optional.of(candidate));
        when(wishlistRepository.existsByCandidateIdAndJobIdAndDeletedFalse("c1", "j1")).thenReturn(true);

        assertTrue(wishlistService.contains("u1", "j1"));
    }
}
```

- [ ] **Step 3: Run tests — expect FAIL**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/user-service
mvn test -Dtest=WishlistServiceTest -q 2>&1 | grep -E "Tests run|FAIL|ERROR"
```
Expected: errors with `UnsupportedOperationException`

- [ ] **Step 4: Implement WishlistService**

Replace the full file content with:
```java
package vn.chuongpl.user_service.features.wishlist;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import vn.chuongpl.user_service.enums.ErrorCode;
import vn.chuongpl.user_service.exception.AppException;
import vn.chuongpl.user_service.features.candidate.Candidate;
import vn.chuongpl.user_service.features.candidate.CandidateRepository;
import vn.chuongpl.user_service.integration.job.JobClient;
import vn.chuongpl.user_service.integration.job.JobSummary;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class WishlistService {
    WishlistRepository wishlistRepository;
    CandidateRepository candidateRepository;
    JobClient jobClient;

    public List<WishlistResponse> getMyWishlists(String userId) {
        Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
        return wishlistRepository.findAllByCandidateIdAndDeletedFalse(candidate.getId())
                .stream()
                .map(w -> buildResponse(w, jobClient.getJobById(w.getJobId())))
                .toList();
    }

    public void save(String userId, String jobId) {
        Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
        Wishlist wishlist = wishlistRepository
                .findByCandidateIdAndJobId(candidate.getId(), jobId)
                .orElse(Wishlist.builder().candidateId(candidate.getId()).jobId(jobId).build());
        wishlist.setDeleted(false);
        wishlist.setSavedAt(LocalDateTime.now());
        wishlistRepository.save(wishlist);
    }

    public void remove(String userId, String jobId) {
        Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
        wishlistRepository.findByCandidateIdAndJobIdAndDeletedFalse(candidate.getId(), jobId)
                .ifPresent(w -> { w.setDeleted(true); wishlistRepository.save(w); });
    }

    public boolean contains(String userId, String jobId) {
        Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
        return wishlistRepository.existsByCandidateIdAndJobIdAndDeletedFalse(candidate.getId(), jobId);
    }

    private WishlistResponse buildResponse(Wishlist w, JobSummary job) {
        WishlistResponse.WishlistResponseBuilder b = WishlistResponse.builder()
                .jobId(w.getJobId())
                .savedAt(w.getSavedAt());
        if (job != null) {
            b.title(job.getTitle()).company(job.getCompany()).location(job.getLocation())
             .salaryMin(job.getSalaryMin()).salaryMax(job.getSalaryMax())
             .skills(job.getSkills()).jobType(job.getJobType()).jobStatus(job.getStatus());
        }
        return b.build();
    }
}
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/user-service
mvn test -Dtest=WishlistServiceTest -q 2>&1 | grep -E "Tests run|BUILD"
```
Expected:
```
Tests run: 6, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

- [ ] **Step 6: Commit**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add user-service/src/main/java/vn/chuongpl/user_service/features/wishlist/WishlistService.java \
        user-service/src/test/java/vn/chuongpl/user_service/service/WishlistServiceTest.java
git commit -m "feat(user-service): add WishlistService with TDD (6 tests passing)"
```

---

## Task 7: WishlistController

**Files:**
- Create: `user-service/src/main/java/vn/chuongpl/user_service/features/wishlist/WishlistSaveRequest.java`
- Create: `user-service/src/main/java/vn/chuongpl/user_service/features/wishlist/WishlistController.java`

- [ ] **Step 1: Create WishlistSaveRequest.java**

```java
package vn.chuongpl.user_service.features.wishlist;

import lombok.Data;

@Data
public class WishlistSaveRequest {
    String jobId;
}
```

- [ ] **Step 2: Create WishlistController.java**

```java
package vn.chuongpl.user_service.features.wishlist;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.chuongpl.user_service.dtos.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/wishlists")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class WishlistController {
    WishlistService wishlistService;

    @GetMapping
    @PreAuthorize("hasRole('CANDIDATE')")
    public ApiResponse<List<WishlistResponse>> getMyWishlists(@AuthenticationPrincipal String userId) {
        return ApiResponse.<List<WishlistResponse>>builder()
                .data(wishlistService.getMyWishlists(userId))
                .build();
    }

    @PostMapping
    @PreAuthorize("hasRole('CANDIDATE')")
    public ApiResponse<Void> save(@RequestBody WishlistSaveRequest request,
                                   @AuthenticationPrincipal String userId) {
        wishlistService.save(userId, request.getJobId());
        return ApiResponse.<Void>builder().message("Job saved to wishlist").build();
    }

    @DeleteMapping("/{jobId}")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ApiResponse<Void> remove(@PathVariable String jobId,
                                     @AuthenticationPrincipal String userId) {
        wishlistService.remove(userId, jobId);
        return ApiResponse.<Void>builder().message("Job removed from wishlist").build();
    }

    @GetMapping("/contains/{jobId}")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ApiResponse<Boolean> contains(@PathVariable String jobId,
                                          @AuthenticationPrincipal String userId) {
        return ApiResponse.<Boolean>builder()
                .data(wishlistService.contains(userId, jobId))
                .build();
    }
}
```

- [ ] **Step 3: Full test suite — expect all pass**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/user-service
mvn test -q 2>&1 | grep -E "Tests run|BUILD"
```
Expected (all existing + new tests):
```
Tests run: 5, Failures: 0, Errors: 0, Skipped: 0  -- in ...CandidateServiceTest
Tests run: 4, Failures: 0, Errors: 0, Skipped: 0  -- in ...CompanyServiceTest
Tests run: 6, Failures: 0, Errors: 0, Skipped: 0  -- in ...WishlistServiceTest
BUILD SUCCESS
```

- [ ] **Step 4: Final commit**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add user-service/src/main/java/vn/chuongpl/user_service/features/wishlist/WishlistSaveRequest.java \
        user-service/src/main/java/vn/chuongpl/user_service/features/wishlist/WishlistController.java
git commit -m "feat(user-service): add WishlistController (P0 complete)"
```
