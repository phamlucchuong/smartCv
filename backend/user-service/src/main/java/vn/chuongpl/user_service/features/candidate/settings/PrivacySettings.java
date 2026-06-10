package vn.chuongpl.user_service.features.candidate.settings;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PrivacySettings {
    @Builder.Default ProfileVisibility profileVisibility = ProfileVisibility.RECRUITERS_ONLY;
    @Builder.Default boolean showCvToRecruiters = true;
    @Builder.Default boolean showContactInfo = false;
}
