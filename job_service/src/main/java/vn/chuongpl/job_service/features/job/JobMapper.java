package vn.chuongpl.job_service.features.job;

import org.mapstruct.*;
import vn.chuongpl.job_service.dtos.request.JobCreateRequest;
import vn.chuongpl.job_service.dtos.request.JobUpdateRequest;
import vn.chuongpl.job_service.dtos.response.JobResponse;

@Mapper(componentModel = "spring")
public interface JobMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "recruiterId", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    Job toJob(JobCreateRequest request);

    JobResponse toJobResponse(Job job);

    @Mapping(target = "jobType", expression = "java(document.getJobType() == null ? null : vn.chuongpl.job_service.enums.JobType.valueOf(document.getJobType()))")
    @Mapping(target = "experienceLevel", expression = "java(document.getExperienceLevel() == null ? null : vn.chuongpl.job_service.enums.ExperienceLevel.valueOf(document.getExperienceLevel()))")
    @Mapping(target = "status", expression = "java(document.getStatus() == null ? null : vn.chuongpl.job_service.enums.JobStatus.valueOf(document.getStatus()))")
    @Mapping(target = "updatedAt", source = "createdAt")
    @Mapping(target = "requirements", ignore = true)
    @Mapping(target = "benefits", ignore = true)
    JobResponse toJobResponse(JobDocument document);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateJob(@MappingTarget Job job, JobUpdateRequest request);

    @Mapping(target = "jobType", expression = "java(job.getJobType() == null ? null : job.getJobType().name())")
    @Mapping(target = "experienceLevel", expression = "java(job.getExperienceLevel() == null ? null : job.getExperienceLevel().name())")
    @Mapping(target = "status", expression = "java(job.getStatus() == null ? null : job.getStatus().name())")
    JobDocument toDocument(Job job);
}
