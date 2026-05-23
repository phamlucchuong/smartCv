package vn.chuongpl.application_service.integration.user;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import vn.chuongpl.application_service.dtos.ApiResponse;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserClient {

    private final RestTemplate restTemplate;

    @Value("${app.user-service.base-url}")
    String baseUrl;

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
