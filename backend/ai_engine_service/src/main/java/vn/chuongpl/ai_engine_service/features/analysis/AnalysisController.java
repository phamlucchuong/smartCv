package vn.chuongpl.ai_engine_service.features.analysis;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.chuongpl.ai_engine_service.dtos.ApiResponse;
import vn.chuongpl.ai_engine_service.dtos.request.CvAnalyzeRequest;
import vn.chuongpl.ai_engine_service.dtos.request.CvImproveRequest;
import vn.chuongpl.ai_engine_service.dtos.request.InterviewQuestionsRequest;
import vn.chuongpl.ai_engine_service.dtos.request.JobRecommendRequest;
import vn.chuongpl.ai_engine_service.dtos.response.CvAnalysisResponse;
import vn.chuongpl.ai_engine_service.dtos.response.CvImprovementResponse;
import vn.chuongpl.ai_engine_service.dtos.response.InterviewQuestionsResponse;
import vn.chuongpl.ai_engine_service.dtos.response.JobRecommendationResponse;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AnalysisController {

    private final AnalysisService analysisService;

    @PostMapping("/analyze")
    @PreAuthorize("hasAnyAuthority('ROLE_CANDIDATE','ROLE_ADMIN')")
    public ApiResponse<CvAnalysisResponse> analyze(@RequestBody @Valid CvAnalyzeRequest request) {
        return ApiResponse.<CvAnalysisResponse>builder()
                .data(analysisService.analyze(request))
                .message("Analyze CV successfully")
                .build();
    }

    @PostMapping("/improve")
    @PreAuthorize("hasAnyAuthority('ROLE_CANDIDATE','ROLE_ADMIN')")
    public ApiResponse<CvImprovementResponse> improve(@RequestBody @Valid CvImproveRequest request) {
        return ApiResponse.<CvImprovementResponse>builder()
                .data(analysisService.improve(request))
                .message("Improve CV successfully")
                .build();
    }

    @PostMapping("/recommend")
    @PreAuthorize("hasAnyAuthority('ROLE_CANDIDATE','ROLE_ADMIN')")
    public ApiResponse<JobRecommendationResponse> recommend(@RequestBody @Valid JobRecommendRequest request) {
        return ApiResponse.<JobRecommendationResponse>builder()
                .data(analysisService.recommend(request))
                .message("Recommend jobs successfully")
                .build();
    }

    @PostMapping("/interview-questions")
    @PreAuthorize("hasAnyAuthority('ROLE_RECRUITER','ROLE_ADMIN')")
    public ApiResponse<InterviewQuestionsResponse> interviewQuestions(
            @RequestBody @Valid InterviewQuestionsRequest request) {
        return ApiResponse.<InterviewQuestionsResponse>builder()
                .data(analysisService.generateInterviewQuestions(request))
                .message("Interview questions generated successfully")
                .build();
    }
}
