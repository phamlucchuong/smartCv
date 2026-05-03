package vn.chuongpl.user_service.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error"),
    USER_NOT_FOUND(1004, "User not found"),
    AUTHENTICATION_FAILED(1001, "Incorrect password"),
    UNAUTHENTICATED(1004, "No permission"),
    PERMISSION_EXITED(1009, "Permission exited"),
    ROLE_ALREADY_EXISTS(1009, "Role exited"),
    ROLE_NOT_FOUND(1009, "Role exited"),
    EMAIL_EXISTED(3001, "Email existed"),
    INVALID_OTP(3002, "Invalid or expired OTP"),
    USER_NOT_VERIFIED(3003, "User not verified, please verify with OTP");

    private int code;
    private String message;
}