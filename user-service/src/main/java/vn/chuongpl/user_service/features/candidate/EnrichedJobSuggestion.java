package vn.chuongpl.user_service.features.candidate;

import lombok.*;
import lombok.experimental.FieldDefaults;
import vn.chuongpl.user_service.integration.job.JobSummary;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EnrichedJobSuggestion {
    String jobId;
    Integer matchScore;
    String matchReason;
    List<String> alignedSkills;
    LocalDateTime suggestedAt;
    JobSummary job;
}
