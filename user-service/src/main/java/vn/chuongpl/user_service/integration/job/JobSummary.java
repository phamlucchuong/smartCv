package vn.chuongpl.user_service.integration.job;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class JobSummary {
    String id;
    String title;
    String company;
    String location;
    Double salaryMin;
    Double salaryMax;
    String jobType;
    String status;
    List<String> skills;
}
