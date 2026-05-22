package vn.chuongpl.user_service.dtos.response;
 
import lombok.*;
import lombok.experimental.FieldDefaults;
 
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
 
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CandidateResponse {
    String id;
    String userId;
    String fullName;
    String email;
    String phone;
    LocalDate dob;
    String gender;
    String address;
    String bio;
    List<String> skills;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
