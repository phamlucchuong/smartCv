package vn.chuongpl.user_service.features.candidate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkExperience {
    String title;
    String company;
    String location;
    LocalDate startDate;
    LocalDate endDate;
    boolean current;
    String description;
}
