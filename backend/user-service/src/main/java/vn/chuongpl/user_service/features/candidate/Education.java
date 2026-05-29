package vn.chuongpl.user_service.features.candidate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Education {
    /** BACHELOR / MASTER / PHD / HIGH_SCHOOL / ASSOCIATE / OTHER */
    String degree;
    String institution;
    String major;
    Integer startYear;
    Integer endYear;
    /** e.g. "3.8/4.0" — stored as string to accommodate different scales */
    String gpa;
}
