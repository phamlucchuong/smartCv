package vn.chuongpl.job_service.features.home;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class FaqItem {
    String id;
    String question;
    String answer;
    String category;
}
