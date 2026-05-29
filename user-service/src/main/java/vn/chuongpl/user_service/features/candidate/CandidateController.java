package vn.chuongpl.user_service.features.candidate;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.chuongpl.user_service.dtos.ApiResponse;
import vn.chuongpl.user_service.dtos.PageResponse;
import vn.chuongpl.user_service.dtos.request.CandidateRequest;
import vn.chuongpl.user_service.dtos.response.CandidateResponse;
import vn.chuongpl.user_service.dtos.response.CvUploadResponse;
import vn.chuongpl.user_service.integration.ai.SkillExtractPublisher;

@RestController
@RequestMapping("/api/candidates")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class CandidateController {
    CandidateService candidateService;
    S3Service s3Service;
    SkillExtractPublisher skillExtractPublisher;

    @PostMapping
    @PreAuthorize("hasRole('CANDIDATE')")
    public ApiResponse<CandidateResponse> create(@RequestBody CandidateRequest request) {
        return ApiResponse.<CandidateResponse>builder().data(candidateService.create(request)).build();
    }

    @GetMapping("/{id}")
    public ApiResponse<CandidateResponse> getById(@PathVariable String id) {
        return ApiResponse.<CandidateResponse>builder().data(candidateService.getById(id)).build();
    }

    @GetMapping("/user/{userId}")
    public ApiResponse<CandidateResponse> getByUserId(@PathVariable String userId) {
        return ApiResponse.<CandidateResponse>builder().data(candidateService.getByUserId(userId)).build();
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('RECRUITER')")
    public ApiResponse<PageResponse<CandidateResponse>> getAll(@RequestParam(defaultValue = "1") int page,
                                                               @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.<PageResponse<CandidateResponse>>builder().data(candidateService.getAll(page, size)).build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('CANDIDATE') or hasRole('ADMIN')")
    public ApiResponse<CandidateResponse> update(@PathVariable String id,
                                                 @RequestBody CandidateRequest request,
                                                 @AuthenticationPrincipal String userId,
                                                 Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        return ApiResponse.<CandidateResponse>builder().data(candidateService.update(id, request, userId, isAdmin)).build();
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ApiResponse<CandidateResponse> getMe(@AuthenticationPrincipal String userId) {
        return ApiResponse.<CandidateResponse>builder().data(candidateService.getMe(userId)).build();
    }

    @PostMapping("/cv/upload")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ApiResponse<CvUploadResponse> uploadCv(@RequestParam("file") MultipartFile file,
                                                   @AuthenticationPrincipal String userId) {
        String url = s3Service.uploadCv(file, userId);
        candidateService.saveCvUrl(userId, url);
        skillExtractPublisher.publish(userId, url);
        return ApiResponse.<CvUploadResponse>builder()
                .message("CV uploaded successfully")
                .data(new CvUploadResponse(url))
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> delete(@PathVariable String id) {
        candidateService.delete(id);
        return ApiResponse.<Void>builder().build();
    }
}
