package vn.chuongpl.user_service.features.wishlist;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.time.LocalDateTime;

@Document(collection = "wishlists")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Wishlist {
    @MongoId
    String id;

    @Field(name = "candidate_id")
    String candidateId;

    @Field(name = "job_id")
    String jobId;

    @Field(name = "saved_at")
    LocalDateTime savedAt;

    @Builder.Default
    boolean deleted = false;
}
