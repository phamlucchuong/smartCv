package vn.chuongpl.user_service.features.permission;

import org.mapstruct.Mapper;
import vn.chuongpl.user_service.dtos.request.CreatePermissionRequest;
import vn.chuongpl.user_service.dtos.response.PermissionResponse;

@Mapper(componentModel = "spring")
public interface PermissionMapper {
    Permission toPermission(CreatePermissionRequest request);
    PermissionResponse toPermissionResponse(Permission permission);
}
