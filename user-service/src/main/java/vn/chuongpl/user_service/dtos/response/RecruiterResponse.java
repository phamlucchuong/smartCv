package vn.chuongpl.user_service.dtos.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import vn.chuongpl.user_service.enums.RecruiterStatus;

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
    String taxCode;
    String logoUrl;
    RecruiterStatus status;
    int quotaJobPost;
    int quotaCvViews;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
