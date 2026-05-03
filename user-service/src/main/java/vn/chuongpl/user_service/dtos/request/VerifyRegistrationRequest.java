package vn.chuongpl.user_service.dtos.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VerifyRegistrationRequest {
    @NotBlank(message = "CONTACT_INVALID")
    String contact; // email or phone
    
    @NotBlank(message = "VERIFICATION_TYPE_INVALID")
    String verificationType; // EMAIL or SMS
    
    @NotBlank(message = "OTP_CODE_INVALID")
    String code;
}
