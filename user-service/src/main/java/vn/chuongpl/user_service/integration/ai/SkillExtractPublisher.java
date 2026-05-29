package vn.chuongpl.user_service.integration.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.AmqpTemplate;
import org.springframework.stereotype.Component;
import vn.chuongpl.user_service.configuration.RabbitMQConfig;

@Component
@RequiredArgsConstructor
@Slf4j
public class SkillExtractPublisher {

    private final AmqpTemplate amqpTemplate;

    public void publish(String userId, String cvUrl) {
        try {
            amqpTemplate.convertAndSend(
                    RabbitMQConfig.SKILL_EXCHANGE,
                    RabbitMQConfig.SKILL_ROUTING_KEY,
                    new CvSkillExtractMessage(userId, cvUrl)
            );
        } catch (Exception e) {
            log.warn("Failed to publish skill-extract event for userId={}: {}", userId, e.getMessage());
        }
    }
}
