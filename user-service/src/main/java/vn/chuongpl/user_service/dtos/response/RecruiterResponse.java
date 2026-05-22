package vn.chuongpl.user_service.dtos.response;
 
import lombok.*;
import lombok.experimental.FieldDefaults;
 
import java.time.LocalDateTime;
 
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RecruiterResponse {
    String id;
    String userId;
    String fullName;
    String email;
    String phone;
    String companyName;
    String companyWebsite;
    String companyAddress;
    String companyDescription;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
