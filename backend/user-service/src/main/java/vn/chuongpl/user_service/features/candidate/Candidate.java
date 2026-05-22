package vn.chuongpl.user_service.features.candidate;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "candidates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Candidate {
    @MongoId
    String id;

    @Field(name = "user_id")
    String userId;

    LocalDate dob;
    String gender;
    String address;
    String bio;
    List<String> skills;

    @Field(name = "created_at")
    LocalDateTime createdAt;

    @Field(name = "updated_at")
    LocalDateTime updatedAt;

    @Builder.Default
    boolean deleted = false;

    @Field(name = "deleted_at")
    LocalDateTime deletedAt;
}
