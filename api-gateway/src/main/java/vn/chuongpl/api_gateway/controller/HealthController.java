package vn.chuongpl.api_gateway.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@Slf4j
public class HealthController {

    private final WebClient webClient;

    @Value("${USER_SERVICE_URI:http://localhost:8081}")
    private String userUri;
    @Value("${JOB_SERVICE_URI:http://localhost:8082}")
    private String jobUri;
    @Value("${APP_SERVICE_URI:http://localhost:8083}")
    private String appUri;
    @Value("${AI_SERVICE_URI:http://localhost:8085}")
    private String aiUri;
    @Value("${NOTIFICATION_SERVICE_URI:http://localhost:8084}")
    private String notiUri;

    public HealthController(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    @GetMapping("/health")
    public Mono<Map<String, Object>> health() {
        return Flux.defer(() -> {
            List<Mono<Map<String, String>>> checks = List.of(
                checkService("user-service", userUri + "/user/v3/api-docs"),
                checkService("job-service", jobUri + "/job/v3/api-docs"),
                checkService("application-service", appUri + "/application/v3/api-docs"),
                checkService("ai-service", aiUri + "/ai/v3/api-docs"),
                checkService("notification-service", notiUri + "/health")
            );
            return Flux.merge(checks);
        })
        .collectList()
        .map(results -> {
            long upCount = results.stream().filter(r -> "UP".equals(r.get("status"))).count();
            String overall = upCount == results.size() ? "UP" : upCount > 0 ? "DEGRADED" : "DOWN";
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("status", overall);
            response.put("services", results);
            return response;
        });
    }

    // exchangeToMono treats any HTTP response as UP — only connection/timeout errors are DOWN
    private Mono<Map<String, String>> checkService(String name, String url) {
        return webClient.get()
            .uri(url)
            .exchangeToMono(response -> Mono.just(status(name, "UP", null)))
            .timeout(Duration.ofSeconds(3))
            .onErrorResume(e -> {
                log.debug("Health check DOWN for {}: {}", name, e.getMessage());
                return Mono.just(status(name, "DOWN", truncate(e.getMessage(), 100)));
            });
    }

    private Map<String, String> status(String name, String s, String error) {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("name", name);
        m.put("status", s);
        if (error != null) m.put("error", error);
        return m;
    }

    private String truncate(String s, int max) {
        return s != null && s.length() > max ? s.substring(0, max) + "..." : s;
    }
}
