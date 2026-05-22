package vn.chuongpl.user_service.features.permission;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import vn.chuongpl.user_service.dtos.request.CreatePermissionRequest;
import vn.chuongpl.user_service.dtos.response.PermissionResponse;
import vn.chuongpl.user_service.enums.ErrorCode;
import vn.chuongpl.user_service.exception.AppException;

@Service
public class PermissionService {
    @Autowired
    PermissionRepository permissionRepository;
    @Autowired
    PermissionMapper permissionMapper;

    public List<Permission> getAllById(List<String> permissions) {
        return permissionRepository.findAllById(permissions);
    }

    public PermissionResponse createPermission(CreatePermissionRequest request){
        if(permissionRepository.existsById(request.getName())){
            throw new AppException(ErrorCode.PERMISSION_EXISTED);
        }
        var permission = permissionMapper.toPermission(request);
        return permissionMapper.toPermissionResponse(permissionRepository.save(permission));
    }

    public List<PermissionResponse> getAllPermissionResponses(){
        List<PermissionResponse> permissions = permissionRepository
                .findAll()
                .stream()
                .map(permissionMapper::toPermissionResponse)
                .toList();
        return permissions;
    }
    public void deletePermission(String name){
        permissionRepository.deleteById(name);
    }
}
