package vn.chuongpl.application_service.integration.notification;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ApplicationEventMessage implements Serializable {
    String applicationId;
    String candidateId;
    String recruiterId;
    String jobId;
    String newStatus;
    String rejectionReason;
    LocalDateTime occurredAt;
}
