package vn.chuongpl.user_service.features.candidate;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class JobSuggestion {
    String jobId;
    Integer matchScore;
    String matchReason;
    List<String> alignedSkills;
    LocalDateTime suggestedAt;
}
