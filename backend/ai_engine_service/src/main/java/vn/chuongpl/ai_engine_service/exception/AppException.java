package vn.chuongpl.ai_engine_service.exception;

import lombok.Getter;
import vn.chuongpl.ai_engine_service.enums.ErrorCode;

@Getter
public class AppException extends RuntimeException {
    private final ErrorCode errorCode;

    public AppException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }
}
