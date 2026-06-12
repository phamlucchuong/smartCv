package vn.chuongpl.ai_engine_service.features.admin;

import org.springframework.data.mongodb.repository.MongoRepository;
import vn.chuongpl.ai_engine_service.model.AiProvider;

import java.util.Optional;

public interface AiProviderConfigRepository extends MongoRepository<AiProviderConfig, String> {
    Optional<AiProviderConfig> findByProvider(AiProvider provider);
    Optional<AiProviderConfig> findByActiveTrue();
}
