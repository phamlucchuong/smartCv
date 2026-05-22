package vn.chuongpl.user_service.features.auth;

import java.text.ParseException;
import java.util.Map;

import com.nimbusds.jose.JOSEException;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import vn.chuongpl.user_service.dtos.ApiResponse;
import vn.chuongpl.user_service.dtos.request.*;
import vn.chuongpl.user_service.dtos.response.AuthResponse;
import vn.chuongpl.user_service.dtos.response.IntrospectResponse;
import vn.chuongpl.user_service.dtos.response.UserResponse;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthController {
    @NonFinal
    @Value("${JWT_VALID_DURATION}")
    protected long VALID_DURATION;
    @NonFinal
    @Value("${JWT_REFRESHABLE_DURATION}")
    protected long REFRESHABLE_DURATION;

    AuthService authService;

    @PostMapping("/register")
    public ApiResponse<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.<UserResponse>builder()
                .message("Please verify your account with the OTP sent to your " +
                        ("SMS".equalsIgnoreCase(request.getPreferredVerification()) ? "phone" : "email"))
                .data(authService.register(request))
                .build();
    }

    @PostMapping("/verify-registration")
    public ApiResponse<AuthResponse> verifyRegistration(@Valid @RequestBody VerifyRegistrationRequest request) {
        return ApiResponse.<AuthResponse>builder()
                .message("Account verified successfully")
                .data(authService.verifyRegistration(request))
                .build();
    }

    @PostMapping("/resend-otp")
    public ApiResponse<Void> resendOtp(@Valid @RequestBody ResendOtpRequest request) {
        authService.resendOtp(request);
        return ApiResponse.<Void>builder().message("OTP resent successfully").build();
    }

    @PostMapping("/forgot-password")
    public ApiResponse<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ApiResponse.<Void>builder().message("Password reset OTP sent").build();
    }

    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ApiResponse.<Void>builder().message("Password reset successfully").build();
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> authenticated(@RequestBody AuthRequest request, HttpServletResponse response) {
        Map<String, String> tokens = authService.authenticated(request);

        ResponseCookie accessTokenCookie = ResponseCookie.from("accessToken", tokens.get("accessToken"))
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(VALID_DURATION)
                .sameSite("Lax")
                .build();

        ResponseCookie refreshTokenCookie = ResponseCookie.from("refreshToken", tokens.get("refreshToken"))
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(REFRESHABLE_DURATION)
                .sameSite("Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, accessTokenCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString());

        return ApiResponse.<AuthResponse>builder().message("Đăng nhập thành công").build();
    }

    @PostMapping("/introspect")
    public ApiResponse<IntrospectResponse> introspect(@RequestBody IntrospectRequest request)
            throws ParseException, JOSEException {
        return ApiResponse.<IntrospectResponse>builder().data(authService.introspect(request)).build();
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@AuthenticationPrincipal Jwt jwt) throws ParseException, JOSEException {
        String token = jwt.getTokenValue();
        authService.logout(token);
        return ApiResponse.<Void>builder().message("Logout successfully").build();
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthResponse> refreshToken(@RequestBody RefreshTokenRequest request)
            throws ParseException, JOSEException {
        return ApiResponse.<AuthResponse>builder().data(authService.refreshToken(request.getRefreshToken())).build();
    }
}
