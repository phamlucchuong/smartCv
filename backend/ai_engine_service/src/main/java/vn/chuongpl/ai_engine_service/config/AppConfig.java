package vn.chuongpl.ai_engine_service.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
@EnableConfigurationProperties(AiProviderProperties.class)
public class AppConfig {
    @Bean
    RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
