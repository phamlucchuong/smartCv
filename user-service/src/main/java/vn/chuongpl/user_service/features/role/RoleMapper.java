package vn.chuongpl.user_service.features.role;



import org.mapstruct.Mapper;
import vn.chuongpl.user_service.dtos.response.RoleResponse;

@Mapper(componentModel = "spring")
public interface RoleMapper {
//    @Mapping(target = "permission" , ignore = true)
//    @Mapping(target = "permissions", expression = "new HashSet<>(permissions)")
//    Role toRole(CreateRoleRequest role);
    RoleResponse toRoleResponse(Role role);
//    void toUpdate (@MappingTarget Role role , RoleUpdateRequest request);
}
