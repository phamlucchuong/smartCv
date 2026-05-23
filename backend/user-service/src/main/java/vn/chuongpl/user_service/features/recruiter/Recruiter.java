package vn.chuongpl.user_service.features.recruiter;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.MongoId;
import vn.chuongpl.user_service.enums.RecruiterStatus;

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

    @Field(name = "tax_code")
    String taxCode;

    @Field(name = "logo_url")
    String logoUrl;

    @Builder.Default
    RecruiterStatus status = RecruiterStatus.PENDING;

    @Field(name = "quota_job_post")
    @Builder.Default
    int quotaJobPost = 0;

    @Field(name = "quota_cv_views")
    @Builder.Default
    int quotaCvViews = 0;

    @Field(name = "created_at")
    LocalDateTime createdAt;

    @Field(name = "updated_at")
    LocalDateTime updatedAt;

    @Builder.Default
    boolean deleted = false;

    @Field(name = "deleted_at")
    LocalDateTime deletedAt;
}
