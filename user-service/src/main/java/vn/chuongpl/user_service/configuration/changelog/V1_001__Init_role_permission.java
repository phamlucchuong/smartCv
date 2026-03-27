package vn.chuongpl.user_service.configuration.changelog;


import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;
import vn.chuongpl.user_service.features.permission.Permission;
import vn.chuongpl.user_service.features.role.Role;
import vn.chuongpl.user_service.features.user.User;

import java.time.LocalDateTime;
import java.util.Set;

@ChangeUnit(id = "V1_001__Init_role_permission", order = "001", author = "chuongpl")
public class V1_001__Init_role_permission {
    @Execution
    public void initData(MongoTemplate mongoTemplate) {
        // 1. Tạo Permission
        Permission viewUser = Permission.builder().name("VIEW_USER").description("See user information").build();
        Permission editUser = Permission.builder().name("EDIT_USER").description("Update user information").build();
        mongoTemplate.save(viewUser);
        mongoTemplate.save(editUser);

        // 2. Tạo Role và nhúng Permission (Embedded)
        Role adminRole = Role.builder()
                .name("ADMIN")
                .description("System administrator with full access")
                .permissions(Set.of(viewUser, editUser))
                .build();

        User adminUser = User.builder()
                .fullName("admin")
                .email("admin@gmail.com")
                .password("$2a$10$mGl6Qnn6RPj5sCcQojIFj.yvBtWF88/whqo57Hllz2XcbZUO1Rx5.")
                .phone("0377948504")
                .createdAt(LocalDateTime.now())
                .roles(Set.of(adminRole))
                .build();

        mongoTemplate.save(adminRole);
        mongoTemplate.save(adminUser);
    }

    @RollbackExecution
    public void rollback() {
        // Logic để hoàn tác nếu cần thiết
    }
}
