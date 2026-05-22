package vn.chuongpl.user_service.dtos.request;
 
import lombok.*;
import lombok.experimental.FieldDefaults;
 
import java.time.LocalDate;
import java.util.List;
 
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CandidateRequest {
    String userId;
    LocalDate dob;
    String gender;
    String address;
    String bio;
    List<String> skills;
}
