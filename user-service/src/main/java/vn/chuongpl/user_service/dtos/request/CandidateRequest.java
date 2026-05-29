package vn.chuongpl.user_service.dtos.request;

import lombok.*;
import lombok.experimental.FieldDefaults;
import vn.chuongpl.user_service.enums.JobType;
import vn.chuongpl.user_service.features.candidate.*;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CandidateRequest {
    String userId;

    // ── Basic info ────────────────────────────────────────────────────────────
    LocalDate dob;
    String gender;
    String address;
    String bio;
    String title;
    String avatarUrl;

    // ── Skills & experience ──────────────────────────────────────────────────
    List<String> skills;
    Integer yearsOfExperience;
    List<WorkExperience> experiences;
    List<Education> educations;
    List<Certification> certifications;
    List<Language> languages;

    // ── Preferences ──────────────────────────────────────────────────────────
    JobType jobType;
    String preferredLocation;
    Integer expectedSalaryMin;
    Integer expectedSalaryMax;

    // ── Online presence ───────────────────────────────────────────────────────
    String portfolioUrl;
    String githubUrl;
    String linkedinUrl;
}
