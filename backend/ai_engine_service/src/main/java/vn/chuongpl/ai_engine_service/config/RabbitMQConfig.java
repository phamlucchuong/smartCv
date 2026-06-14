package vn.chuongpl.ai_engine_service.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {
    public static final String CV_SCORING_EXCHANGE = "cv.scoring.exchange";
    public static final String CV_SCORING_KEY = "cv.scoring";
    public static final String CV_SCORING_QUEUE = "cv.scoring.queue";
    public static final String SKILL_EXCHANGE = "candidate.skill.exchange";
    public static final String SKILL_EXTRACT_QUEUE = "candidate.skill.extract.queue";
    public static final String SKILL_ROUTING_KEY = "candidate.skill.extract";

    @Bean
    DirectExchange cvScoringExchange() {
        return new DirectExchange(CV_SCORING_EXCHANGE);
    }

    @Bean
    Queue cvScoringQueue() {
        return new Queue(CV_SCORING_QUEUE, true);
    }

    @Bean
    Binding cvScoringBinding() {
        return BindingBuilder.bind(cvScoringQueue()).to(cvScoringExchange()).with(CV_SCORING_KEY);
    }

    @Bean
    DirectExchange skillExchange() {
        return new DirectExchange(SKILL_EXCHANGE);
    }

    @Bean
    Queue skillExtractQueue() {
        return new Queue(SKILL_EXTRACT_QUEUE, true);
    }

    @Bean
    Binding skillBinding() {
        return BindingBuilder.bind(skillExtractQueue()).to(skillExchange()).with(SKILL_ROUTING_KEY);
    }

    public static final String JOB_SUGGESTIONS_EXCHANGE = "job.suggestions.exchange";
    public static final String JOB_SUGGESTIONS_ROUTING_KEY = "job.suggestions";

    @Bean
    DirectExchange jobSuggestionsExchange() {
        return new DirectExchange(JOB_SUGGESTIONS_EXCHANGE);
    }

    @Bean
    MessageConverter jackson2MessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
