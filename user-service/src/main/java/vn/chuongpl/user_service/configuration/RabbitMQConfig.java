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
 
    @Bean
    public Queue otpQueue() {
        return new Queue(QUEUE);
    }
 
    @Bean
    public DirectExchange exchange() {
        return new DirectExchange(EXCHANGE);
    }
 
    @Bean
    public Binding binding(Queue queue, DirectExchange exchange) {
        return BindingBuilder.bind(queue).to(exchange).with(ROUTING_KEY);
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
