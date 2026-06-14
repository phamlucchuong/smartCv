package vn.chuongpl.user_service.features.candidate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Language {
    String name;
    /** BASIC / CONVERSATIONAL / PROFESSIONAL / NATIVE */
    String proficiency;
}
