package vn.chuongpl.application_service.integration.job;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import vn.chuongpl.application_service.dtos.ApiResponse;
import vn.chuongpl.application_service.enums.ErrorCode;
import vn.chuongpl.application_service.exception.AppException;

@Slf4j
@Component
@RequiredArgsConstructor
public class JobClient {
    final RestTemplate restTemplate;

    @Value("${app.job-service.base-url}")
    String jobServiceBaseUrl;

    public JobResponse getActiveJob(String jobId) {
        String url = jobServiceBaseUrl + "/api/jobs/" + jobId;
        try {
            ResponseEntity<ApiResponse<JobResponse>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<>() {
                    }
            );

            ApiResponse<JobResponse> body = response.getBody();
            JobResponse job = body == null ? null : body.getData();
            if (job == null) throw new AppException(ErrorCode.JOB_NOT_FOUND);
            if (!"ACTIVE".equals(job.getStatus())) {
                throw new AppException(ErrorCode.JOB_NOT_ACCEPTING_APPLICATIONS);
            }
            return job;
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Job service call failed: {}", e.getMessage());
            throw new AppException(ErrorCode.JOB_SERVICE_UNAVAILABLE);
        }
    }
}
