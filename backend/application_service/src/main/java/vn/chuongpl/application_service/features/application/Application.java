package vn.chuongpl.application_service.features.application;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.MongoId;
import vn.chuongpl.application_service.enums.ApplicationStatus;

import java.time.LocalDateTime;

@Document(collection = "applications")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Application {
    @MongoId
    String id;

    @Field("candidate_id")
    String candidateId;

    @Field("job_id")
    String jobId;

    @Field("recruiter_id")
    String recruiterId;

    @Builder.Default
    ApplicationStatus status = ApplicationStatus.PENDING;

    @Field("cover_letter")
    String coverLetter;

    @Field("cv_url")
    String cvUrl;

    @Field("recruiter_notes")
    String recruiterNotes;

    @Field("rejection_reason")
    String rejectionReason;

    @Field("applied_at")
    LocalDateTime appliedAt;

    @Field("updated_at")
    LocalDateTime updatedAt;

    @Builder.Default
    boolean deleted = false;

    @Field("deleted_at")
    LocalDateTime deletedAt;
}
