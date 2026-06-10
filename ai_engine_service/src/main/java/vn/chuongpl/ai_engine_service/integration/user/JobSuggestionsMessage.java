package vn.chuongpl.ai_engine_service.integration.user;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobSuggestionsMessage {
    String userId;
    List<JobSuggestionItem> suggestions;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JobSuggestionItem {
        String jobId;
        Integer matchScore;
        String matchReason;
        List<String> alignedSkills;
    }
}
