package vn.chuongpl.application_service.dtos.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import vn.chuongpl.application_service.enums.AssessmentStatus;
import vn.chuongpl.application_service.features.assessment.Question;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AssessmentResponse {
    String id;
    String jobId;
    String recruiterId;
    String title;
    String description;
    List<Question> questions;
    int timeLimitMinutes;
    AssessmentStatus status;
    LocalDateTime createdAt;
}
