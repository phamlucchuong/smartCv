package vn.chuongpl.user_service.features.recruiter;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.time.LocalDateTime;

@Document(collection = "recruiters")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Recruiter {
    @MongoId
    String id;

    @Field(name = "user_id")
    String userId;

    @Field(name = "company_name")
    String companyName;

    @Field(name = "company_website")
    String companyWebsite;

    @Field(name = "company_address")
    String companyAddress;

    @Field(name = "company_description")
    String companyDescription;

    @Field(name = "created_at")
    LocalDateTime createdAt;

    @Field(name = "updated_at")
    LocalDateTime updatedAt;

    @Builder.Default
    boolean deleted = false;

    @Field(name = "deleted_at")
    LocalDateTime deletedAt;
}
