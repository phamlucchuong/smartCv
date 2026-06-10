package vn.chuongpl.user_service.integration.ai;

import lombok.Data;
import lombok.NoArgsConstructor;
import vn.chuongpl.user_service.features.candidate.JobSuggestion;

import java.util.List;

@Data
@NoArgsConstructor
public class JobSuggestionsMessage {
    String userId;
    List<JobSuggestion> suggestions;
}
