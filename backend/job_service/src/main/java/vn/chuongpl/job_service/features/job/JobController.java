package vn.chuongpl.job_service.features.job;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.chuongpl.job_service.dtos.ApiResponse;
import vn.chuongpl.job_service.dtos.PageResponse;
import vn.chuongpl.job_service.dtos.request.JobCreateRequest;
import vn.chuongpl.job_service.dtos.request.JobSearchRequest;
import vn.chuongpl.job_service.dtos.request.JobUpdateRequest;
import vn.chuongpl.job_service.dtos.response.JobResponse;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class JobController {
    JobService jobService;

    @PostMapping
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    public ApiResponse<JobResponse> createJob(@Valid @RequestBody JobCreateRequest request,
                                              @AuthenticationPrincipal String userId) {
        return ApiResponse.<JobResponse>builder().data(jobService.createJob(request, userId)).build();
    }

    @GetMapping
    public ApiResponse<PageResponse<JobResponse>> getActiveJobs(@RequestParam(defaultValue = "1") int page,
                                                                @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.<PageResponse<JobResponse>>builder().data(jobService.getActiveJobs(page, size)).build();
    }

    @GetMapping("/search")
    public ApiResponse<PageResponse<JobResponse>> searchJobs(@ModelAttribute JobSearchRequest request) {
        return ApiResponse.<PageResponse<JobResponse>>builder().data(jobService.searchJobs(request)).build();
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    public ApiResponse<PageResponse<JobResponse>> getMyJobs(@AuthenticationPrincipal String userId,
                                                            @RequestParam(defaultValue = "1") int page,
                                                            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.<PageResponse<JobResponse>>builder().data(jobService.getMyJobs(userId, page, size)).build();
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<PageResponse<JobResponse>> getAllJobs(@RequestParam(defaultValue = "1") int page,
                                                             @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.<PageResponse<JobResponse>>builder().data(jobService.getAllJobs(page, size)).build();
    }

    @GetMapping("/{id}")
    public ApiResponse<JobResponse> getJobById(@PathVariable String id) {
        return ApiResponse.<JobResponse>builder().data(jobService.getJobById(id)).build();
    }

    @GetMapping("/{id}/related")
    public ApiResponse<java.util.List<JobResponse>> getRelatedJobs(@PathVariable String id) {
        return ApiResponse.<java.util.List<JobResponse>>builder().data(jobService.getRelatedJobs(id)).build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    public ApiResponse<JobResponse> updateJob(@PathVariable String id,
                                              @RequestBody JobUpdateRequest request,
                                              @AuthenticationPrincipal String userId,
                                              Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        return ApiResponse.<JobResponse>builder().data(jobService.updateJob(id, request, userId, isAdmin)).build();
    }

    @PatchMapping("/{id}/publish")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    public ApiResponse<JobResponse> publishJob(@PathVariable String id,
                                               @AuthenticationPrincipal String userId,
                                               Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        return ApiResponse.<JobResponse>builder().data(jobService.publishJob(id, userId, isAdmin)).build();
    }

    @PatchMapping("/{id}/close")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    public ApiResponse<JobResponse> closeJob(@PathVariable String id,
                                             @AuthenticationPrincipal String userId,
                                             Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        return ApiResponse.<JobResponse>builder().data(jobService.closeJob(id, userId, isAdmin)).build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> deleteJob(@PathVariable String id) {
        jobService.deleteJob(id);
        return ApiResponse.<Void>builder().message("Delete job successfully").build();
    }
}
