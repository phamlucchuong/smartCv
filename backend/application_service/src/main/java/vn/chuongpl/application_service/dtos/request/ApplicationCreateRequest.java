package vn.chuongpl.application_service.dtos.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ApplicationCreateRequest {
    @NotBlank String jobId;
    @NotBlank String cvUrl;
    String coverLetter;
}
