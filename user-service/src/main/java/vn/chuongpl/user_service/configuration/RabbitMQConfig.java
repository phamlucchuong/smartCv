package vn.chuongpl.user_service.configuration;
 
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
 
@Configuration
public class RabbitMQConfig {
 
    public static final String EXCHANGE = "notification.exchange";
    public static final String QUEUE = "otp.queue";
    public static final String ROUTING_KEY = "otp.routing.key";
    public static final String SKILL_EXCHANGE = "candidate.skill.exchange";
    public static final String SKILL_EXTRACT_QUEUE = "candidate.skill.extract.queue";
    public static final String SKILL_ROUTING_KEY = "candidate.skill.extract";
 
    @Bean
    public Queue otpQueue() {
        return new Queue(QUEUE);
    }
 
    @Bean
    public DirectExchange exchange() {
        return new DirectExchange(EXCHANGE);
    }
 
    @Bean
    public Binding binding() {
        return BindingBuilder.bind(otpQueue()).to(exchange()).with(ROUTING_KEY);
    }

    @Bean
    public Queue skillExtractQueue() {
        return new Queue(SKILL_EXTRACT_QUEUE, true);
    }

    @Bean
    public DirectExchange skillExchange() {
        return new DirectExchange(SKILL_EXCHANGE);
    }

    @Bean
    public Binding skillBinding() {
        return BindingBuilder.bind(skillExtractQueue()).to(skillExchange()).with(SKILL_ROUTING_KEY);
    }
 
    @Bean
    public MessageConverter converter() {
        return new Jackson2JsonMessageConverter();
    }
 
    @Bean
    public AmqpTemplate amqpTemplate(ConnectionFactory connectionFactory) {
        final RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(converter());
        return rabbitTemplate;
    }
}
