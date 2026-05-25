package vn.chuongpl.ai_engine_service.features.analysis;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import vn.chuongpl.ai_engine_service.config.RabbitMQConfig;
import vn.chuongpl.ai_engine_service.dtos.response.CvAnalysisResponse;
import vn.chuongpl.ai_engine_service.integration.application.AiScoreResult;
import vn.chuongpl.ai_engine_service.integration.application.ApplicationClient;
import vn.chuongpl.ai_engine_service.integration.application.CvScoringMessage;

@Component
@RequiredArgsConstructor
@Slf4j
public class CvScoringConsumer {

    private final AnalysisService analysisService;
    private final ApplicationClient applicationClient;

    @RabbitListener(queues = RabbitMQConfig.CV_SCORING_QUEUE)
    public void handleCvScoring(CvScoringMessage message) {
        log.info("Processing CV scoring for applicationId={}", message.applicationId());

        try {
            CvAnalysisResponse result = analysisService.autoScore(message.cvUrl(), message.jobId());

            applicationClient.updateAiScore(message.applicationId(), new AiScoreResult(
                    result.matchScore(),
                    result.matchedSkills(),
                    result.missingSkills(),
                    "SCORED"
            ));

            log.info("AI scoring complete for applicationId={} score={}", message.applicationId(), result.matchScore());

        } catch (Exception e) {
            log.error("AI scoring failed for applicationId={}: {}", message.applicationId(), e.getMessage());
            applicationClient.updateAiScore(message.applicationId(), new AiScoreResult(0, null, null, "FAILED"));
        }
    }
}
