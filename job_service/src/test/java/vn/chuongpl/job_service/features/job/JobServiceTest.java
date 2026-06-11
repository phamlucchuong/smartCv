package vn.chuongpl.job_service.features.job;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.test.util.ReflectionTestUtils;
import vn.chuongpl.job_service.config.RabbitMQConfig;
import vn.chuongpl.job_service.dtos.PageResponse;
import vn.chuongpl.job_service.dtos.response.JobResponse;
import vn.chuongpl.job_service.enums.ErrorCode;
import vn.chuongpl.job_service.enums.JobStatus;
import vn.chuongpl.job_service.exception.AppException;
import vn.chuongpl.job_service.integration.elasticsearch.JobIndexService;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JobServiceTest {

    @Mock
    JobRepository jobRepository;
    @Mock
    JobIndexService jobIndexService;
    @Mock
    JobMapper jobMapper;
    @Mock
    RabbitTemplate rabbitTemplate;
    @Mock
    ObjectProvider<JobIndexService> jobIndexServiceProvider;

    @InjectMocks
    JobService jobService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(jobService, "defaultPageSize", 10);
    }

    @Test
    void getJobById_shouldHideInactiveJobs() {
        Job job = Job.builder().id("job-1").status(JobStatus.DRAFT).build();
        when(jobRepository.findByIdAndDeletedFalse("job-1")).thenReturn(Optional.of(job));

        AppException ex = assertThrows(AppException.class, () -> jobService.getJobById("job-1"));

        assertEquals(ErrorCode.JOB_NOT_FOUND, ex.getErrorCode());
        verify(jobMapper, never()).toJobResponse(any(Job.class));
    }

    @Test
    void publishJob_shouldRejectExpiredDeadline() {
        Job job = Job.builder()
                .id("job-1")
                .recruiterId("recruiter-1")
                .status(JobStatus.DRAFT)
                .deadline(LocalDate.now())
                .build();
        when(jobRepository.findByIdAndDeletedFalse("job-1")).thenReturn(Optional.of(job));

        AppException ex = assertThrows(
                AppException.class,
                () -> jobService.publishJob("job-1", "recruiter-1", false)
        );

        assertEquals(ErrorCode.JOB_STATUS_INVALID, ex.getErrorCode());
        verify(jobRepository, never()).save(any(Job.class));
        verify(jobIndexService, never()).indexJob(any(Job.class));
    }

    @Test
    void publishJob_shouldActivateIndexAndPublishEvent() {
        Job job = Job.builder()
                .id("job-1")
                .recruiterId("recruiter-1")
                .title("Backend Engineer")
                .company("SmartCV")
                .status(JobStatus.DRAFT)
                .deadline(LocalDate.now().plusDays(7))
                .build();
        JobResponse response = JobResponse.builder().id("job-1").status(JobStatus.ACTIVE).build();

        when(jobRepository.findByIdAndDeletedFalse("job-1")).thenReturn(Optional.of(job));
        when(jobRepository.save(job)).thenReturn(job);
        when(jobMapper.toJobResponse(job)).thenReturn(response);
        when(jobIndexServiceProvider.getIfAvailable()).thenReturn(jobIndexService);

        JobResponse actual = jobService.publishJob("job-1", "recruiter-1", false);

        assertEquals(JobStatus.ACTIVE, job.getStatus());
        assertEquals(JobStatus.ACTIVE, actual.getStatus());
        verify(jobIndexService).indexJob(job);
        verify(rabbitTemplate).convertAndSend(eq(RabbitMQConfig.EXCHANGE), eq(RabbitMQConfig.JOB_CREATED_ROUTING_KEY), any(JobEventMessage.class));
    }

    @Test
    void deleteJob_shouldSoftDeleteAndRemoveIndex() {
        Job job = Job.builder().id("job-1").deleted(false).build();
        when(jobRepository.findByIdAndDeletedFalse("job-1")).thenReturn(Optional.of(job));
        when(jobIndexServiceProvider.getIfAvailable()).thenReturn(jobIndexService);

        jobService.deleteJob("job-1");

        assertTrue(job.isDeleted());
        verify(jobRepository).save(job);
        verify(jobIndexService).removeFromIndex("job-1");
    }

    @Test
    void getActiveJobs_shouldFallbackToDefaultPageSize() {
        Job job = Job.builder().id("job-1").status(JobStatus.ACTIVE).build();
        JobResponse response = JobResponse.builder().id("job-1").status(JobStatus.ACTIVE).build();
        PageRequest expectedPage = PageRequest.of(0, 10, Sort.by("createdAt").descending());

        when(jobRepository.findByStatusAndDeletedFalse(eq(JobStatus.ACTIVE), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(job), expectedPage, 1));
        when(jobMapper.toJobResponse(job)).thenReturn(response);

        PageResponse<JobResponse> actual = jobService.getActiveJobs(0, 0);

        assertEquals(1, actual.getPage());
        assertEquals(10, actual.getPageSize());
        assertEquals(1, actual.getItems().size());
        verify(jobRepository).findByStatusAndDeletedFalse(eq(JobStatus.ACTIVE), eq(expectedPage));
    }
}
