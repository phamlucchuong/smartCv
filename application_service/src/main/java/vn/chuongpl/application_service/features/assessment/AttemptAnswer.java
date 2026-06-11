package vn.chuongpl.application_service.features.assessment;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AttemptAnswer {
    String questionId;
    Integer selectedOptionIndex;
    String textAnswer;
}
