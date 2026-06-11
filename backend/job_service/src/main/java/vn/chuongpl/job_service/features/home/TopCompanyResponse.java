package vn.chuongpl.job_service.features.home;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class TopCompanyResponse {
    String recruiterId;
    String name;
    String location;
    long activeJobCount;
}
