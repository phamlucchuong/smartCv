package vn.chuongpl.job_service.features.job;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import vn.chuongpl.job_service.config.RabbitMQConfig;
import vn.chuongpl.job_service.dtos.PageResponse;
import vn.chuongpl.job_service.dtos.request.JobCreateRequest;
import vn.chuongpl.job_service.dtos.request.JobSearchRequest;
import vn.chuongpl.job_service.dtos.request.JobUpdateRequest;
import vn.chuongpl.job_service.dtos.response.JobResponse;
import vn.chuongpl.job_service.enums.ErrorCode;
import vn.chuongpl.job_service.enums.JobStatus;
import vn.chuongpl.job_service.exception.AppException;
import vn.chuongpl.job_service.integration.elasticsearch.JobIndexService;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class JobService {
    JobRepository jobRepository;
    ObjectProvider<JobIndexService> jobIndexServiceProvider;
    JobMapper jobMapper;
    RabbitTemplate rabbitTemplate;

    @NonFinal
    @Value("${app.job-default-page-size:10}")
    int defaultPageSize;

    public JobResponse createJob(JobCreateRequest request, String recruiterId) {
        Job job = jobMapper.toJob(request);
        job.setRecruiterId(recruiterId);
        job.setStatus(JobStatus.DRAFT);
        job.setDeleted(false);
        if (job.getQualifiedThreshold() == null) job.setQualifiedThreshold(70);
        if (job.getRejectThreshold() == null)    job.setRejectThreshold(50);
        if (job.getAutoRejectEnabled() == null)  job.setAutoRejectEnabled(false);
        return jobMapper.toJobResponse(jobRepository.save(job));
    }

    public JobResponse getMyJobById(String id, String userId, boolean isAdmin) {
        Job job = jobRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));
        assertOwner(job, userId, isAdmin);
        return jobMapper.toJobResponse(job);
    }

    public JobResponse getJobById(String id) {
        Job job = jobRepository.findByIdAndDeletedFalse(id).orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));
        if (job.getStatus() != JobStatus.ACTIVE) {
            throw new AppException(ErrorCode.JOB_NOT_FOUND);
        }
        return jobMapper.toJobResponse(job);
    }

    public PageResponse<JobResponse> getActiveJobs(int page, int size) {
        Pageable pageable = buildPageable(page, size, "createdAt", "desc");
        Page<Job> jobs = jobRepository.findByStatusAndDeletedFalse(JobStatus.ACTIVE, pageable);
        return toPageResponse(jobs);
    }

    public PageResponse<JobResponse> getMyJobs(String recruiterId, int page, int size) {
        Pageable pageable = buildPageable(page, size, "createdAt", "desc");
        Page<Job> jobs = jobRepository.findByRecruiterIdAndDeletedFalse(recruiterId, pageable);
        return toPageResponse(jobs);
    }

    public PageResponse<JobResponse> getAllJobs(int page, int size) {
        Pageable pageable = buildPageable(page, size, "createdAt", "desc");
        Page<Job> jobs = jobRepository.findByDeletedFalse(pageable);
        return toPageResponse(jobs);
    }

    public JobResponse updateJob(String id, JobUpdateRequest request, String userId, boolean isAdmin) {
        Job job = jobRepository.findByIdAndDeletedFalse(id).orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));
        assertOwner(job, userId, isAdmin);
        if (job.getStatus() == JobStatus.CLOSED || job.getStatus() == JobStatus.EXPIRED) {
            throw new AppException(ErrorCode.JOB_STATUS_INVALID);
        }

        jobMapper.updateJob(job, request);
        Job saved = jobRepository.save(job);
        if (saved.getStatus() == JobStatus.ACTIVE) {
            indexJobIfEnabled(saved);
        }
        publishEvent(saved, "UPDATED", RabbitMQConfig.JOB_UPDATED_ROUTING_KEY);
        return jobMapper.toJobResponse(saved);
    }

    public JobResponse publishJob(String id, String userId, boolean isAdmin) {
        Job job = jobRepository.findByIdAndDeletedFalse(id).orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));
        assertOwner(job, userId, isAdmin);

        if (job.getStatus() != JobStatus.DRAFT) throw new AppException(ErrorCode.JOB_STATUS_INVALID);
        if (job.getDeadline() != null && !job.getDeadline().isAfter(LocalDate.now())) {
            throw new AppException(ErrorCode.JOB_STATUS_INVALID);
        }

        job.setStatus(JobStatus.ACTIVE);
        Job saved = jobRepository.save(job);
        indexJobIfEnabled(saved);
        publishEvent(saved, "CREATED", RabbitMQConfig.JOB_CREATED_ROUTING_KEY);
        return jobMapper.toJobResponse(saved);
    }

    public JobResponse closeJob(String id, String userId, boolean isAdmin) {
        Job job = jobRepository.findByIdAndDeletedFalse(id).orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));
        assertOwner(job, userId, isAdmin);

        if (job.getStatus() != JobStatus.ACTIVE && job.getStatus() != JobStatus.DRAFT) {
            throw new AppException(ErrorCode.JOB_STATUS_INVALID);
        }

        job.setStatus(JobStatus.CLOSED);
        Job saved = jobRepository.save(job);
        removeFromIndexIfEnabled(saved.getId());
        publishEvent(saved, "CLOSED", RabbitMQConfig.JOB_CLOSED_ROUTING_KEY);
        return jobMapper.toJobResponse(saved);
    }

    public void deleteJob(String id, String userId, boolean isAdmin) {
        Job job = jobRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));
        assertOwner(job, userId, isAdmin);
        job.setDeleted(true);
        job.setDeletedAt(LocalDateTime.now());
        jobRepository.save(job);
        removeFromIndexIfEnabled(id);
    }

    public java.util.List<JobResponse> getRelatedJobs(String id) {
        Job job = jobRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));
        java.util.List<String> skills = job.getSkills() != null ? job.getSkills() : java.util.List.of();
        if (skills.isEmpty()) return java.util.List.of();
        return jobRepository
                .findTop5ByStatusAndSkillsInAndIdNotAndDeletedFalse(JobStatus.ACTIVE, skills, id)
                .stream().map(jobMapper::toJobResponse).toList();
    }

    public java.util.List<JobResponse> getJobsByIds(java.util.List<String> ids) {
        if (ids == null || ids.isEmpty()) return java.util.List.of();
        return jobRepository.findAllByIdInAndDeletedFalse(ids).stream()
                .map(jobMapper::toJobResponse)
                .toList();
    }

    public java.util.List<JobResponse> getActiveJobsByRecruiter(String recruiterId) {
        return jobRepository.findTop20ByRecruiterIdAndStatusAndDeletedFalse(recruiterId, JobStatus.ACTIVE)
                .stream()
                .map(jobMapper::toJobResponse)
                .toList();
    }

    public PageResponse<JobResponse> searchJobs(JobSearchRequest request) {
        JobIndexService jobIndexService = jobIndexServiceProvider.getIfAvailable();
        if (jobIndexService == null) {
            return PageResponse.<JobResponse>builder()
                    .items(java.util.List.of())
                    .total(0)
                    .page(request.getPage() > 0 ? request.getPage() : 1)
                    .pageSize(request.getSize() > 0 ? request.getSize() : defaultPageSize)
                    .totalPages(0)
                    .build();
        }
        return jobIndexService.search(request);
    }

    private void indexJobIfEnabled(Job job) {
        JobIndexService jobIndexService = jobIndexServiceProvider.getIfAvailable();
        if (jobIndexService != null) {
            jobIndexService.indexJob(job);
        }
    }

    private void removeFromIndexIfEnabled(String jobId) {
        JobIndexService jobIndexService = jobIndexServiceProvider.getIfAvailable();
        if (jobIndexService != null) {
            jobIndexService.removeFromIndex(jobId);
        }
    }

    private void assertOwner(Job job, String userId, boolean isAdmin) {
        if (!isAdmin && !job.getRecruiterId().equals(userId)) {
            throw new AppException(ErrorCode.JOB_NOT_OWNER);
        }
    }

    private Pageable buildPageable(int page, int size, String sortBy, String sortDir) {
        int pageCurrent = page > 0 ? page - 1 : 0;
        int pageSize = size > 0 ? size : defaultPageSize;
        Sort sort = "asc".equalsIgnoreCase(sortDir) ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        return PageRequest.of(pageCurrent, pageSize, sort);
    }

    private PageResponse<JobResponse> toPageResponse(Page<Job> jobs) {
        return PageResponse.<JobResponse>builder()
                .items(jobs.getContent().stream().map(jobMapper::toJobResponse).toList())
                .total(jobs.getTotalElements())
                .page(jobs.getNumber() + 1)
                .pageSize(jobs.getSize())
                .totalPages(jobs.getTotalPages())
                .build();
    }

    private void publishEvent(Job job, String eventType, String routingKey) {
        JobEventMessage event = JobEventMessage.builder()
                .jobId(job.getId())
                .recruiterId(job.getRecruiterId())
                .title(job.getTitle())
                .company(job.getCompany())
                .eventType(eventType)
                .occurredAt(LocalDateTime.now())
                .build();
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, routingKey, event);
    }
}
