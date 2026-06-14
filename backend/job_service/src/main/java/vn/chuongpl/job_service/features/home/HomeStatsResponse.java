package vn.chuongpl.job_service.features.home;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.io.Serializable;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class HomeStatsResponse implements Serializable {
    long activeJobs;
    long activeCompanies;
    long remoteJobs;
}
