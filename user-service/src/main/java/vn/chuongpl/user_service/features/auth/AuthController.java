package vn.chuongpl.user_service.features.auth;

import java.text.ParseException;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nimbusds.jose.JOSEException;
import vn.chuongpl.user_service.dtos.request.AuthRequest;
import vn.chuongpl.user_service.dtos.request.IntrospectRequest;
import vn.chuongpl.user_service.dtos.request.RefreshTokenRequest;
import vn.chuongpl.user_service.dtos.request.RegisterRequest;
import vn.chuongpl.user_service.dtos.ApiResponse;
import vn.chuongpl.user_service.dtos.response.AuthResponse;
import vn.chuongpl.user_service.dtos.response.IntrospectResponse;
import vn.chuongpl.user_service.dtos.response.UserResponse;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthController {
    AuthService authService;

    @PostMapping("/register")
    public ApiResponse<UserResponse> register(@RequestBody RegisterRequest request) {
        return ApiResponse.<UserResponse>builder()
                .message("Tạo tài khoản thành công")
                .data(authService.register(request))
                .build();
    }


    @PostMapping("/login")
    public ApiResponse<AuthResponse> authenticated(@RequestBody AuthRequest request) {
        return ApiResponse.<AuthResponse>builder()
                .message("Đăng nhập thành công")
                .data(authService.authenticated(request))
                .build();
    }

    @PostMapping("/introspect")
    public ApiResponse<IntrospectResponse> introspect(@RequestBody IntrospectRequest request)
            throws ParseException, JOSEException {
        return ApiResponse.<IntrospectResponse>builder()
                .data(authService.introspect(request))
                .build();
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@AuthenticationPrincipal Jwt jwt) throws ParseException, JOSEException {
        String token = jwt.getTokenValue();
        authService.logout(token);
        return ApiResponse.<Void>builder()
                .message("Logout successfully")
                .build();
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthResponse> refreshToken(@RequestBody RefreshTokenRequest request)
            throws ParseException, JOSEException {
        return ApiResponse.<AuthResponse>builder().data(authService.refreshToken(request.getRefreshToken())).build();
    }

}
