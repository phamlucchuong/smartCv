package vn.chuongpl.user_service.features.wishlist;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.chuongpl.user_service.dtos.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/wishlists")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class WishlistController {
    WishlistService wishlistService;

    @GetMapping
    @PreAuthorize("hasRole('CANDIDATE')")
    public ApiResponse<List<WishlistResponse>> getMyWishlists(@AuthenticationPrincipal String userId) {
        return ApiResponse.<List<WishlistResponse>>builder()
                .data(wishlistService.getMyWishlists(userId))
                .build();
    }

    @PostMapping
    @PreAuthorize("hasRole('CANDIDATE')")
    public ApiResponse<Void> save(@RequestBody WishlistSaveRequest request,
                                   @AuthenticationPrincipal String userId) {
        wishlistService.save(userId, request.getJobId());
        return ApiResponse.<Void>builder().message("Job saved to wishlist").build();
    }

    @DeleteMapping("/{jobId}")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ApiResponse<Void> remove(@PathVariable String jobId,
                                     @AuthenticationPrincipal String userId) {
        wishlistService.remove(userId, jobId);
        return ApiResponse.<Void>builder().message("Job removed from wishlist").build();
    }

    @GetMapping("/contains/{jobId}")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ApiResponse<Boolean> contains(@PathVariable String jobId,
                                          @AuthenticationPrincipal String userId) {
        return ApiResponse.<Boolean>builder()
                .data(wishlistService.contains(userId, jobId))
                .build();
    }
}
