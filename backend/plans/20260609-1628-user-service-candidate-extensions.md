# User Service — Candidate Entity Extensions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the `Candidate` entity and `user-service` with CV management (multi-CV list), candidate settings/privacy preferences, account deletion, job suggestions cache, and company follow. Requires Plan 1 (company-wishlist) to be merged first.

**Architecture:** All features embed new objects directly into the `Candidate` MongoDB document — no new collections. `cvs: List<CvItem>` replaces the single `cvUrl` field (backward-compat maintained by syncing default CV url). `settings: CandidateSettings` holds notification and privacy preferences. `jobSuggestions: List<JobSuggestion>` caches AI-computed suggestions. `followedCompanyIds: List<String>` tracks company follows. New endpoints added to `CandidateController` and `CompanyController`.

**Tech Stack:** Spring Boot 3.4.4, MongoDB (embedded document arrays), AWS S3 (existing), RabbitMQ (existing consumer pattern), Mockito

**Prerequisite:** Plan 1 merged. `JobClient` available in `integration/job/`.

---

## File Map

**Create (user-service):**
- `features/candidate/CvItem.java` — embedded CV metadata object
- `features/candidate/CvAnalysisStatus.java` — enum (PENDING, PROCESSING, DONE, FAILED)
- `features/candidate/settings/CandidateSettings.java` — embedded settings aggregate
- `features/candidate/settings/NotificationPreferences.java` — notification flags
- `features/candidate/settings/PrivacySettings.java` — privacy flags
- `features/candidate/settings/ProfileVisibility.java` — enum (PUBLIC, RECRUITERS_ONLY, PRIVATE)
- `features/candidate/JobSuggestion.java` — embedded job suggestion cache entry
- `dtos/request/CvReanalyzeRequest.java` — empty body placeholder (no fields needed)
- `integration/ai/JobSuggestionsMessage.java` — RabbitMQ message from ai_engine_service
- `integration/ai/JobSuggestionsConsumer.java` — RabbitMQ consumer updating candidate suggestions
- `src/test/.../service/CandidateSettingsServiceTest.java`
- `src/test/.../service/CvManagementServiceTest.java`

**Modify:**
- `features/candidate/Candidate.java` — add `cvs`, `settings`, `jobSuggestions`, `suggestionsUpdatedAt`, `followedCompanyIds`
- `features/candidate/CandidateService.java` — add CV management, settings, account deletion, job suggestions, company follow methods
- `features/candidate/CandidateController.java` — add new endpoints
- `features/company/CompanyController.java` — add follow/unfollow/followed endpoints
- `configuration/RabbitMQConfig.java` — add job suggestions queue binding
- `enums/ErrorCode.java` — add `CV_NOT_FOUND`

All paths relative to `user-service/src/main/java/vn/chuongpl/user_service/`.

---

## Task 1: New Types — CvItem, CvAnalysisStatus, Settings, JobSuggestion

**Files:**
- Create: `features/candidate/CvAnalysisStatus.java`
- Create: `features/candidate/CvItem.java`
- Create: `features/candidate/settings/ProfileVisibility.java`
- Create: `features/candidate/settings/NotificationPreferences.java`
- Create: `features/candidate/settings/PrivacySettings.java`
- Create: `features/candidate/settings/CandidateSettings.java`
- Create: `features/candidate/JobSuggestion.java`
- Modify: `enums/ErrorCode.java`

- [ ] **Step 1: Create CvAnalysisStatus.java**

```java
package vn.chuongpl.user_service.features.candidate;

public enum CvAnalysisStatus {
    PENDING, PROCESSING, DONE, FAILED
}
```

- [ ] **Step 2: Create CvItem.java**

```java
package vn.chuongpl.user_service.features.candidate;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CvItem {
    String id;          // UUID assigned at upload
    String url;         // S3 URL
    String filename;    // original uploaded filename
    boolean isDefault;
    LocalDateTime uploadedAt;
    @Builder.Default
    CvAnalysisStatus analysisStatus = CvAnalysisStatus.PENDING;
    String analysisResult; // JSON summary from AI
}
```

- [ ] **Step 3: Create settings package types**

`features/candidate/settings/ProfileVisibility.java`:
```java
package vn.chuongpl.user_service.features.candidate.settings;

public enum ProfileVisibility { PUBLIC, RECRUITERS_ONLY, PRIVATE }
```

`features/candidate/settings/NotificationPreferences.java`:
```java
package vn.chuongpl.user_service.features.candidate.settings;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class NotificationPreferences {
    @Builder.Default boolean emailApplicationUpdates = true;
    @Builder.Default boolean emailJobSuggestions = true;
    @Builder.Default boolean pushNotifications = true;
    @Builder.Default boolean marketingEmails = false;
}
```

