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

    // ── Company info ──────────────────────────────────────────────────────────
    @Field(name = "company_name")
    String companyName;

    @Field(name = "company_website")
    String companyWebsite;

    @Field(name = "company_address")
    String companyAddress;

    @Field(name = "company_description")
    String companyDescription;

    @Field(name = "company_phone")
    String companyPhone;

    @Field(name = "company_size")
    String companySize;

    @Field(name = "company_type")
    String companyType;

    @Field(name = "founded_year")
    Integer foundedYear;

    String industry;

    // ── Media ─────────────────────────────────────────────────────────────────
    @Field(name = "logo_url")
    String logoUrl;

    @Field(name = "cover_image_url")
    String coverImageUrl;

    // ── Legal ─────────────────────────────────────────────────────────────────
    @Field(name = "tax_code")
    String taxCode;

    @Field(name = "business_license_url")
    String businessLicenseUrl;

    // ── Social links ──────────────────────────────────────────────────────────
    @Field(name = "linkedin_url")
    String linkedinUrl;

    @Field(name = "facebook_url")
    String facebookUrl;

    // ── HR contact ────────────────────────────────────────────────────────────
    @Field(name = "contact_name")
    String contactName;

    @Field(name = "contact_email")
    String contactEmail;

    @Field(name = "contact_phone")
    String contactPhone;

    // ── Status & quota ────────────────────────────────────────────────────────
    @Builder.Default
    RecruiterStatus status = RecruiterStatus.PENDING;

    @Field(name = "quota_job_post")
    @Builder.Default
    int quotaJobPost = 0;

    @Field(name = "quota_cv_views")
    @Builder.Default
    int quotaCvViews = 0;

    // ── Audit ─────────────────────────────────────────────────────────────────
    @Field(name = "created_at")
    LocalDateTime createdAt;

    @Field(name = "updated_at")
    LocalDateTime updatedAt;

    @Builder.Default
    boolean deleted = false;

    @Field(name = "deleted_at")
    LocalDateTime deletedAt;
}
