package vn.chuongpl.user_service.features.user;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.chuongpl.user_service.dtos.ApiResponse;
import vn.chuongpl.user_service.dtos.PageResponse;
import vn.chuongpl.user_service.dtos.request.ChangePasswordRequest;
import vn.chuongpl.user_service.dtos.request.UpdateRolesRequest;
import vn.chuongpl.user_service.dtos.request.UserUpdateRequest;
import vn.chuongpl.user_service.dtos.response.UserResponse;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserController {
    UserService userService;

    @GetMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN') or #userId == authentication.name")
    public ApiResponse<UserResponse> getUser(@PathVariable String userId) {
        return ApiResponse.<UserResponse>builder().message("Lay thong tin người dùng thành công").data(userService.getUserById(userId)).build();
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<PageResponse<UserResponse>> getAllUsers(@RequestParam Integer page) {
        return ApiResponse.<PageResponse<UserResponse>>builder().message("Lay danh sach người dùng thành công").data(userService.getAllUsers(page != null ? page : 0)).build();
    }

    @GetMapping("/me")
    @PostAuthorize("returnObject.data.id == authentication.name")
    public ApiResponse<UserResponse> getMe(@AuthenticationPrincipal String userId) {
        return ApiResponse.<UserResponse>builder().message("Lay thong người dùng hien tai thành công").data(userService.getUserById(userId)).build();
    }

    @PutMapping("/{userId}")
    public ApiResponse<UserResponse> updateUser(@PathVariable String userId, @RequestBody UserUpdateRequest request) {
        return ApiResponse.<UserResponse>builder().message("Cap nhat người dùng thành công").data(userService.updateUserById(userId, request)).build();
    }

    @PutMapping("/me/password")
    public ApiResponse<Void> changePassword(@AuthenticationPrincipal String userId,
                                            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(userId, request);
        return ApiResponse.<Void>builder().message("Change password successfully").build();
    }

    @PatchMapping("/{userId}/roles")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<UserResponse> updateUserRoles(@PathVariable String userId,
                                                     @Valid @RequestBody UpdateRolesRequest request) {
        return ApiResponse.<UserResponse>builder().data(userService.updateUserRoles(userId, request)).build();
    }

    @DeleteMapping("/{userID}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> deleteUser(@PathVariable String userID) {
        userService.deleteUser(userID);
        return ApiResponse.<Void>builder().message("Xoa người dùng thành công").build();
    }
}
