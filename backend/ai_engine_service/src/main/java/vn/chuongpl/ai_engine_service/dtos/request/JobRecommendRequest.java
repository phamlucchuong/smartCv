package vn.chuongpl.ai_engine_service.dtos.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record JobRecommendRequest(
        String cvText,
        String cvUrl,
        @Min(value = 1, message = "topK must be >= 1")
        @Max(value = 50, message = "topK must be <= 50")
        Integer topK
) {
}
