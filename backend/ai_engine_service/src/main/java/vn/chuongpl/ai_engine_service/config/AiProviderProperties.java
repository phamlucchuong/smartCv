package vn.chuongpl.ai_engine_service.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.ai.providers")
@Data
public class AiProviderProperties {

    private ProviderProps groq = new ProviderProps();
    private ProviderProps gemini = new ProviderProps();
    private ProviderProps anthropic = new ProviderProps();
    private ProviderProps azureOpenai = new ProviderProps();

    @Data
    public static class ProviderProps {
        private String apiKey;
        private String baseUrl;
        private String model;
        private String endpoint;
        private String deploymentName;

        public boolean isConfigured() {
            return apiKey != null && !apiKey.isBlank();
        }
    }
}
