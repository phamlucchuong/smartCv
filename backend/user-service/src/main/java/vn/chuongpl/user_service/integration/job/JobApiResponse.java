package vn.chuongpl.user_service.integration.job;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class JobApiResponse<T> {
    private boolean ok;
    private int code;
    private String message;
    private T data;
}
