package vn.chuongpl.user_service.dtos.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RegisterRequest {
    @NotBlank(message = "USER_NAME_INVALID")
    String fullname;
    @Email(message = "EMAIL_INVALID")
    String email;
    @Size(min = 8, message = "PASSWORD_INVALID")
    String password;
    String phone;
    String preferredVerification;
    @NotBlank(message = "ROLE_REQUIRED")
    String role;
}
