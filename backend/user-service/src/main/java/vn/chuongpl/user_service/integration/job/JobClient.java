package vn.chuongpl.user_service.integration.job;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@RequiredArgsConstructor
@Slf4j
public class JobClient {
    private final RestTemplate restTemplate;

    @Value("${integration.job-service-url}")
    private String jobServiceUrl;

    public JobSummary getJobById(String jobId) {
        try {
            var response = restTemplate.exchange(
                    jobServiceUrl + "/api/jobs/" + jobId,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<JobApiResponse<JobSummary>>() {}
            );
            if (response.getBody() != null) {
                return response.getBody().getData();
            }
        } catch (Exception e) {
            log.warn("Failed to fetch job {}: {}", jobId, e.getMessage());
        }
        return null;
    }
}
