package vn.chuongpl.ai_engine_service.integration.application;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@RequiredArgsConstructor
@Slf4j
public class ApplicationClient {

    private final RestTemplate restTemplate;

    @Value("${app.application-service.base-url}")
    private String baseUrl;

    @Value("${app.gateway.internal-secret}")
    private String gatewaySecret;

    public void updateAiScore(String applicationId, AiScoreResult result) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Gateway-Secret", gatewaySecret);
            headers.set("X-User-Id", "ai-engine");
            headers.set("X-User-Scope", "ROLE_ADMIN");

            restTemplate.exchange(
                    baseUrl + "/api/applications/" + applicationId + "/ai-score",
                    HttpMethod.PATCH,
                    new HttpEntity<>(result, headers),
                    Void.class
            );
        } catch (Exception e) {
            log.error("Failed to callback ai-score for {}: {}", applicationId, e.getMessage());
        }
    }
}
