package vn.chuongpl.job_service.integration.userservice;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserServiceClient {

    private final RestTemplate restTemplate;

    @Value("${app.user-service-url:http://localhost:8081}")
    private String userServiceUrl;

    @Value("${app.gateway-internal-secret:changeme}")
    private String internalSecret;

    public RecruiterStatusDto getRecruiterStatus(String userId) {
        String url = userServiceUrl + "/user/api/internal/recruiters/by-user/" + userId;
        try {
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("X-Gateway-Secret", internalSecret);
            org.springframework.http.HttpEntity<Void> entity = new org.springframework.http.HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    url, org.springframework.http.HttpMethod.GET, entity, Map.class);
            if (response.getBody() != null) {
                Object data = response.getBody().get("data");
                if (data instanceof Map<?, ?> dataMap) {
                    Object status = dataMap.get("status");
                    return new RecruiterStatusDto(status != null ? status.toString() : null);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to fetch recruiter status for userId={}: {}", userId, e.getMessage());
        }
        return new RecruiterStatusDto(null);
    }

    public String getRecruiterEmail(String userId) {
        String url = userServiceUrl + "/user/api/internal/recruiters/by-user/" + userId;
        try {
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("X-Gateway-Secret", internalSecret);
            org.springframework.http.HttpEntity<Void> entity = new org.springframework.http.HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    url, org.springframework.http.HttpMethod.GET, entity, Map.class);
            if (response.getBody() != null) {
                Object data = response.getBody().get("data");
                if (data instanceof Map<?, ?> dataMap) {
                    Object email = dataMap.get("email");
                    return email != null ? email.toString() : null;
                }
            }
        } catch (Exception e) {
            log.warn("Failed to fetch recruiter email for userId={}: {}", userId, e.getMessage());
        }
        return null;
    }
}
