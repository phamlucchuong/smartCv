package vn.chuongpl.ai_engine_service.features.admin;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import vn.chuongpl.ai_engine_service.model.AiProvider;

import java.time.LocalDateTime;

@Document("ai_provider_configs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AiProviderConfig {

    @Id
    String id;

    @Indexed(unique = true)
    AiProvider provider;

    String apiKey;
    String model;
    String baseUrl;
    String deploymentName;
    boolean active;
    LocalDateTime updatedAt;
}
