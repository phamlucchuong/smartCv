package vn.chuongpl.user_service.features.permission;


import lombok.*;
import org.springframework.data.mongodb.core.mapping.MongoId;


@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Permission {
    @MongoId
    private String name;
    private String description;
}
