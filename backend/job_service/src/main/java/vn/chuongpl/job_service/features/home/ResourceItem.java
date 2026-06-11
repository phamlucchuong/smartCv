package vn.chuongpl.job_service.features.home;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ResourceItem {
    String id;
    String title;
    String description;
    String url;
    String category;
}
