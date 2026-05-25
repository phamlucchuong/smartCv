package vn.chuongpl.ai_engine_service.integration.application;

import java.util.List;

public record AiScoreResult(
        int aiScore,
        List<String> matchedSkills,
        List<String> missingSkills,
        String aiStatus
) {
}
