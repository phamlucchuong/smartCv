package vn.chuongpl.application_service.dtos.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import vn.chuongpl.application_service.enums.ApplicationStatus;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ApplicationResponse {
    String id;
    String candidateId;
    String jobId;
    String recruiterId;
    ApplicationStatus status;
    String coverLetter;
    String cvUrl;
    String rejectionReason;
    LocalDateTime appliedAt;
    LocalDateTime updatedAt;
}
