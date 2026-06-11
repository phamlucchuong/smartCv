package vn.chuongpl.application_service.dtos.request;

import lombok.Data;
import lombok.NoArgsConstructor;
import vn.chuongpl.application_service.features.assessment.Question;

import java.util.List;

@Data
@NoArgsConstructor
public class AssessmentCreateRequest {
    String jobId;
    String title;
    String description;
    List<Question> questions;
    int timeLimitMinutes;
}
