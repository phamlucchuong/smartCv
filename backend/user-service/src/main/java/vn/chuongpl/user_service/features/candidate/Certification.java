package vn.chuongpl.user_service.features.candidate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Certification {
    String name;
    String issuer;
    LocalDate issuedDate;
    LocalDate expiryDate;
    String credentialUrl;
}
