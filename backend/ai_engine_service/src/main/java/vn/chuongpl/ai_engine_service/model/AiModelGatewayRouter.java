package vn.chuongpl.ai_engine_service.model;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import vn.chuongpl.ai_engine_service.config.AiProviderProperties;
import vn.chuongpl.ai_engine_service.enums.ErrorCode;
import vn.chuongpl.ai_engine_service.exception.AppException;
import vn.chuongpl.ai_engine_service.features.admin.AiProviderConfig;
import vn.chuongpl.ai_engine_service.features.admin.AiProviderConfigRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class AiModelGatewayRouter {

    private final AiProviderConfigRepository repository;
    private final AiModelGatewayFactory factory;
    private final AiProviderProperties providerProperties;

    private volatile AiModelGateway activeGateway;

    @PostConstruct
    void init() {
        repository.findByActiveTrue().ifPresentOrElse(
            config -> {
                activeGateway = factory.create(config);
                log.info("AI gateway initialized with provider: {}", config.getProvider());
            },
            this::autoSeedFromEnv
        );
    }

    private void autoSeedFromEnv() {
        List<Map.Entry<AiProvider, AiProviderProperties.ProviderProps>> candidates = List.of(
            Map.entry(AiProvider.GROQ,         providerProperties.getGroq()),
            Map.entry(AiProvider.GEMINI,       providerProperties.getGemini()),
            Map.entry(AiProvider.ANTHROPIC,    providerProperties.getAnthropic()),
            Map.entry(AiProvider.AZURE_OPENAI, providerProperties.getAzureOpenai())
        );

        candidates.stream()
            .filter(e -> e.getValue().isConfigured())
            .findFirst()
            .ifPresentOrElse(
                e -> seedAndActivate(e.getKey(), e.getValue()),
                () -> log.warn("No active AI provider configured. Activate one via PUT /ai/api/ai/admin/providers/{provider}/activate")
            );
    }

    private void seedAndActivate(AiProvider provider, AiProviderProperties.ProviderProps props) {
        AiProviderConfig config = repository.findByProvider(provider).orElseGet(() ->
            AiProviderConfig.builder().provider(provider).build()
        );
        if (config.getApiKey() == null || config.getApiKey().isBlank()) {
            config.setApiKey(props.getApiKey());
        }
        if (config.getModel() == null || config.getModel().isBlank()) {
            config.setModel(props.getModel());
        }
        if (config.getBaseUrl() == null || config.getBaseUrl().isBlank()) {
            config.setBaseUrl(props.getBaseUrl() != null ? props.getBaseUrl() : props.getEndpoint());
        }
        if (config.getDeploymentName() == null || config.getDeploymentName().isBlank()) {
            config.setDeploymentName(props.getDeploymentName());
        }
        config.setActive(true);
        config.setUpdatedAt(LocalDateTime.now());
        repository.save(config);
        activeGateway = factory.create(config);
        log.info("AI gateway auto-seeded from env: provider={}", provider);
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
