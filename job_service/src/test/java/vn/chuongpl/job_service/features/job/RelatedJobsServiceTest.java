package vn.chuongpl.job_service.features.job;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.test.util.ReflectionTestUtils;
import vn.chuongpl.job_service.dtos.response.JobResponse;
import vn.chuongpl.job_service.enums.ErrorCode;
import vn.chuongpl.job_service.enums.JobStatus;
import vn.chuongpl.job_service.exception.AppException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RelatedJobsServiceTest {

    @Mock JobRepository jobRepository;
    @Mock JobMapper jobMapper;
    @Mock RabbitTemplate rabbitTemplate;
    @Mock ObjectProvider<vn.chuongpl.job_service.integration.elasticsearch.JobIndexService> jobIndexServiceProvider;

    @InjectMocks JobService jobService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(jobService, "defaultPageSize", 10);
    }

    @Test
    void getRelatedJobs_shouldReturnRelatedBySkillOverlap() {
        Job target = Job.builder().id("j1").skills(List.of("Java", "Spring")).status(JobStatus.ACTIVE).deleted(false).build();
        Job related = Job.builder().id("j2").skills(List.of("Java")).status(JobStatus.ACTIVE).deleted(false).build();

        when(jobRepository.findByIdAndDeletedFalse("j1")).thenReturn(Optional.of(target));
        when(jobRepository.findTop5ByStatusAndSkillsInAndIdNotAndDeletedFalse(
                eq(JobStatus.ACTIVE), eq(List.of("Java", "Spring")), eq("j1")))
                .thenReturn(List.of(related));
        when(jobMapper.toJobResponse(related)).thenReturn(JobResponse.builder().id("j2").build());

        List<JobResponse> result = jobService.getRelatedJobs("j1");

        assertEquals(1, result.size());
        assertEquals("j2", result.get(0).getId());
    }

    @Test
    void getRelatedJobs_shouldReturnEmptyWhenNoSkills() {
        Job target = Job.builder().id("j1").skills(List.of()).status(JobStatus.ACTIVE).deleted(false).build();
        when(jobRepository.findByIdAndDeletedFalse("j1")).thenReturn(Optional.of(target));

        List<JobResponse> result = jobService.getRelatedJobs("j1");

        assertTrue(result.isEmpty());
    }

    @Test
    void getRelatedJobs_shouldThrowWhenJobNotFound() {
        when(jobRepository.findByIdAndDeletedFalse("bad")).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> jobService.getRelatedJobs("bad"));
        assertEquals(ErrorCode.JOB_NOT_FOUND, ex.getErrorCode());
    }
}
