package vn.chuongpl.user_service.features.role;

import lombok.*;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;
import vn.chuongpl.user_service.features.permission.Permission;

import java.util.Set;

@Document(collection = "role")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Role {
    @MongoId
    private String name;
    private String description;
    Set<Permission> permissions;
}
