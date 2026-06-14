package vn.chuongpl.application_service.dtos.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.chuongpl.application_service.enums.AiScoringStatus;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiScoreUpdateRequest {
    int aiScore;
    List<String> matchedSkills;
    List<String> missingSkills;
    AiScoringStatus aiStatus;
}
