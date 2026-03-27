package vn.chuongpl.user_service.dtos.response;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PermissionResponse {
    private String name;
    private String description;
}