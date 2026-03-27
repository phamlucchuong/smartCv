package vn.chuongpl.user_service.dtos.response;


import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {
    String id;
    String fullName;
    String email;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
