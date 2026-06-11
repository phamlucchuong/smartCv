package vn.chuongpl.application_service.features.assessment;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.chuongpl.application_service.dtos.ApiResponse;
import vn.chuongpl.application_service.dtos.request.AssessmentAnswerRequest;
import vn.chuongpl.application_service.dtos.request.AssessmentCreateRequest;
import vn.chuongpl.application_service.dtos.response.AssessmentResponse;
import vn.chuongpl.application_service.dtos.response.AssessmentResultResponse;
import vn.chuongpl.application_service.dtos.response.AttemptStateResponse;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class AssessmentController {

    AssessmentService assessmentService;

    // ── Recruiter endpoints ────────────────────────────────────────────────────

    @PostMapping("/api/assessments")
    @PreAuthorize("hasRole('RECRUITER')")
    public ApiResponse<AssessmentResponse> createAssessment(
            @RequestBody AssessmentCreateRequest request,
            @AuthenticationPrincipal String userId) {
        return ApiResponse.<AssessmentResponse>builder()
                .data(assessmentService.createAssessment(request, userId))
                .build();
    }

    @PatchMapping("/api/assessments/{id}/assign")
    @PreAuthorize("hasRole('RECRUITER')")
    public ApiResponse<Void> assignToCandidate(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal String userId) {
        assessmentService.assignToCandidate(id, body.get("candidateId"), userId);
        return ApiResponse.<Void>builder().message("Assessment assigned").build();
    }

    // ── Candidate endpoints ────────────────────────────────────────────────────

    @GetMapping("/api/assessments/my")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ApiResponse<List<AttemptStateResponse>> getMyAssessments(@AuthenticationPrincipal String userId) {
        return ApiResponse.<List<AttemptStateResponse>>builder()
                .data(assessmentService.getMyAssessments(userId))
                .build();
    }

    @GetMapping("/api/assessments/{id}")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ApiResponse<AssessmentResponse> getAssessment(@PathVariable String id) {
        return ApiResponse.<AssessmentResponse>builder()
                .data(assessmentService.getAssessment(id))
                .build();
    }

    @PostMapping("/api/assessments/{id}/start")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ApiResponse<Map<String, String>> startAttempt(
            @PathVariable String id,
            @AuthenticationPrincipal String userId) {
        String attemptId = assessmentService.startAttempt(id, userId);
        return ApiResponse.<Map<String, String>>builder()
                .data(Map.of("attemptId", attemptId))
                .build();
    }

    @GetMapping("/api/attempts/{attemptId}")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ApiResponse<AttemptStateResponse> getAttemptState(
            @PathVariable String attemptId,
            @AuthenticationPrincipal String userId) {
        return ApiResponse.<AttemptStateResponse>builder()
                .data(assessmentService.getAttemptState(attemptId, userId))
                .build();
    }

    @PostMapping("/api/attempts/{attemptId}/answers")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ApiResponse<Void> saveAnswers(
            @PathVariable String attemptId,
            @RequestBody AssessmentAnswerRequest request,
            @AuthenticationPrincipal String userId) {
        assessmentService.saveAnswers(attemptId, request, userId);
        return ApiResponse.<Void>builder().message("Answers saved").build();
    }

    @PostMapping("/api/attempts/{attemptId}/submit")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ApiResponse<Void> submitAttempt(
            @PathVariable String attemptId,
            @AuthenticationPrincipal String userId) {
        assessmentService.submitAttempt(attemptId, userId);
        return ApiResponse.<Void>builder().message("Assessment submitted").build();
    }

    @GetMapping("/api/attempts/{attemptId}/result")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ApiResponse<AssessmentResultResponse> getResult(
            @PathVariable String attemptId,
            @AuthenticationPrincipal String userId) {
        return ApiResponse.<AssessmentResultResponse>builder()
                .data(assessmentService.getResult(attemptId, userId))
                .build();
    }
}
