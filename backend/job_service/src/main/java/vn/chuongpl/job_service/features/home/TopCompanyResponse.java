package vn.chuongpl.job_service.features.home;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
public class TopCompanyResponse implements Serializable {
    String recruiterId;
    String name;
    String location;
    long activeJobCount;
}
