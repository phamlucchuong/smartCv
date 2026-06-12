package vn.chuongpl.ai_engine_service.model;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import vn.chuongpl.ai_engine_service.enums.ErrorCode;
import vn.chuongpl.ai_engine_service.exception.AppException;
import vn.chuongpl.ai_engine_service.features.admin.AiProviderConfig;
import vn.chuongpl.ai_engine_service.features.admin.AiProviderConfigRepository;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class AiModelGatewayRouter {

    private final AiProviderConfigRepository repository;
    private final AiModelGatewayFactory factory;

    private volatile AiModelGateway activeGateway;

    @PostConstruct
    void init() {
        repository.findByActiveTrue().ifPresentOrElse(
            config -> {
                activeGateway = factory.create(config);
                log.info("AI gateway initialized with provider: {}", config.getProvider());
            },
            () -> log.warn("No active AI provider configured. Activate one via PUT /ai/api/ai/admin/providers/{provider}/activate")
        );
    }

    public String call(String systemPrompt, String userPrompt) {
        AiModelGateway gateway = activeGateway;
        if (gateway == null) throw new AppException(ErrorCode.PROVIDER_NOT_CONFIGURED);
        return gateway.call(systemPrompt, userPrompt);
    }

    public void activate(AiProviderConfig config) {
        AiModelGateway gateway = factory.create(config);
        repository.findByActiveTrue().ifPresent(current -> {
            current.setActive(false);
            current.setUpdatedAt(LocalDateTime.now());
            repository.save(current);
        });
        config.setActive(true);
        config.setUpdatedAt(LocalDateTime.now());
        repository.save(config);
        activeGateway = gateway;
        log.info("AI provider switched to: {}", config.getProvider());
    }

    public String getActiveProvider() {
        AiModelGateway gateway = activeGateway;
        return gateway == null ? "none" : gateway.provider().name().toLowerCase();
    }
}
