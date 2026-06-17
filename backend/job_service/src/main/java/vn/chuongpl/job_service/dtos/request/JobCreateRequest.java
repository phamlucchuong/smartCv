package vn.chuongpl.job_service.dtos.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;
import vn.chuongpl.job_service.enums.ExperienceLevel;
import vn.chuongpl.job_service.enums.JobType;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class JobCreateRequest {
    @NotBlank String title;
    @NotBlank String description;
    @NotBlank String company;
    @NotBlank String location;
    Double salaryMin;
    Double salaryMax;
    @NotNull JobType jobType;
    @NotNull ExperienceLevel experienceLevel;
    List<String> skills;
    List<String> requirements;
    List<String> benefits;
    LocalDate deadline;
    Integer qualifiedThreshold;
    Integer rejectThreshold;
    Boolean autoRejectEnabled;
    String requiredTest;
}
