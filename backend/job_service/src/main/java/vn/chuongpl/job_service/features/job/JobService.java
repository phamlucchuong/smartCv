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
import vn.chuongpl.job_service.dtos.request.JobRejectRequest;
import vn.chuongpl.job_service.dtos.request.JobSearchRequest;
import vn.chuongpl.job_service.dtos.request.JobUpdateRequest;
import vn.chuongpl.job_service.dtos.response.JobResponse;
import vn.chuongpl.job_service.enums.ErrorCode;
import vn.chuongpl.job_service.enums.JobModerationStatus;
import vn.chuongpl.job_service.enums.JobVisibilityStatus;
import vn.chuongpl.job_service.exception.AppException;
import vn.chuongpl.job_service.integration.elasticsearch.JobIndexService;
import vn.chuongpl.job_service.integration.userservice.UserServiceClient;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class JobService {
    JobRepository jobRepository;
    ObjectProvider<JobIndexService> jobIndexServiceProvider;
    JobMapper jobMapper;
    RabbitTemplate rabbitTemplate;
    UserServiceClient userServiceClient;

    @NonFinal
    @Value("${app.job-default-page-size:10}")
    int defaultPageSize;

    public JobResponse createJob(JobCreateRequest request, String recruiterId) {
        var recruiterStatus = userServiceClient.getRecruiterStatus(recruiterId);
        if (!recruiterStatus.isApproved()) {
            throw new AppException(ErrorCode.RECRUITER_NOT_APPROVED);
        }
        Job job = jobMapper.toJob(request);
        prepareDraft(job, recruiterId);
        assertUniqueTitleForCreate(job);
        return jobMapper.toJobResponse(jobRepository.save(job));
    }

    public JobResponse getMyJobById(String id, String userId, boolean isAdmin) {
        expireOverduePublishedJobs();
        Job job = findJob(id);
        assertOwner(job, userId, isAdmin);
        return jobMapper.toJobResponse(job);
    }

    public JobResponse getJobById(String id) {
        expireOverduePublishedJobs();
        Job job = findJob(id);
        if (!isPubliclyVisible(job)) {
            throw new AppException(ErrorCode.JOB_NOT_FOUND);
        }
        return jobMapper.toJobResponse(job);
    }

    public PageResponse<JobResponse> getActiveJobs(int page, int size) {
        expireOverduePublishedJobs();
        Pageable pageable = buildPageable(page, size, "createdAt", "desc");
        Page<Job> jobs = jobRepository.findByModerationStatusAndVisibilityStatusAndDeletedFalse(
                JobModerationStatus.PUBLISHED,
                JobVisibilityStatus.ACTIVE,
                pageable
        );
        return toPageResponse(jobs);
    }

    public PageResponse<JobResponse> getMyJobs(String recruiterId, int page, int size) {
        expireOverduePublishedJobs();
        Pageable pageable = buildPageable(page, size, "createdAt", "desc");
        Page<Job> jobs = jobRepository.findByRecruiterIdAndDeletedFalse(recruiterId, pageable);
        return toPageResponse(jobs);
    }

    public PageResponse<JobResponse> getAllJobs(String moderationStatus, int page, int size) {
        expireOverduePublishedJobs();
        Pageable pageable = buildPageable(page, size, "createdAt", "desc");
        Page<Job> jobs;
        if (moderationStatus != null && !moderationStatus.isBlank()) {
            JobModerationStatus status;
            try {
                status = JobModerationStatus.valueOf(moderationStatus.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new AppException(ErrorCode.JOB_STATUS_INVALID);
            }
            jobs = jobRepository.findByModerationStatusAndDeletedFalse(status, pageable);
        } else {
            jobs = jobRepository.findByDeletedFalse(pageable);
        }
        return toPageResponse(jobs);
    }

    public JobResponse updateJob(String id, JobUpdateRequest request, String userId, boolean isAdmin) {
        Job job = findJob(id);
        assertOwner(job, userId, isAdmin);

        if (job.getVisibilityStatus() == JobVisibilityStatus.EXPIRED) {
            throw new AppException(ErrorCode.JOB_STATUS_INVALID);
        }

        String previousTitle = job.getTitle();
        jobMapper.updateJob(job, request);
        normalizeMutableFields(job);

        if (job.getTitle() == null || job.getTitle().isBlank()) {
            job.setTitle(previousTitle);
            job.setNormalizedTitle(normalizeTitle(previousTitle));
        }

        assertUniqueTitleForUpdate(job);

        if (job.getModerationStatus() == JobModerationStatus.PUBLISHED) {
            job.setModerationStatus(JobModerationStatus.PENDING);
            job.setVisibilityStatus(JobVisibilityStatus.INACTIVE);
            removeFromIndexIfEnabled(job.getId());
        }

        Job saved = jobRepository.save(job);
        publishEvent(saved, "UPDATED", RabbitMQConfig.JOB_UPDATED_ROUTING_KEY);
        return jobMapper.toJobResponse(saved);
    }

    public JobResponse submitJob(String id, String userId, boolean isAdmin) {
        Job job = findJob(id);
        assertOwner(job, userId, isAdmin);

        if (job.getModerationStatus() != JobModerationStatus.DRAFT) {
            throw new AppException(ErrorCode.JOB_STATUS_INVALID);
        }

        validatePublishReady(job);
        assertUniqueTitleForSubmit(job);

        job.setModerationStatus(JobModerationStatus.PENDING);
        job.setVisibilityStatus(JobVisibilityStatus.INACTIVE);
        job.setModerationNote(null);
        job.setReviewedBy(null);
        job.setReviewedAt(null);
        return jobMapper.toJobResponse(jobRepository.save(job));
    }

    public JobResponse withdrawJob(String id, String userId, boolean isAdmin) {
        Job job = findJob(id);
        assertOwner(job, userId, isAdmin);

        if (job.getModerationStatus() != JobModerationStatus.PENDING) {
            throw new AppException(ErrorCode.JOB_STATUS_INVALID);
        }

        job.setModerationStatus(JobModerationStatus.DRAFT);
        job.setVisibilityStatus(JobVisibilityStatus.INACTIVE);
        return jobMapper.toJobResponse(jobRepository.save(job));
    }

    public JobResponse approveJob(String id, String adminId) {
        Job job = findJob(id);

        if (job.getModerationStatus() != JobModerationStatus.PENDING) {
            throw new AppException(ErrorCode.JOB_STATUS_INVALID);
        }

        validatePublishReady(job);
        assertUniqueTitleForSubmit(job);

        job.setModerationStatus(JobModerationStatus.PUBLISHED);
        job.setVisibilityStatus(resolvePublishedVisibility(job));
        job.setModerationNote(null);
        job.setReviewedBy(adminId);
        job.setReviewedAt(LocalDateTime.now());
        Job saved = jobRepository.save(job);

        if (saved.getVisibilityStatus() == JobVisibilityStatus.ACTIVE) {
            indexJobIfEnabled(saved);
            publishEvent(saved, "CREATED", RabbitMQConfig.JOB_CREATED_ROUTING_KEY);
        } else {
            removeFromIndexIfEnabled(saved.getId());
        }
        return jobMapper.toJobResponse(saved);
    }

    public JobResponse rejectJob(String id, JobRejectRequest request, String adminId) {
        Job job = findJob(id);

        if (job.getModerationStatus() != JobModerationStatus.PENDING) {
            throw new AppException(ErrorCode.JOB_STATUS_INVALID);
        }

        job.setModerationStatus(JobModerationStatus.DRAFT);
        job.setVisibilityStatus(JobVisibilityStatus.INACTIVE);
        job.setModerationNote(request.note().trim());
        job.setReviewedBy(adminId);
        job.setReviewedAt(LocalDateTime.now());
        removeFromIndexIfEnabled(job.getId());
        return jobMapper.toJobResponse(jobRepository.save(job));
    }

    public JobResponse activateJob(String id, String userId, boolean isAdmin) {
        Job job = findJob(id);
        assertOwner(job, userId, isAdmin);

        if (job.getModerationStatus() != JobModerationStatus.PUBLISHED) {
            throw new AppException(ErrorCode.JOB_STATUS_INVALID);
        }
        if (resolvePublishedVisibility(job) == JobVisibilityStatus.EXPIRED) {
            job.setVisibilityStatus(JobVisibilityStatus.EXPIRED);
            jobRepository.save(job);
            throw new AppException(ErrorCode.JOB_STATUS_INVALID);
        }

        job.setVisibilityStatus(JobVisibilityStatus.ACTIVE);
        Job saved = jobRepository.save(job);
        indexJobIfEnabled(saved);
        publishEvent(saved, "UPDATED", RabbitMQConfig.JOB_UPDATED_ROUTING_KEY);
        return jobMapper.toJobResponse(saved);
    }

    public JobResponse deactivateJob(String id, String userId, boolean isAdmin) {
        Job job = findJob(id);
        assertOwner(job, userId, isAdmin);

        if (job.getModerationStatus() != JobModerationStatus.PUBLISHED
                || job.getVisibilityStatus() != JobVisibilityStatus.ACTIVE) {
            throw new AppException(ErrorCode.JOB_STATUS_INVALID);
        }

        job.setVisibilityStatus(JobVisibilityStatus.INACTIVE);
        Job saved = jobRepository.save(job);
        removeFromIndexIfEnabled(saved.getId());
        publishEvent(saved, "CLOSED", RabbitMQConfig.JOB_CLOSED_ROUTING_KEY);
        return jobMapper.toJobResponse(saved);
    }

    public void deleteJob(String id, String userId, boolean isAdmin) {
        Job job = findJob(id);
        assertOwner(job, userId, isAdmin);
        job.setDeleted(true);
        job.setDeletedAt(LocalDateTime.now());
        jobRepository.save(job);
        removeFromIndexIfEnabled(id);
    }

    public List<JobResponse> getRelatedJobs(String id) {
        expireOverduePublishedJobs();
        Job job = findJob(id);
        List<String> skills = job.getSkills() != null ? job.getSkills() : List.of();
        if (skills.isEmpty()) return List.of();
        return jobRepository
                .findTop5ByModerationStatusAndVisibilityStatusAndSkillsInAndIdNotAndDeletedFalse(
                        JobModerationStatus.PUBLISHED,
                        JobVisibilityStatus.ACTIVE,
                        skills,
                        id
                )
                .stream().map(jobMapper::toJobResponse).toList();
    }

    public List<JobResponse> getJobsByIds(List<String> ids) {
        if (ids == null || ids.isEmpty()) return List.of();
        expireOverduePublishedJobs();
        return jobRepository.findAllByIdInAndDeletedFalse(ids).stream()
                .map(jobMapper::toJobResponse)
                .toList();
    }

    public List<JobResponse> getActiveJobsByRecruiter(String recruiterId) {
        expireOverduePublishedJobs();
        return jobRepository.findTop20ByRecruiterIdAndModerationStatusAndVisibilityStatusAndDeletedFalse(
                        recruiterId,
                        JobModerationStatus.PUBLISHED,
                        JobVisibilityStatus.ACTIVE
                ).stream()
                .map(jobMapper::toJobResponse)
                .toList();
    }

    public PageResponse<JobResponse> searchJobs(JobSearchRequest request) {
        expireOverduePublishedJobs();
        JobIndexService jobIndexService = jobIndexServiceProvider.getIfAvailable();
        if (jobIndexService == null) {
            return PageResponse.<JobResponse>builder()
                    .items(List.of())
                    .total(0)
                    .page(request.getPage() > 0 ? request.getPage() : 1)
                    .pageSize(request.getSize() > 0 ? request.getSize() : defaultPageSize)
                    .totalPages(0)
                    .build();
        }
        return jobIndexService.search(request);
    }

    private Job findJob(String id) {
        return jobRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new AppException(ErrorCode.JOB_NOT_FOUND));
    }

    private void prepareDraft(Job job, String recruiterId) {
        job.setRecruiterId(recruiterId);
        normalizeMutableFields(job);
        job.setModerationStatus(JobModerationStatus.DRAFT);
        job.setVisibilityStatus(JobVisibilityStatus.INACTIVE);
        job.setDeleted(false);
        if (job.getQualifiedThreshold() == null) job.setQualifiedThreshold(70);
        if (job.getRejectThreshold() == null) job.setRejectThreshold(50);
        if (job.getAutoRejectEnabled() == null) job.setAutoRejectEnabled(false);
    }

    private void normalizeMutableFields(Job job) {
        job.setTitle(trimToNull(job.getTitle()));
        job.setDescription(trimToNull(job.getDescription()));
        job.setCompany(trimToNull(job.getCompany()));
        job.setLocation(trimToNull(job.getLocation()));
        job.setRequiredTest(trimToNull(job.getRequiredTest()));
        job.setNormalizedTitle(normalizeTitle(job.getTitle()));
    }

    private void assertUniqueTitleForCreate(Job job) {
        if (job.getNormalizedTitle() != null
                && jobRepository.existsByRecruiterIdAndNormalizedTitleAndDeletedFalse(
                job.getRecruiterId(),
                job.getNormalizedTitle()
        )) {
            throw new AppException(ErrorCode.JOB_TITLE_ALREADY_EXISTS);
        }
    }

    private void assertUniqueTitleForUpdate(Job job) {
        if (job.getNormalizedTitle() != null
                && jobRepository.existsByRecruiterIdAndNormalizedTitleAndDeletedFalseAndIdNot(
                job.getRecruiterId(),
                job.getNormalizedTitle(),
                job.getId()
        )) {
            throw new AppException(ErrorCode.JOB_TITLE_ALREADY_EXISTS);
        }
    }

    private void assertUniqueTitleForSubmit(Job job) {
        if (job.getNormalizedTitle() != null
                && jobRepository.existsByRecruiterIdAndNormalizedTitleAndDeletedFalseAndIdNot(
                job.getRecruiterId(),
                job.getNormalizedTitle(),
                job.getId()
        )) {
            throw new AppException(ErrorCode.JOB_TITLE_ALREADY_EXISTS);
        }
    }

    private void validatePublishReady(Job job) {
        if (isBlank(job.getTitle())
                || isBlank(job.getDescription())
                || isBlank(job.getCompany())
                || isBlank(job.getLocation())
                || job.getJobType() == null
                || job.getExperienceLevel() == null) {
            throw new AppException(ErrorCode.JOB_STATUS_INVALID);
        }
        if (job.getDeadline() != null && !job.getDeadline().isAfter(LocalDate.now())) {
            throw new AppException(ErrorCode.JOB_STATUS_INVALID);
        }
    }

    private JobVisibilityStatus resolvePublishedVisibility(Job job) {
        if (job.getDeadline() != null && !job.getDeadline().isAfter(LocalDate.now())) {
            return JobVisibilityStatus.EXPIRED;
        }
        return JobVisibilityStatus.ACTIVE;
    }

    private boolean isPubliclyVisible(Job job) {
        return job.getModerationStatus() == JobModerationStatus.PUBLISHED
                && job.getVisibilityStatus() == JobVisibilityStatus.ACTIVE
                && (job.getDeadline() == null || job.getDeadline().isAfter(LocalDate.now()));
    }

    private void expireOverduePublishedJobs() {
        List<Job> overdueJobs = jobRepository.findByModerationStatusAndVisibilityStatusAndDeadlineBeforeAndDeletedFalse(
                JobModerationStatus.PUBLISHED,
                JobVisibilityStatus.ACTIVE,
                LocalDate.now().plusDays(1)
        );
        for (Job job : overdueJobs) {
            if (job.getDeadline() != null && !job.getDeadline().isAfter(LocalDate.now())) {
                job.setVisibilityStatus(JobVisibilityStatus.EXPIRED);
                jobRepository.save(job);
                removeFromIndexIfEnabled(job.getId());
            }
        }
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

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeTitle(String value) {
        String trimmed = trimToNull(value);
        return trimmed == null ? null : trimmed.toLowerCase();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
