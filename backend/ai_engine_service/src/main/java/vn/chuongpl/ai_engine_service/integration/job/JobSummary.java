package vn.chuongpl.ai_engine_service.integration.job;

import java.util.List;

public record JobSummary(
        String id,
        String title,
        String company,
        String description,
        List<String> skills,
        List<String> requirements,
        String experienceLevel
) {
}
