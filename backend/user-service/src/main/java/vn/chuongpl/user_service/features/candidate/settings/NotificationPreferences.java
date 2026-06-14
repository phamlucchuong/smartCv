package vn.chuongpl.user_service.features.candidate.settings;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class NotificationPreferences {
    @Builder.Default boolean emailApplicationUpdates = true;
    @Builder.Default boolean emailJobSuggestions = true;
    @Builder.Default boolean pushNotifications = true;
    @Builder.Default boolean marketingEmails = false;
}
