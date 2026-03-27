package vn.chuongpl.user_service.exception;

import vn.chuongpl.user_service.enums.ErrorCode;

import lombok.Getter;


@Getter
public class AppException extends RuntimeException {

    private ErrorCode errorCode;
    
    public AppException(ErrorCode errorCode){
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }
    
}
