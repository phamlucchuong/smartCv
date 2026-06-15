package vn.chuongpl.user_service.features.candidate;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.chuongpl.user_service.dtos.ApiResponse;
import vn.chuongpl.user_service.dtos.request.SkillMergeRequest;
import vn.chuongpl.user_service.features.candidate.dto.CvAnalysisUpdateRequest;
import vn.chuongpl.user_service.features.candidate.dto.CvInfoResponse;

@RestController
@RequestMapping("/api/internal/candidates")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class InternalCandidateController {

    CandidateService candidateService;

    @PatchMapping("/by-user/{userId}/skills")
    public ApiResponse<Void> mergeSkills(@PathVariable String userId,
                                         @RequestBody SkillMergeRequest request) {
        candidateService.mergeSkills(userId, request.getSkills());
        return ApiResponse.<Void>builder().message("Skills merged").build();
    }

    @GetMapping("/cvs/{cvId}")
    public ApiResponse<CvInfoResponse> getCvInfo(@PathVariable String cvId) {
        return ApiResponse.<CvInfoResponse>builder()
                .data(candidateService.getCvInfo(cvId))
                .message("CV info retrieved")
                .build();
    }

    @PatchMapping("/cvs/{cvId}/analysis")
    public ApiResponse<Void> updateCvAnalysis(@PathVariable String cvId,
                                               @RequestBody CvAnalysisUpdateRequest request) {
        candidateService.updateCvAnalysis(cvId, request.analysisResult(), request.analysisStatus());
        return ApiResponse.<Void>builder().message("CV analysis updated").build();
    }
}
