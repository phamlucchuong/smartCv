package vn.chuongpl.job_service.dtos.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import vn.chuongpl.job_service.enums.ExperienceLevel;
import vn.chuongpl.job_service.enums.JobStatus;
import vn.chuongpl.job_service.enums.JobType;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class JobResponse implements Serializable {
    String id;
    String recruiterId;
    String title;
    String description;
    String company;
    String location;
    Double salaryMin;
    Double salaryMax;
    JobType jobType;
    ExperienceLevel experienceLevel;
    List<String> skills;
    List<String> requirements;
    List<String> benefits;
    JobStatus status;
    LocalDate deadline;
    Integer qualifiedThreshold;
    Integer rejectThreshold;
    Boolean autoRejectEnabled;
    String requiredTest;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
