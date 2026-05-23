package vn.chuongpl.ai_engine_service.dtos.request;

import jakarta.validation.constraints.NotBlank;

public record CvAnalyzeRequest(
        String cvText,
        String cvUrl,
        @NotBlank(message = "jobId is required") String jobId
) {
}
