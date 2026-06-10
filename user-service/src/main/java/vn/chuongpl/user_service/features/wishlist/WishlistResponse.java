package vn.chuongpl.user_service.features.wishlist;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WishlistResponse {
    String jobId;
    String title;
    String company;
    Double salaryMin;
    Double salaryMax;
    String location;
    List<String> skills;
    String jobType;
    String jobStatus;
    LocalDateTime savedAt;
}
