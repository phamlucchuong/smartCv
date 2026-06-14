package vn.chuongpl.ai_engine_service.integration.application;

public record CvScoringMessage(
        String applicationId,
        String cvUrl,
        String jobId
) {
}