`features/candidate/settings/PrivacySettings.java`:
```java
package vn.chuongpl.user_service.features.candidate.settings;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PrivacySettings {
    @Builder.Default ProfileVisibility profileVisibility = ProfileVisibility.RECRUITERS_ONLY;
    @Builder.Default boolean showCvToRecruiters = true;
    @Builder.Default boolean showContactInfo = false;
}
```

`features/candidate/settings/CandidateSettings.java`:
```java
package vn.chuongpl.user_service.features.candidate.settings;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CandidateSettings {
    @Builder.Default NotificationPreferences notifications = new NotificationPreferences();
    @Builder.Default PrivacySettings privacy = new PrivacySettings();
}
```

- [ ] **Step 4: Create JobSuggestion.java**

```java
package vn.chuongpl.user_service.features.candidate;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class JobSuggestion {
    String jobId;
    Integer matchScore;
    String matchReason;
    List<String> alignedSkills;
    LocalDateTime suggestedAt;
}
```

- [ ] **Step 5: Add CV_NOT_FOUND to ErrorCode.java**

After `CANDIDATE_NOT_FOUND(4002, ...),` add:
```java
CV_NOT_FOUND(4003, "CV not found"),
```

- [ ] **Step 6: Compile check**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/user-service && mvn compile -q && echo "OK"
```
Expected: `OK`

- [ ] **Step 7: Commit**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add user-service/src/main/java/vn/chuongpl/user_service/features/candidate/CvAnalysisStatus.java \
        user-service/src/main/java/vn/chuongpl/user_service/features/candidate/CvItem.java \
        user-service/src/main/java/vn/chuongpl/user_service/features/candidate/settings/ \
        user-service/src/main/java/vn/chuongpl/user_service/features/candidate/JobSuggestion.java \
        user-service/src/main/java/vn/chuongpl/user_service/enums/ErrorCode.java
git commit -m "chore(user-service): add CvItem, CandidateSettings, JobSuggestion types"
```

---

## Task 2: Extend Candidate Entity

**Files:**
- Modify: `features/candidate/Candidate.java`

- [ ] **Step 1: Add new fields to Candidate.java**

Add the following imports at the top (after existing imports):
```java
import vn.chuongpl.user_service.features.candidate.settings.CandidateSettings;
import java.time.LocalDateTime;
```

Add these fields to the `Candidate` class body (after the existing `cvUrl` field):
```java
// Multi-CV management — cvUrl kept for backward compat (always mirrors default CvItem url)
@Builder.Default
@Field(name = "cvs")
java.util.List<CvItem> cvs = new java.util.ArrayList<>();

// Candidate settings and preferences
@Builder.Default
@Field(name = "settings")
CandidateSettings settings = new CandidateSettings();

// AI job suggestions cache
@Builder.Default
@Field(name = "job_suggestions")
java.util.List<JobSuggestion> jobSuggestions = new java.util.ArrayList<>();

@Field(name = "suggestions_updated_at")
LocalDateTime suggestionsUpdatedAt;

// Company follows (list of recruiter IDs)
@Builder.Default
@Field(name = "followed_company_ids")
java.util.List<String> followedCompanyIds = new java.util.ArrayList<>();
```

- [ ] **Step 2: Compile check**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/user-service && mvn compile -q && echo "OK"
```
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add user-service/src/main/java/vn/chuongpl/user_service/features/candidate/Candidate.java
git commit -m "feat(user-service): extend Candidate entity with cvs, settings, jobSuggestions, follows"
```

---

## Task 3: CV Management in CandidateService (TDD)

**Files:**
- Modify: `features/candidate/CandidateService.java`
- Create: `src/test/java/vn/chuongpl/user_service/service/CvManagementServiceTest.java`

The existing `saveCvUrl()` method continues to work for backward compat. New methods manage `cvs` list.

