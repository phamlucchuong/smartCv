package vn.chuongpl.user_service.dtos.request;
 
import lombok.*;
import lombok.experimental.FieldDefaults;
 
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RecruiterRequest {
    String userId;
    String companyName;
    String companyWebsite;
    String companyAddress;
    String companyDescription;
}
