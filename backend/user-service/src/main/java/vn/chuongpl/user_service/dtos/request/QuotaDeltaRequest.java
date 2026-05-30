package vn.chuongpl.user_service.dtos.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuotaDeltaRequest {
    int addJobPosts;
    int addCvViews;
}
