package vn.chuongpl.user_service.features.role;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import vn.chuongpl.user_service.dtos.request.CreateRoleRequest;
import vn.chuongpl.user_service.dtos.response.RoleResponse;
import vn.chuongpl.user_service.enums.ErrorCode;
import vn.chuongpl.user_service.exception.AppException;
import vn.chuongpl.user_service.features.permission.Permission;
import vn.chuongpl.user_service.features.permission.PermissionRepository;
import vn.chuongpl.user_service.features.permission.PermissionService;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RoleService {
    RoleRepository roleRepository;
    PermissionRepository permissionRepository;
    RoleMapper roleMapper;
    PermissionService permissionService;

    public RoleResponse createRole(CreateRoleRequest request) {
        if (roleRepository.existsById(request.getName())) {
            throw new AppException(ErrorCode.ROLE_ALREADY_EXISTS);
        }

        Role role = new Role(request.getName(), request.getDescription(), null);
        var permissions = permissionRepository.findAllById(request.getPermissions());

        role.setPermissions(new HashSet<>(permissions));
        return roleMapper.toRoleResponse(roleRepository.save(role));
    }

    public Optional<Role> findById(String name) {
        return roleRepository.findById(name);
    }

    public List<RoleResponse> getAllRole() {
        List<RoleResponse> listRole = roleRepository.findAll()
                .stream().map(roleMapper::toRoleResponse).toList();
        return listRole;
    }

    public RoleResponse updateRole(String name, CreateRoleRequest request) {
        var role = roleRepository.findById(name).orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
        role.setName(request.getName());
        role.setDescription(request.getDescription());
        List<Permission> permissions = permissionService.getAllById(request.getPermissions());
        role.setPermissions(new HashSet<>(permissions));
        return roleMapper.toRoleResponse(roleRepository.save(role));
    }

    public void deleteRole(String name) {
        roleRepository.deleteById(name);
    }

    public RoleResponse getRoleByName(String roleName) {
        return roleMapper.toRoleResponse(
                roleRepository.findById(roleName)
                        .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND))
        );
    }
}
