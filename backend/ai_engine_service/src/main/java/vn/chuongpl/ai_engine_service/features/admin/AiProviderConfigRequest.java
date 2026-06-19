package vn.chuongpl.ai_engine_service.features.admin;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AiProviderConfigRequest {
    String apiKey;
    String oauthToken;
    String model;
    String baseUrl;
    String deploymentName;
    String apiVersion;
}
