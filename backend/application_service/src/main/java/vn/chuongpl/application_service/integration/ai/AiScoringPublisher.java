package vn.chuongpl.application_service.integration.ai;

import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
import vn.chuongpl.application_service.config.RabbitMQConfig;
import vn.chuongpl.application_service.features.application.Application;

@Component
@RequiredArgsConstructor
public class AiScoringPublisher {

    final RabbitTemplate rabbitTemplate;

    public void publishScoringRequest(Application app) {
        if (app.getCvUrl() == null || app.getCvUrl().isBlank()) return;

        CvScoringMessage message = CvScoringMessage.builder()
                .applicationId(app.getId())
                .cvUrl(app.getCvUrl())
                .jobId(app.getJobId())
                .build();

        rabbitTemplate.convertAndSend(
                RabbitMQConfig.CV_SCORING_EXCHANGE,
                RabbitMQConfig.CV_SCORING_KEY,
                message
        );
    }
}
