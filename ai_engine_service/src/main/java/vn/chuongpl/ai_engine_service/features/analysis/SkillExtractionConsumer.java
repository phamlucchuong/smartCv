package vn.chuongpl.ai_engine_service.features.analysis;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import vn.chuongpl.ai_engine_service.config.RabbitMQConfig;
import vn.chuongpl.ai_engine_service.dtos.response.SkillExtractionResponse;
import vn.chuongpl.ai_engine_service.integration.user.CvSkillExtractMessage;
import vn.chuongpl.ai_engine_service.integration.user.UserClient;

@Component
@RequiredArgsConstructor
@Slf4j
public class SkillExtractionConsumer {

    private final AnalysisService analysisService;
    private final UserClient userClient;

    @RabbitListener(queues = RabbitMQConfig.SKILL_EXTRACT_QUEUE)
    public void handleSkillExtraction(CvSkillExtractMessage message) {
        log.info("Extracting skills for userId={}", message.userId());
        try {
            SkillExtractionResponse result = analysisService.extractSkills(message.cvUrl());
            userClient.mergeSkills(message.userId(), result.skills());
            int count = result.skills() == null ? 0 : result.skills().size();
            log.info("Skills merged for userId={} count={}", message.userId(), count);
        } catch (Exception e) {
            log.error("Skill extraction failed for userId={}: {}", message.userId(), e.getMessage());
        }
    }
}
