package vn.chuongpl.user_service.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error"),
    AUTHENTICATION_FAILED(1001, "Incorrect password"),
    USER_NOT_FOUND(1004, "User not found"),
    UNAUTHENTICATED(1005, "Unauthenticated"),
    UNAUTHORIZED(1006, "You do not have permission to perform this action"),
    PERMISSION_EXISTED(1007, "Permission already exists"),
    ROLE_ALREADY_EXISTS(1008, "Role already exists"),
    ROLE_NOT_FOUND(1009, "Role not found"),
    INVALID_ROLE(1010, "Invalid role, must be CANDIDATE or RECRUITER"),
    EMAIL_EXISTED(3001, "Email already exists"),
    PHONE_EXISTED(3006, "Phone number already exists"),
    INVALID_OTP(3002, "Invalid or expired OTP"),
    USER_NOT_VERIFIED(3003, "User not verified, please verify with OTP"),
    USER_ALREADY_VERIFIED(3004, "User is already verified"),
    WRONG_PASSWORD(3005, "Current password is incorrect"),
    CANDIDATE_EXISTED(4001, "Candidate profile already exists"),
    CANDIDATE_NOT_FOUND(4002, "Candidate profile not found"),
    CV_NOT_FOUND(4003, "CV not found"),
    RECRUITER_EXISTED(5001, "Recruiter profile already exists"),
    RECRUITER_NOT_FOUND(5002, "Recruiter profile not found"),
    COMPANY_NOT_FOUND(5003, "Company not found"),
    FILE_REQUIRED(6001, "File is required"),
    FILE_TOO_LARGE(6002, "File must not exceed 5MB"),
    INVALID_FILE_TYPE(6003, "Only PDF files are accepted"),
    FILE_UPLOAD_FAILED(6004, "Failed to upload file, please try again"),
    INSUFFICIENT_QUOTA(6005, "Insufficient job post quota"),
    USER_LOCKED(1011, "User account is locked");

    private int code;
    private String message;
}
