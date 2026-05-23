package vn.chuongpl.application_service.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error"),
    UNAUTHENTICATED(1005, "Unauthenticated"),
    UNAUTHORIZED(1006, "You do not have permission to perform this action"),
    APPLICATION_NOT_FOUND(7001, "Application not found"),
    APPLICATION_ALREADY_EXISTS(7002, "You have already applied for this job"),
    APPLICATION_STATUS_TERMINAL(7003, "Application is already in a terminal state"),
    APPLICATION_INVALID_TRANSITION(7004, "Invalid status transition"),
    JOB_NOT_FOUND(7005, "Job not found"),
    JOB_NOT_ACCEPTING_APPLICATIONS(7006, "This job is not accepting applications"),
    JOB_SERVICE_UNAVAILABLE(7007, "Job service is currently unavailable");

    private final int code;
    private final String message;
}
