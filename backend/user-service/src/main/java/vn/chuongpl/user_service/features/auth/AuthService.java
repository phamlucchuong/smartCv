package vn.chuongpl.user_service.features.auth;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import vn.chuongpl.user_service.dtos.request.*;
import vn.chuongpl.user_service.dtos.response.AuthResponse;
import vn.chuongpl.user_service.dtos.response.IntrospectResponse;
import vn.chuongpl.user_service.dtos.response.UserResponse;
import vn.chuongpl.user_service.enums.ErrorCode;
import vn.chuongpl.user_service.exception.AppException;
import vn.chuongpl.user_service.features.candidate.CandidateService;
import vn.chuongpl.user_service.features.recruiter.RecruiterService;
import vn.chuongpl.user_service.features.role.Role;
import vn.chuongpl.user_service.features.role.RoleService;
import vn.chuongpl.user_service.features.user.User;
import vn.chuongpl.user_service.features.user.UserMapper;
import vn.chuongpl.user_service.features.user.UserService;
import vn.chuongpl.user_service.integration.notification.NotificationClient;

import java.text.ParseException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class AuthService {
    UserService userService;
    RoleService roleService;
    UserMapper userMapper;
    PasswordEncoder passwordEncoder;
    JwtBlacklistService jwtBlacklistService;
    NotificationClient notificationClient;
    CandidateService candidateService;
    RecruiterService recruiterService;

    @NonFinal
    @Value("${JWT_SECRET_KEY}")
    protected String SIGNER_KEY;
    @NonFinal
    @Value("${JWT_VALID_DURATION}")
    protected long VALID_DURATION;
    @NonFinal
    @Value("${JWT_REFRESHABLE_DURATION}")
    protected long REFRESHABLE_DURATION;
    @NonFinal
    @Value("${JWT_LONG_REFRESHABLE_DURATION}")
    protected long LONG_REFRESHABLE_DURATION;

    public Map<String, String> authenticated(AuthRequest request) {
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        var user = userService.findByEmailAndDeletedFalse(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPassword());
        if (!authenticated) {
            throw new AppException(ErrorCode.AUTHENTICATION_FAILED);
        }
        if (!user.isVerified()) {
            throw new AppException(ErrorCode.USER_NOT_VERIFIED);
        }

        Map<String, String> tokens = new HashMap<>();
        tokens.put("accessToken", generateToken(user, VALID_DURATION));
        tokens.put("refreshToken", generateToken(user, REFRESHABLE_DURATION));

        return tokens;
    }

    public UserResponse register(RegisterRequest request) {
        userService.findByEmail(request.getEmail()).ifPresent(existing -> {
            if (existing.isVerified()) throw new AppException(ErrorCode.EMAIL_EXISTED);
            userService.deleteUser(existing.getId());
        });

        String roleName = request.getRole().toUpperCase();
        if (!roleName.equals("CANDIDATE") && !roleName.equals("RECRUITER")) {
            throw new AppException(ErrorCode.ROLE_NOT_FOUND);
        }

        User user = userMapper.toUser(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setVerified(false);

        HashSet<Role> roles = new HashSet<>();
        Role role = roleService.findById(roleName).orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
        roles.add(role);
        user.setRoles(roles);
        user.setCreatedAt(LocalDateTime.now());

        User savedUser = userService.saveUser(user);

        String target = "SMS".equalsIgnoreCase(request.getPreferredVerification()) ? request.getPhone() : request.getEmail();
        notificationClient.sendOTP(target, request.getPreferredVerification(), "VERIFY_ACCOUNT");

        return userMapper.toUserResponse(savedUser);
    }

    public AuthResponse verifyRegistration(VerifyRegistrationRequest request) {
        boolean isValid = notificationClient.verifyOTP(request.getContact(), request.getVerificationType(), request.getCode(), "VERIFY_ACCOUNT");
        if (!isValid) {
            throw new AppException(ErrorCode.INVALID_OTP);
        }

        User user = findUserByContact(request.getContact(), request.getVerificationType());
        user.setVerified(true);
        user.setUpdatedAt(LocalDateTime.now());
        userService.saveUser(user);

        user.getRoles().forEach(role -> {
            if ("CANDIDATE".equals(role.getName())) {
                candidateService.createBasicProfile(user.getId());
            } else if ("RECRUITER".equals(role.getName())) {
                recruiterService.createBasicProfile(user.getId());
            }
        });

        return AuthResponse.builder()
                .token(generateToken(user, VALID_DURATION))
                .refreshToken(generateToken(user, REFRESHABLE_DURATION))
                .authenticated(true)
                .build();
    }

    public void resendOtp(ResendOtpRequest request) {
        User user = findUserByContact(request.getContact(), request.getPreferredVerification());
        if (user.isVerified()) {
            throw new AppException(ErrorCode.USER_ALREADY_VERIFIED);
        }
        notificationClient.sendOTP(request.getContact(), request.getPreferredVerification(), "VERIFY_ACCOUNT");
    }

    public void forgotPassword(ForgotPasswordRequest request) {
        findUserByContact(request.getContact(), request.getPreferredVerification());
        notificationClient.sendOTP(request.getContact(), request.getPreferredVerification(), "RESET_PASSWORD");
    }

    public void resetPassword(ResetPasswordRequest request) {
        boolean isValid = notificationClient.verifyOTP(request.getContact(), request.getVerificationType(), request.getCode(), "RESET_PASSWORD");
        if (!isValid) {
            throw new AppException(ErrorCode.INVALID_OTP);
        }
        User user = findUserByContact(request.getContact(), request.getVerificationType());
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(LocalDateTime.now());
        userService.saveUser(user);
    }

    public IntrospectResponse introspect(IntrospectRequest request) throws JOSEException, ParseException {
        var token = request.getToken();
        boolean isValid = true;
        try {
            verifyToken(token, false);
        } catch (Exception e) {
            isValid = false;
        }
        return IntrospectResponse.builder().authenticated(isValid).build();
    }

    public void logout(String token) throws JOSEException, ParseException {
        var signToken = verifyToken(token, false);
        var expriryDate = signToken.getJWTClaimsSet().getExpirationTime();

        long currentTimeMillis = System.currentTimeMillis();
        long diffInSeconds = expriryDate.getTime() - currentTimeMillis;
        if (diffInSeconds > 0) {
            jwtBlacklistService.addTokenToBlacklist(token, diffInSeconds);
        }
    }

    private SignedJWT verifyToken(String token, boolean isRefresh) throws JOSEException, ParseException {
        JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());

        SignedJWT signedJWT = SignedJWT.parse(token);

        Date expirityTime = (isRefresh)
                ? new Date(signedJWT.getJWTClaimsSet().getIssueTime().toInstant().plus(REFRESHABLE_DURATION, ChronoUnit.SECONDS).toEpochMilli())
                : signedJWT.getJWTClaimsSet().getExpirationTime();

        boolean verify = signedJWT.verify(verifier);

        if (!verify || expirityTime.before(new Date()) || jwtBlacklistService.isBlacklisted(token)) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return signedJWT;
    }

    private String generateToken(User user, long validDuration) {
        JWSHeader jwsHeader = new JWSHeader(JWSAlgorithm.HS512);
        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                .subject(user.getId())
                .issuer("vn.chuongpl.user_service")
                .issueTime(new Date())
                .expirationTime(Date.from(Instant.now().plus(validDuration, ChronoUnit.MINUTES)))
                .jwtID(UUID.randomUUID().toString())
                .claim("scope", buildScope(user))
                .build();
        Payload payload = new Payload(jwtClaimsSet.toJSONObject());
        JWSObject jwsObject = new JWSObject(jwsHeader, payload);
        try {
            jwsObject.sign(new MACSigner(SIGNER_KEY));
        } catch (Exception e) {
            log.debug("Không thể tạo token với lỗi = " + e.getMessage());
            throw new RuntimeException(e);
        }
        return jwsObject.serialize();
    }

    private String buildScope(User account) {
        StringJoiner jStringJoiner = new StringJoiner(" ");
        if (!CollectionUtils.isEmpty(account.getRoles())) {
            account.getRoles().forEach(role -> {
                jStringJoiner.add("ROLE_" + role.getName());
                if (!CollectionUtils.isEmpty(role.getPermissions())) {
                    role.getPermissions().forEach(permission -> jStringJoiner.add(permission.getName()));
                }
            });
        }
        return jStringJoiner.toString();
    }

    public AuthResponse refreshToken(String token) throws JOSEException, ParseException {
        var signedJwt = verifyToken(token, true);

        var expirationTime = signedJwt.getJWTClaimsSet().getExpirationTime();
        jwtBlacklistService.addTokenToBlacklist(token, (expirationTime.getTime() - System.currentTimeMillis()) / 1000);

        var userId = signedJwt.getJWTClaimsSet().getSubject();
        var user = userService.getById(userId);

        var refreshToken = generateToken(user, LONG_REFRESHABLE_DURATION);

        return AuthResponse.builder()
                .token(refreshToken)
                .refreshToken(token)
                .authenticated(true)
                .build();
    }

    private User findUserByContact(String contact, String targetType) {
        if ("SMS".equalsIgnoreCase(targetType)) {
            return userService.findByPhone(contact).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        }
        return userService.findByEmailAndDeletedFalse(contact).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }
}
