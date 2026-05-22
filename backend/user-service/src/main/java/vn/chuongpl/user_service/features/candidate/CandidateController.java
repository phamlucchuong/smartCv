package vn.chuongpl.user_service.features.candidate;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import vn.chuongpl.user_service.dtos.ApiResponse;
import vn.chuongpl.user_service.dtos.PageResponse;
import vn.chuongpl.user_service.dtos.request.CandidateRequest;
import vn.chuongpl.user_service.dtos.response.CandidateResponse;

@RestController
@RequestMapping("/api/candidates")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class CandidateController {
    CandidateService candidateService;

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
                                                 @AuthenticationPrincipal Jwt jwt) {
        boolean isAdmin = jwt.getClaimAsString("scope") != null && jwt.getClaimAsString("scope").contains("ROLE_ADMIN");
        return ApiResponse.<CandidateResponse>builder().data(candidateService.update(id, request, jwt.getSubject(), isAdmin)).build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> delete(@PathVariable String id) {
        candidateService.delete(id);
        return ApiResponse.<Void>builder().build();
    }
}
