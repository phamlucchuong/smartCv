package vn.chuongpl.application_service.integration.user;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import vn.chuongpl.application_service.dtos.ApiResponse;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserClient {

    private final RestTemplate restTemplate;

    @Value("${app.user-service.base-url}")
    String baseUrl;

    @Value("${app.gateway.internal-secret}")
    String internalSecret;

    /** Cache of userId -> Recruiter.id. The mapping is immutable, so no eviction is needed. */
    private final Map<String, String> recruiterIdCache = new ConcurrentHashMap<>();

    /** Resolves a JWT userId to the canonical Recruiter.id (cached). Returns null if not found. */
    public String resolveRecruiterId(String userId) {
        if (userId == null) return null;
        String cached = recruiterIdCache.get(userId);
        if (cached != null) return cached;
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Gateway-Secret", internalSecret);
            ResponseEntity<Map> resp = restTemplate.exchange(
                    baseUrl + "/api/internal/recruiters/by-user/" + userId,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    Map.class
            );
            Object body = resp.getBody();
            if (body instanceof Map<?, ?> m) {
                Object data = m.get("data");
                if (data instanceof Map<?, ?> dm && dm.get("recruiterId") != null) {
                    String recruiterId = dm.get("recruiterId").toString();
                    recruiterIdCache.put(userId, recruiterId);
                    return recruiterId;
                }
            }
        } catch (Exception e) {
            log.warn("Failed to resolve recruiterId for userId={}: {}", userId, e.getMessage());
        }
        return null;
    }

    public String getCandidateEmail(String candidateId) {
        try {
            ResponseEntity<ApiResponse<UserSummary>> resp = restTemplate.exchange(
                    baseUrl + "/api/users/" + candidateId,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<>() {
                    }
            );
            ApiResponse<UserSummary> body = resp.getBody();
            UserSummary user = body == null ? null : body.getData();
            return user == null ? null : user.email();
        } catch (Exception e) {
            log.warn("Failed to fetch candidate email for {}: {}", candidateId, e.getMessage());
            return null;
        }
    }
}
