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
    MessageConverter jackson2MessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
