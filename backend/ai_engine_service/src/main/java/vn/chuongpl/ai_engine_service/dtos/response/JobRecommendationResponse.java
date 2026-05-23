package vn.chuongpl.ai_engine_service.dtos.response;

import java.util.List;

public record JobRecommendationResponse(
        List<JobMatch> recommendations
) {
    public record JobMatch(
            String jobId,
            String title,
            String company,
            int matchScore,
            String matchReason,
            List<String> alignedSkills
    ) {
    }
}
