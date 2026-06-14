package vn.chuongpl.ai_engine_service.integration.user;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserClient {

    private final RestTemplate restTemplate;

    @Value("${app.user-service.base-url}")
    private String baseUrl;

    @Value("${app.gateway.internal-secret}")
    private String gatewaySecret;

    public void mergeSkills(String userId, List<String> skills) {
        try {
            List<String> safeSkills = skills == null ? Collections.emptyList() : skills;
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Gateway-Secret", gatewaySecret);
            headers.set("X-User-Id", "ai-engine");
            headers.set("X-User-Scope", "ROLE_ADMIN");

            restTemplate.exchange(
                    baseUrl + "/api/internal/candidates/by-user/" + userId + "/skills",
                    HttpMethod.PATCH,
                    new HttpEntity<>(Map.of("skills", safeSkills), headers),
                    Void.class
            );
        } catch (Exception e) {
            log.error("Failed to merge skills for userId={}: {}", userId, e.getMessage());
        }
    }
}