- [ ] **Step 1: Write failing tests**

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
import vn.chuongpl.user_service.features.candidate.CandidateMapper;
import vn.chuongpl.user_service.features.candidate.CandidateRepository;
import vn.chuongpl.user_service.features.candidate.CandidateService;
import vn.chuongpl.user_service.features.candidate.CvAnalysisStatus;
import vn.chuongpl.user_service.features.candidate.CvItem;
import vn.chuongpl.user_service.features.user.UserRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CvManagementServiceTest {
    @Mock CandidateRepository candidateRepository;
    @Mock UserRepository userRepository;
    @Mock CandidateMapper candidateMapper;
    @InjectMocks CandidateService candidateService;

    @Test
    void addCvToList_shouldAppendAndSetDefaultWhenFirst() {
        Candidate c = Candidate.builder().id("c1").userId("u1").cvs(new ArrayList<>()).build();
        when(candidateRepository.findByUserIdAndDeletedFalse("u1")).thenReturn(Optional.of(c));

        candidateService.addCvToList("u1", "https://s3/cv1.pdf", "cv1.pdf");

        assertEquals(1, c.getCvs().size());
        assertTrue(c.getCvs().get(0).isDefault());
        assertEquals("https://s3/cv1.pdf", c.getCvUrl());
        verify(candidateRepository).save(c);
    }

    @Test
    void addCvToList_shouldNotSetDefaultWhenOthersExist() {
        CvItem existing = CvItem.builder().id("old").url("old.pdf").isDefault(true).build();
        Candidate c = Candidate.builder().id("c1").userId("u1")
                .cvs(new ArrayList<>(List.of(existing))).build();
        when(candidateRepository.findByUserIdAndDeletedFalse("u1")).thenReturn(Optional.of(c));

        candidateService.addCvToList("u1", "https://s3/cv2.pdf", "cv2.pdf");

        assertEquals(2, c.getCvs().size());
        assertFalse(c.getCvs().get(1).isDefault());
        assertTrue(c.getCvs().get(0).isDefault());
    }

    @Test
    void setDefaultCv_shouldSwitchDefaultAndSyncCvUrl() {
        CvItem cv1 = CvItem.builder().id("cv1").url("url1").isDefault(true).build();
        CvItem cv2 = CvItem.builder().id("cv2").url("url2").isDefault(false).build();
        Candidate c = Candidate.builder().id("c1").userId("u1")
                .cvs(new ArrayList<>(List.of(cv1, cv2))).build();
        when(candidateRepository.findByUserIdAndDeletedFalse("u1")).thenReturn(Optional.of(c));

        candidateService.setDefaultCv("u1", "cv2");

        assertFalse(cv1.isDefault());
        assertTrue(cv2.isDefault());
        assertEquals("url2", c.getCvUrl());
        verify(candidateRepository).save(c);
    }

    @Test
    void setDefaultCv_shouldThrowWhenCvNotFound() {
        Candidate c = Candidate.builder().id("c1").userId("u1").cvs(new ArrayList<>()).build();
        when(candidateRepository.findByUserIdAndDeletedFalse("u1")).thenReturn(Optional.of(c));

        AppException ex = assertThrows(AppException.class,
                () -> candidateService.setDefaultCv("u1", "nonexistent"));
        assertEquals(ErrorCode.CV_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    void deleteCv_shouldRemoveCvAndPromoteNextDefault() {
        CvItem cv1 = CvItem.builder().id("cv1").url("url1").isDefault(true)
                .uploadedAt(LocalDateTime.now().minusDays(2)).build();
        CvItem cv2 = CvItem.builder().id("cv2").url("url2").isDefault(false)
                .uploadedAt(LocalDateTime.now().minusDays(1)).build();
        Candidate c = Candidate.builder().id("c1").userId("u1")
                .cvs(new ArrayList<>(List.of(cv1, cv2))).build();
        when(candidateRepository.findByUserIdAndDeletedFalse("u1")).thenReturn(Optional.of(c));

        candidateService.deleteCv("u1", "cv1");

        assertEquals(1, c.getCvs().size());
        assertEquals("cv2", c.getCvs().get(0).getId());
        assertTrue(c.getCvs().get(0).isDefault());
        assertEquals("url2", c.getCvUrl());
        verify(candidateRepository).save(c);
    }
}
```

- [ ] **Step 2: Run tests — expect FAIL (methods not yet implemented)**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/user-service
mvn test -Dtest=CvManagementServiceTest -q 2>&1 | grep -E "Tests run|FAIL|ERROR"
```
Expected: compilation error or test failures — methods don't exist yet

- [ ] **Step 3: Add CV management methods to CandidateService.java**

Add these imports to CandidateService (after existing imports):
```java
import vn.chuongpl.user_service.features.candidate.CvItem;
import vn.chuongpl.user_service.features.candidate.CvAnalysisStatus;
import java.util.UUID;
```

Add these methods to CandidateService class body:
```java
public java.util.List<CvItem> listCvs(String userId) {
    return candidateRepository.findByUserIdAndDeletedFalse(userId)
            .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND))
            .getCvs();
}

public void addCvToList(String userId, String url, String filename) {
    Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId)
            .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
    boolean isFirst = candidate.getCvs().isEmpty();
    CvItem item = CvItem.builder()
            .id(UUID.randomUUID().toString())
            .url(url)
            .filename(filename)
            .isDefault(isFirst)
            .uploadedAt(LocalDateTime.now())
            .build();
    candidate.getCvs().add(item);
    if (isFirst) candidate.setCvUrl(url);
    candidate.setUpdatedAt(LocalDateTime.now());
    candidateRepository.save(candidate);
}

public void setDefaultCv(String userId, String cvId) {
    Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId)
            .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
    CvItem target = candidate.getCvs().stream()
            .filter(cv -> cvId.equals(cv.getId()))
            .findFirst()
            .orElseThrow(() -> new AppException(ErrorCode.CV_NOT_FOUND));
    candidate.getCvs().forEach(cv -> cv.setDefault(false));
    target.setDefault(true);
    candidate.setCvUrl(target.getUrl());
    candidate.setUpdatedAt(LocalDateTime.now());
    candidateRepository.save(candidate);
}

public void deleteCv(String userId, String cvId) {
    Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId)
            .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
    CvItem toRemove = candidate.getCvs().stream()
            .filter(cv -> cvId.equals(cv.getId()))
            .findFirst()
            .orElseThrow(() -> new AppException(ErrorCode.CV_NOT_FOUND));
    boolean wasDefault = toRemove.isDefault();
    candidate.getCvs().remove(toRemove);
    if (wasDefault && !candidate.getCvs().isEmpty()) {
        CvItem next = candidate.getCvs().stream()
                .max(java.util.Comparator.comparing(CvItem::getUploadedAt))
                .orElse(candidate.getCvs().get(0));
        next.setDefault(true);
        candidate.setCvUrl(next.getUrl());
    }
    candidate.setUpdatedAt(LocalDateTime.now());
    candidateRepository.save(candidate);
}

public CvItem getCvAnalysis(String userId, String cvId) {
    Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId)
            .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
    return candidate.getCvs().stream()
            .filter(cv -> cvId.equals(cv.getId()))
            .findFirst()
            .orElseThrow(() -> new AppException(ErrorCode.CV_NOT_FOUND));
}

public void markCvReanalyzing(String userId, String cvId) {
    Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId)
            .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
    candidate.getCvs().stream()
            .filter(cv -> cvId.equals(cv.getId()))
            .findFirst()
            .orElseThrow(() -> new AppException(ErrorCode.CV_NOT_FOUND))
            .setAnalysisStatus(CvAnalysisStatus.PENDING);
    candidateRepository.save(candidate);
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/user-service
mvn test -Dtest=CvManagementServiceTest -q 2>&1 | grep -E "Tests run|BUILD"
```
Expected:
```
Tests run: 5, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

- [ ] **Step 5: Commit**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add user-service/src/main/java/vn/chuongpl/user_service/features/candidate/CandidateService.java \
        user-service/src/test/java/vn/chuongpl/user_service/service/CvManagementServiceTest.java
git commit -m "feat(user-service): add CV management methods to CandidateService (5 tests passing)"
```

---

## Task 4: Candidate Settings in CandidateService (TDD)

**Files:**
- Modify: `features/candidate/CandidateService.java`
- Create: `src/test/java/vn/chuongpl/user_service/service/CandidateSettingsServiceTest.java`

- [ ] **Step 1: Write failing tests**

```java
package vn.chuongpl.user_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.chuongpl.user_service.features.candidate.Candidate;
import vn.chuongpl.user_service.features.candidate.CandidateMapper;
import vn.chuongpl.user_service.features.candidate.CandidateRepository;
import vn.chuongpl.user_service.features.candidate.CandidateService;
import vn.chuongpl.user_service.features.candidate.settings.CandidateSettings;
import vn.chuongpl.user_service.features.candidate.settings.NotificationPreferences;
import vn.chuongpl.user_service.features.candidate.settings.PrivacySettings;
import vn.chuongpl.user_service.features.candidate.settings.ProfileVisibility;
import vn.chuongpl.user_service.features.user.User;
import vn.chuongpl.user_service.features.user.UserRepository;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CandidateSettingsServiceTest {
    @Mock CandidateRepository candidateRepository;
    @Mock UserRepository userRepository;
    @Mock CandidateMapper candidateMapper;
    @InjectMocks CandidateService candidateService;

    @Test
    void getSettings_shouldReturnDefaultSettingsForNewCandidate() {
        Candidate c = Candidate.builder().id("c1").userId("u1").build();
        when(candidateRepository.findByUserIdAndDeletedFalse("u1")).thenReturn(Optional.of(c));

        CandidateSettings settings = candidateService.getSettings("u1");

        assertNotNull(settings);
        assertTrue(settings.getNotifications().isEmailApplicationUpdates());
        assertFalse(settings.getNotifications().isMarketingEmails());
        assertEquals(ProfileVisibility.RECRUITERS_ONLY, settings.getPrivacy().getProfileVisibility());
    }

    @Test
    void updateNotificationPreferences_shouldPersistChanges() {
        Candidate c = Candidate.builder().id("c1").userId("u1").build();
        when(candidateRepository.findByUserIdAndDeletedFalse("u1")).thenReturn(Optional.of(c));
        NotificationPreferences prefs = NotificationPreferences.builder()
                .emailApplicationUpdates(false).emailJobSuggestions(true)
                .pushNotifications(false).marketingEmails(true).build();

        candidateService.updateNotificationPreferences("u1", prefs);

        assertEquals(prefs, c.getSettings().getNotifications());
        verify(candidateRepository).save(c);
    }

    @Test
    void updatePrivacySettings_shouldPersistChanges() {
        Candidate c = Candidate.builder().id("c1").userId("u1").build();
        when(candidateRepository.findByUserIdAndDeletedFalse("u1")).thenReturn(Optional.of(c));
        PrivacySettings privacy = PrivacySettings.builder()
                .profileVisibility(ProfileVisibility.PUBLIC)
                .showCvToRecruiters(false).showContactInfo(true).build();

        candidateService.updatePrivacySettings("u1", privacy);

        assertEquals(ProfileVisibility.PUBLIC, c.getSettings().getPrivacy().getProfileVisibility());
        verify(candidateRepository).save(c);
    }

    @Test
    void deleteAccount_shouldSoftDeleteCandidateAndUser() {
        Candidate c = Candidate.builder().id("c1").userId("u1").build();
        User u = User.builder().id("u1").build();
        when(candidateRepository.findByUserIdAndDeletedFalse("u1")).thenReturn(Optional.of(c));
        when(userRepository.findById("u1")).thenReturn(Optional.of(u));

        candidateService.deleteAccount("u1");

        assertTrue(c.isDeleted());
        assertNotNull(c.getDeletedAt());
        assertTrue(u.isDeleted());
        verify(candidateRepository).save(c);
        verify(userRepository).save(u);
    }
}
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/user-service
mvn test -Dtest=CandidateSettingsServiceTest -q 2>&1 | grep -E "Tests run|FAIL|ERROR"
```
Expected: compile error or failures — methods don't exist

- [ ] **Step 3: Add settings + account deletion methods to CandidateService.java**

Add these imports (after existing imports):
```java
import vn.chuongpl.user_service.features.candidate.settings.CandidateSettings;
import vn.chuongpl.user_service.features.candidate.settings.NotificationPreferences;
import vn.chuongpl.user_service.features.candidate.settings.PrivacySettings;
import vn.chuongpl.user_service.features.user.User;
```

Add these methods to CandidateService class body:
```java
public CandidateSettings getSettings(String userId) {
    return candidateRepository.findByUserIdAndDeletedFalse(userId)
            .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND))
            .getSettings();
}

public void updateNotificationPreferences(String userId, NotificationPreferences prefs) {
    Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId)
            .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
    candidate.getSettings().setNotifications(prefs);
    candidate.setUpdatedAt(LocalDateTime.now());
    candidateRepository.save(candidate);
}

public void updatePrivacySettings(String userId, PrivacySettings privacy) {
    Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId)
            .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
    candidate.getSettings().setPrivacy(privacy);
    candidate.setUpdatedAt(LocalDateTime.now());
    candidateRepository.save(candidate);
}

public void deleteAccount(String userId) {
    Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId)
            .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    candidate.setDeleted(true);
    candidate.setDeletedAt(LocalDateTime.now());
    candidate.setUpdatedAt(LocalDateTime.now());
    candidateRepository.save(candidate);
    user.setDeleted(true);
    user.setDeletedAt(LocalDateTime.now());
    userRepository.save(user);
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/user-service
mvn test -Dtest=CandidateSettingsServiceTest -q 2>&1 | grep -E "Tests run|BUILD"
```
Expected:
```
Tests run: 4, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

- [ ] **Step 5: Commit**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add user-service/src/main/java/vn/chuongpl/user_service/features/candidate/CandidateService.java \
        user-service/src/test/java/vn/chuongpl/user_service/service/CandidateSettingsServiceTest.java
git commit -m "feat(user-service): add settings and account deletion to CandidateService (4 tests passing)"
```

---

## Task 5: Job Suggestions Cache (RabbitMQ Consumer)

**Files:**
- Create: `integration/ai/JobSuggestionsMessage.java`
- Create: `integration/ai/JobSuggestionsConsumer.java`
- Modify: `configuration/RabbitMQConfig.java`
- Modify: `features/candidate/CandidateService.java` (add `getJobSuggestions` + `updateJobSuggestions`)

- [ ] **Step 1: Add job suggestions read method to CandidateService.java**

Add import:
```java
import vn.chuongpl.user_service.features.candidate.JobSuggestion;
```

Add method:
```java
public java.util.List<JobSuggestion> getJobSuggestions(String userId) {
    return candidateRepository.findByUserIdAndDeletedFalse(userId)
            .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND))
            .getJobSuggestions();
}

public void updateJobSuggestions(String userId, java.util.List<JobSuggestion> suggestions) {
    Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId)
            .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
    candidate.setJobSuggestions(suggestions);
    candidate.setSuggestionsUpdatedAt(LocalDateTime.now());
    candidateRepository.save(candidate);
}
```

- [ ] **Step 2: Create JobSuggestionsMessage.java**

```java
package vn.chuongpl.user_service.integration.ai;

import lombok.Data;
import lombok.NoArgsConstructor;
import vn.chuongpl.user_service.features.candidate.JobSuggestion;

import java.util.List;

@Data
@NoArgsConstructor
public class JobSuggestionsMessage {
    String userId;
    List<JobSuggestion> suggestions;
}
```

- [ ] **Step 3: Add RabbitMQ queue for job suggestions in RabbitMQConfig.java**

Look at the existing RabbitMQConfig.java to find the beans pattern. Add after the existing beans:
```java
public static final String JOB_SUGGESTIONS_QUEUE = "job.suggestions.queue";
public static final String JOB_SUGGESTIONS_EXCHANGE = "job.suggestions.exchange";
public static final String JOB_SUGGESTIONS_ROUTING_KEY = "job.suggestions";

@Bean
public org.springframework.amqp.core.Queue jobSuggestionsQueue() {
    return new org.springframework.amqp.core.Queue(JOB_SUGGESTIONS_QUEUE, true);
}

@Bean
public org.springframework.amqp.core.DirectExchange jobSuggestionsExchange() {
    return new org.springframework.amqp.core.DirectExchange(JOB_SUGGESTIONS_EXCHANGE);
}

@Bean
public org.springframework.amqp.core.Binding jobSuggestionsBinding(
        org.springframework.amqp.core.Queue jobSuggestionsQueue,
        org.springframework.amqp.core.DirectExchange jobSuggestionsExchange) {
    return org.springframework.amqp.core.BindingBuilder
            .bind(jobSuggestionsQueue)
            .to(jobSuggestionsExchange)
            .with(JOB_SUGGESTIONS_ROUTING_KEY);
}
```

- [ ] **Step 4: Create JobSuggestionsConsumer.java**

```java
package vn.chuongpl.user_service.integration.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import vn.chuongpl.user_service.configuration.RabbitMQConfig;
import vn.chuongpl.user_service.features.candidate.CandidateService;

@Component
@RequiredArgsConstructor
@Slf4j
public class JobSuggestionsConsumer {
    private final CandidateService candidateService;

    @RabbitListener(queues = RabbitMQConfig.JOB_SUGGESTIONS_QUEUE)
    public void consume(JobSuggestionsMessage message) {
        log.info("Received job suggestions for userId={}, count={}",
                message.getUserId(), message.getSuggestions() != null ? message.getSuggestions().size() : 0);
        try {
            candidateService.updateJobSuggestions(message.getUserId(), message.getSuggestions());
        } catch (Exception e) {
            log.error("Failed to update job suggestions for userId={}: {}", message.getUserId(), e.getMessage());
        }
    }
}
```

- [ ] **Step 5: Compile check**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/user-service && mvn compile -q && echo "OK"
```
Expected: `OK`

- [ ] **Step 6: Commit**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add user-service/src/main/java/vn/chuongpl/user_service/integration/ai/JobSuggestionsMessage.java \
        user-service/src/main/java/vn/chuongpl/user_service/integration/ai/JobSuggestionsConsumer.java \
        user-service/src/main/java/vn/chuongpl/user_service/configuration/RabbitMQConfig.java \
        user-service/src/main/java/vn/chuongpl/user_service/features/candidate/CandidateService.java
git commit -m "feat(user-service): add job suggestions RabbitMQ consumer and cache methods"
```

---

## Task 6: New Endpoints in CandidateController

**Files:**
- Modify: `features/candidate/CandidateController.java`

- [ ] **Step 1: Add imports to CandidateController.java**

Add after existing imports:
```java
import vn.chuongpl.user_service.features.candidate.CvItem;
import vn.chuongpl.user_service.features.candidate.JobSuggestion;
import vn.chuongpl.user_service.features.candidate.settings.CandidateSettings;
import vn.chuongpl.user_service.features.candidate.settings.NotificationPreferences;
import vn.chuongpl.user_service.features.candidate.settings.PrivacySettings;
import vn.chuongpl.user_service.integration.ai.SkillExtractPublisher;
import java.util.List;
```

Note: `SkillExtractPublisher` is already injected in `CandidateController` — check existing field and remove duplicate if needed.

- [ ] **Step 2: Add new endpoint methods to CandidateController.java**

Add these methods inside the `CandidateController` class body:
```java
// ── CV Management ──────────────────────────────────────────────────────────

@GetMapping("/cvs")
@PreAuthorize("hasRole('CANDIDATE')")
public ApiResponse<List<CvItem>> listCvs(@AuthenticationPrincipal String userId) {
    return ApiResponse.<List<CvItem>>builder()
            .data(candidateService.listCvs(userId))
            .build();
}

@PatchMapping("/cvs/{cvId}/default")
@PreAuthorize("hasRole('CANDIDATE')")
public ApiResponse<Void> setDefaultCv(@PathVariable String cvId,
                                       @AuthenticationPrincipal String userId) {
    candidateService.setDefaultCv(userId, cvId);
    return ApiResponse.<Void>builder().message("Default CV updated").build();
}

@DeleteMapping("/cvs/{cvId}")
@PreAuthorize("hasRole('CANDIDATE')")
public ApiResponse<Void> deleteCv(@PathVariable String cvId,
                                   @AuthenticationPrincipal String userId) {
    candidateService.deleteCv(userId, cvId);
    return ApiResponse.<Void>builder().message("CV deleted").build();
}

@PostMapping("/cvs/{cvId}/reanalyze")
@PreAuthorize("hasRole('CANDIDATE')")
public ApiResponse<Void> reanalyzeCv(@PathVariable String cvId,
                                      @AuthenticationPrincipal String userId) {
    CvItem cv = candidateService.getCvAnalysis(userId, cvId);
    candidateService.markCvReanalyzing(userId, cvId);
    skillExtractPublisher.publish(userId, cv.getUrl());
    return ApiResponse.<Void>builder().message("CV re-analysis triggered").build();
}

@GetMapping("/cvs/{cvId}/analysis")
@PreAuthorize("hasRole('CANDIDATE')")
public ApiResponse<CvItem> getCvAnalysis(@PathVariable String cvId,
                                          @AuthenticationPrincipal String userId) {
    return ApiResponse.<CvItem>builder()
            .data(candidateService.getCvAnalysis(userId, cvId))
            .build();
}

// ── Settings ───────────────────────────────────────────────────────────────

@GetMapping("/settings")
@PreAuthorize("hasRole('CANDIDATE')")
public ApiResponse<CandidateSettings> getSettings(@AuthenticationPrincipal String userId) {
    return ApiResponse.<CandidateSettings>builder()
            .data(candidateService.getSettings(userId))
            .build();
}

@PutMapping("/settings/notifications")
@PreAuthorize("hasRole('CANDIDATE')")
public ApiResponse<Void> updateNotifications(@RequestBody NotificationPreferences prefs,
                                              @AuthenticationPrincipal String userId) {
    candidateService.updateNotificationPreferences(userId, prefs);
    return ApiResponse.<Void>builder().message("Notification preferences updated").build();
}

@PutMapping("/settings/privacy")
@PreAuthorize("hasRole('CANDIDATE')")
public ApiResponse<Void> updatePrivacy(@RequestBody PrivacySettings privacy,
                                        @AuthenticationPrincipal String userId) {
    candidateService.updatePrivacySettings(userId, privacy);
    return ApiResponse.<Void>builder().message("Privacy settings updated").build();
}

@DeleteMapping("/me")
@PreAuthorize("hasRole('CANDIDATE')")
public ApiResponse<Void> deleteMyAccount(@AuthenticationPrincipal String userId) {
    candidateService.deleteAccount(userId);
    return ApiResponse.<Void>builder().message("Account deactivated").build();
}

// ── Job Suggestions ────────────────────────────────────────────────────────

@GetMapping("/job-suggestions")
@PreAuthorize("hasRole('CANDIDATE')")
public ApiResponse<List<JobSuggestion>> getJobSuggestions(@AuthenticationPrincipal String userId) {
    return ApiResponse.<List<JobSuggestion>>builder()
            .data(candidateService.getJobSuggestions(userId))
            .build();
}
```

Also **modify** the existing `uploadCv` method to call `addCvToList` after upload. Replace the existing method body:
```java
@PostMapping("/cv/upload")
@PreAuthorize("hasRole('CANDIDATE')")
public ApiResponse<CvUploadResponse> uploadCv(@RequestParam("file") MultipartFile file,
                                               @AuthenticationPrincipal String userId) {
    String url = s3Service.uploadCv(file, userId);
    candidateService.saveCvUrl(userId, url);                        // backward compat
    candidateService.addCvToList(userId, url, file.getOriginalFilename()); // add to cvs list
    skillExtractPublisher.publish(userId, url);
    return ApiResponse.<CvUploadResponse>builder()
            .message("CV uploaded successfully")
            .data(new CvUploadResponse(url))
            .build();
}
```

- [ ] **Step 3: Add company follow endpoints to CompanyController.java**

Add after existing imports in CompanyController:
```java
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import vn.chuongpl.user_service.features.candidate.CandidateService;
```

Add `CandidateService candidateService;` field.

Add these methods:
```java
@PostMapping("/{id}/follow")
@PreAuthorize("hasRole('CANDIDATE')")
public ApiResponse<Void> follow(@PathVariable String id,
                                 @AuthenticationPrincipal String userId) {
    candidateService.followCompany(userId, id);
    return ApiResponse.<Void>builder().message("Company followed").build();
}

@DeleteMapping("/{id}/follow")
@PreAuthorize("hasRole('CANDIDATE')")
public ApiResponse<Void> unfollow(@PathVariable String id,
                                   @AuthenticationPrincipal String userId) {
    candidateService.unfollowCompany(userId, id);
    return ApiResponse.<Void>builder().message("Company unfollowed").build();
}

@GetMapping("/followed")
@PreAuthorize("hasRole('CANDIDATE')")
public ApiResponse<List<CompanyResponse>> getFollowed(@AuthenticationPrincipal String userId) {
    return ApiResponse.<List<CompanyResponse>>builder()
            .data(companyService.getFollowedCompanies(userId))
            .build();
}
```

- [ ] **Step 4: Add follow/unfollow methods to CandidateService.java**

```java
public void followCompany(String userId, String companyId) {
    Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId)
            .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
    if (!candidate.getFollowedCompanyIds().contains(companyId)) {
        candidate.getFollowedCompanyIds().add(companyId);
        candidateRepository.save(candidate);
    }
}

public void unfollowCompany(String userId, String companyId) {
    Candidate candidate = candidateRepository.findByUserIdAndDeletedFalse(userId)
            .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND));
    candidate.getFollowedCompanyIds().remove(companyId);
    candidateRepository.save(candidate);
}

public java.util.List<String> getFollowedCompanyIds(String userId) {
    return candidateRepository.findByUserIdAndDeletedFalse(userId)
            .orElseThrow(() -> new AppException(ErrorCode.CANDIDATE_NOT_FOUND))
            .getFollowedCompanyIds();
}
```

- [ ] **Step 5: Add getFollowedCompanies to CompanyService.java**

Add import:
```java
import vn.chuongpl.user_service.features.candidate.CandidateService;
```

Add `CandidateService candidateService;` field to `CompanyService`.

Add method:
```java
public java.util.List<CompanyResponse> getFollowedCompanies(String userId) {
    java.util.List<String> ids = candidateService.getFollowedCompanyIds(userId);
    return ids.stream()
            .map(id -> recruiterRepository.findByIdAndDeletedFalse(id)
                    .filter(r -> r.getStatus() == RecruiterStatus.APPROVED)
                    .map(CompanyResponse::from)
                    .orElse(null))
            .filter(java.util.Objects::nonNull)
            .toList();
}
```

**Note:** This creates a circular dependency if `CandidateService` depends on `CompanyService` and vice versa. To avoid it, `CompanyService` takes `CandidateService`, but `CandidateService` does NOT depend on `CompanyService`. The `getFollowedCompanyIds()` method in `CandidateService` is a simple repository call with no reference to `CompanyService`. Verify the dependency graph is one-directional: `CompanyService → CandidateService → repositories`.

- [ ] **Step 6: Full compile + test run**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be/user-service
mvn test -q 2>&1 | grep -E "Tests run|BUILD"
```
Expected (all test classes passing):
```
Tests run: 5, Failures: 0, Errors: 0, Skipped: 0  -- CandidateServiceTest
Tests run: 4, Failures: 0, Errors: 0, Skipped: 0  -- CompanyServiceTest
Tests run: 6, Failures: 0, Errors: 0, Skipped: 0  -- WishlistServiceTest
Tests run: 5, Failures: 0, Errors: 0, Skipped: 0  -- CvManagementServiceTest
Tests run: 4, Failures: 0, Errors: 0, Skipped: 0  -- CandidateSettingsServiceTest
BUILD SUCCESS
```

- [ ] **Step 7: Commit**

```bash
cd /home/chuongpl/projects/smartCV/smartCv-be
git add user-service/src/main/java/vn/chuongpl/user_service/features/candidate/CandidateController.java \
        user-service/src/main/java/vn/chuongpl/user_service/features/candidate/CandidateService.java \
        user-service/src/main/java/vn/chuongpl/user_service/features/company/CompanyController.java \
        user-service/src/main/java/vn/chuongpl/user_service/features/company/CompanyService.java
git commit -m "feat(user-service): add CV, settings, suggestions, and company follow endpoints (P0+P1+P2 complete)"
```
