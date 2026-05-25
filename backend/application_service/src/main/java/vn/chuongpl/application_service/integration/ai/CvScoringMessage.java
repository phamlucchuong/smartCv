package vn.chuongpl.application_service.integration.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CvScoringMessage {
    String applicationId;
    String cvUrl;
    String jobId;
}
