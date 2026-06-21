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
 
    public static final String JOB_SUGGESTIONS_QUEUE = "job.suggestions.queue";
    public static final String JOB_SUGGESTIONS_EXCHANGE = "job.suggestions.exchange";
    public static final String JOB_SUGGESTIONS_ROUTING_KEY = "job.suggestions";

    public static final String RECRUITER_EXCHANGE = "recruiter.notification.exchange";
    public static final String RECRUITER_APPROVED_QUEUE = "recruiter.approved.queue";
    public static final String RECRUITER_REJECTED_QUEUE = "recruiter.rejected.queue";
    public static final String RECRUITER_APPROVED_KEY = "recruiter.approved";
    public static final String RECRUITER_REJECTED_KEY = "recruiter.rejected";
    public static final String RECRUITER_PENDING_QUEUE = "recruiter.pending.queue";
    public static final String RECRUITER_PENDING_KEY = "recruiter.pending";

    @Bean
    public Queue jobSuggestionsQueue() {
        return new Queue(JOB_SUGGESTIONS_QUEUE, true);
    }

    @Bean
    public DirectExchange jobSuggestionsExchange() {
        return new DirectExchange(JOB_SUGGESTIONS_EXCHANGE);
    }

    @Bean
    public Binding jobSuggestionsBinding() {
        return BindingBuilder.bind(jobSuggestionsQueue()).to(jobSuggestionsExchange()).with(JOB_SUGGESTIONS_ROUTING_KEY);
    }

    @Bean
    public DirectExchange recruiterExchange() {
        return new DirectExchange(RECRUITER_EXCHANGE);
    }

    @Bean
    public Queue recruiterApprovedQueue() {
        return new Queue(RECRUITER_APPROVED_QUEUE, true);
    }

    @Bean
    public Queue recruiterRejectedQueue() {
        return new Queue(RECRUITER_REJECTED_QUEUE, true);
    }

    @Bean
    public Queue recruiterPendingQueue() {
        return new Queue(RECRUITER_PENDING_QUEUE, true);
    }

    @Bean
    public Binding recruiterApprovedBinding() {
        return BindingBuilder.bind(recruiterApprovedQueue()).to(recruiterExchange()).with(RECRUITER_APPROVED_KEY);
    }

    @Bean
    public Binding recruiterRejectedBinding() {
        return BindingBuilder.bind(recruiterRejectedQueue()).to(recruiterExchange()).with(RECRUITER_REJECTED_KEY);
    }

    @Bean
    public Binding recruiterPendingBinding() {
        return BindingBuilder.bind(recruiterPendingQueue()).to(recruiterExchange()).with(RECRUITER_PENDING_KEY);
    }

    public static final String CV_ANALYSIS_EXCHANGE = "cv.analysis.exchange";
    public static final String CV_ANALYSIS_DONE_QUEUE = "cv.analysis.done.queue";
    public static final String CV_ANALYSIS_DONE_KEY = "cv.analysis.done";

    @Bean
    public DirectExchange cvAnalysisExchange() {
        return new DirectExchange(CV_ANALYSIS_EXCHANGE);
    }

    @Bean
    public Queue cvAnalysisDoneQueue() {
        return new Queue(CV_ANALYSIS_DONE_QUEUE, true);
    }

    @Bean
    public Binding cvAnalysisDoneBinding() {
        return BindingBuilder.bind(cvAnalysisDoneQueue()).to(cvAnalysisExchange()).with(CV_ANALYSIS_DONE_KEY);
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
