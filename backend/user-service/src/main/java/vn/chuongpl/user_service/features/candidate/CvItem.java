package vn.chuongpl.user_service.features.candidate;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CvItem {
    String id;
    String url;
    String filename;
    boolean isDefault;
    LocalDateTime uploadedAt;
    @Builder.Default
    CvAnalysisStatus analysisStatus = CvAnalysisStatus.PENDING;
    String analysisResult;
}
