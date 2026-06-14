package vn.chuongpl.application_service.features.application;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import vn.chuongpl.application_service.dtos.response.ApplicationResponse;
import vn.chuongpl.application_service.enums.ApplicationStatus;
import vn.chuongpl.application_service.enums.ErrorCode;
import vn.chuongpl.application_service.exception.AppException;
import vn.chuongpl.application_service.integration.ai.AiScoringPublisher;
import vn.chuongpl.application_service.integration.job.JobClient;
import vn.chuongpl.application_service.integration.job.JobResponse;
import vn.chuongpl.application_service.integration.notification.NotificationPublisher;
import vn.chuongpl.application_service.integration.user.UserClient;
import vn.chuongpl.application_service.dtos.request.ApplicationCreateRequest;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ApplicationEnrichmentTest {

    @Mock ApplicationRepository applicationRepository;
    @Mock ApplicationMapper applicationMapper;
    @Mock JobClient jobClient;
    @Mock UserClient userClient;
    @Mock NotificationPublisher notificationPublisher;
    @Mock AiScoringPublisher aiScoringPublisher;

    @InjectMocks ApplicationService applicationService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(applicationService, "defaultPageSize", 10);
    }

    @Test
    void submit_shouldSnapshotJobFields() {
        JobResponse job = JobResponse.builder()
                .id("j1")
                .recruiterId("r1")
                .title("Backend Engineer")
                .company("Acme Corp")
                .location("Hanoi")
                .salaryMin(1000.0)
                .salaryMax(2000.0)
                .skills(List.of("Java", "Spring"))
                .jobType("FULL_TIME")
                .build();

        when(jobClient.getActiveJob("j1")).thenReturn(job);
        when(applicationRepository.existsByCandidateIdAndJobIdAndStatusIn(eq("c1"), eq("j1"), anyList())).thenReturn(false);
        when(userClient.getCandidateEmail("c1")).thenReturn("c@test.com");
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));
        when(applicationMapper.toResponse(any(Application.class))).thenAnswer(inv -> {
            Application a = inv.getArgument(0);
            return ApplicationResponse.builder()
                    .jobTitle(a.getJobTitle())
                    .companyName(a.getCompanyName())
                    .jobLocation(a.getJobLocation())
                    .salaryMin(a.getSalaryMin())
                    .salaryMax(a.getSalaryMax())
                    .jobSkills(a.getJobSkills())
                    .jobType(a.getJobType())
                    .build();
        });

        ApplicationResponse resp = applicationService.submit(new ApplicationCreateRequest("j1", "cv.pdf", ""), "c1");

        assertEquals("Backend Engineer", resp.getJobTitle());
        assertEquals("Acme Corp", resp.getCompanyName());
        assertEquals("Hanoi", resp.getJobLocation());
        assertEquals(1000.0, resp.getSalaryMin());
        assertEquals(2000.0, resp.getSalaryMax());
        assertEquals(List.of("Java", "Spring"), resp.getJobSkills());
        assertEquals("FULL_TIME", resp.getJobType());
    }

    @Test
    void getMyApplicationForJob_shouldReturnApplication() {
        Application app = Application.builder()
                .id("a1")
                .candidateId("c1")
                .jobId("j1")
                .status(ApplicationStatus.PENDING)
                .build();
        when(applicationRepository.findByCandidateIdAndJobIdAndDeletedFalse("c1", "j1"))
                .thenReturn(Optional.of(app));
        when(applicationMapper.toResponse(app)).thenReturn(ApplicationResponse.builder().id("a1").build());

        ApplicationResponse resp = applicationService.getMyApplicationForJob("c1", "j1");

        assertEquals("a1", resp.getId());
    }

    @Test
    void getMyApplicationForJob_shouldThrowWhenNotFound() {
        when(applicationRepository.findByCandidateIdAndJobIdAndDeletedFalse("c1", "j1"))
                .thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class,
                () -> applicationService.getMyApplicationForJob("c1", "j1"));

        assertEquals(ErrorCode.APPLICATION_NOT_FOUND, ex.getErrorCode());
    }
}
