package vn.chuongpl.application_service.features.assessment;

import lombok.*;
import lombok.experimental.FieldDefaults;
import vn.chuongpl.application_service.enums.QuestionType;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Question {
    String id;
    String text;
    @Builder.Default
    List<String> options = new java.util.ArrayList<>();
    Integer correctOptionIndex;
    @Builder.Default
    QuestionType type = QuestionType.MCQ;
}
