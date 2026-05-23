package vn.chuongpl.ai_engine_service.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error"),
    UNAUTHENTICATED(1005, "Unauthenticated"),
    UNAUTHORIZED(1006, "You do not have permission"),
    CV_TEXT_REQUIRED(8001, "CV text or URL is required"),
    JOB_ID_REQUIRED(8002, "Job ID is required"),
    JOB_NOT_FOUND(8003, "Job not found"),
    AI_PROCESSING_FAILED(8004, "AI processing failed"),
    INVALID_TOP_K(8005, "topK must be between 1 and 50"),
    JOB_SERVICE_UNAVAILABLE(8006, "Job service is currently unavailable");

    private final int code;
    private final String message;
}
