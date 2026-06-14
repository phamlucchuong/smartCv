package vn.chuongpl.user_service.features.user;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.*;
import vn.chuongpl.user_service.features.role.Role;

import java.time.LocalDateTime;
import java.util.Set;

@Document(collection = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class User {
    @MongoId
    String id;
    @Field(name = "full_name")
    String fullName;
    String email;
    String password;
    @Indexed(sparse = true)
    String phone;
    @Field(name = "avt_image_id")
    String avtImageId;
    @Field(name = "created_at")
    LocalDateTime createdAt;
    @Field(name = "updated_at")
    LocalDateTime updatedAt;
    @Field(name = "deleted_at")
    LocalDateTime deletedAt;
    @Builder.Default
    boolean verified = false;
    @Builder.Default
    boolean deleted = false;
    @Builder.Default
    boolean locked = false;
    @DocumentReference
    Set<Role> roles;
}
