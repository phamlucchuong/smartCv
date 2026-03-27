package vn.chuongpl.user_service.dtos.response;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Set;

@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RoleResponse {
    private String name;
    private String description;
    private Set<PermissionResponse> permissionResponseSet;
}