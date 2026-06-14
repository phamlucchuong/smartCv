package vn.chuongpl.application_service.dtos.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;
import vn.chuongpl.application_service.enums.ApplicationStatus;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ApplicationStatusUpdateRequest {
    @NotNull ApplicationStatus status;
    String rejectionReason;
    String recruiterNotes;
}
