package vn.chuongpl.application_service.dtos.request;

import lombok.Data;
import lombok.NoArgsConstructor;
import vn.chuongpl.application_service.features.assessment.AttemptAnswer;

import java.util.List;

@Data
@NoArgsConstructor
public class AssessmentAnswerRequest {
    List<AttemptAnswer> answers;
}
