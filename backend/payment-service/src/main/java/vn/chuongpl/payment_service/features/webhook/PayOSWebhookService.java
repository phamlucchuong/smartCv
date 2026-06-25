package vn.chuongpl.payment_service.features.webhook;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import vn.chuongpl.payment_service.config.PayOSConfig;
import vn.chuongpl.payment_service.enums.OrderStatus;
import vn.chuongpl.payment_service.features.order.PaymentOrder;
import vn.chuongpl.payment_service.features.order.PaymentOrderRepository;
import vn.chuongpl.payment_service.features.order.PaymentOrderService;
import vn.payos.PayOS;
import vn.payos.type.Webhook;
import vn.payos.type.WebhookData;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class PayOSWebhookService {

    PayOS payOS;
    PayOSConfig payOSConfig;
    PaymentOrderRepository paymentOrderRepository;
    PaymentOrderService paymentOrderService;
    MongoTemplate mongoTemplate;
    ObjectMapper objectMapper;

    public void handleWebhook(String token, String rawBody) {
        // Layer 1: token check
        if (!payOSConfig.getWebhookToken().equals(token)) {
            log.warn("[Webhook] Invalid token received");
            return;
        }

        // Layer 2: signature verification
        WebhookData webhookData;
        try {
            Webhook webhook = objectMapper.readValue(rawBody, Webhook.class);
            webhookData = payOS.verifyPaymentWebhookData(webhook);
        } catch (Exception e) {
            log.warn("[Webhook] Invalid signature: {}", e.getMessage());
            return;
        }

        Long orderCode = webhookData.getOrderCode();
        String code = webhookData.getCode();

        // Verify order exists before attempting update
        if (paymentOrderRepository.findByOrderCode(orderCode).isEmpty()) {
            log.warn("[Webhook] Order not found for orderCode={}", orderCode);
            return;
        }

        if ("00".equals(code)) {
            // Atomic transition PENDING → PAID; publishEvent only if this request won the race
            LocalDateTime now = LocalDateTime.now();
            Query query = Query.query(
                    Criteria.where("order_code").is(orderCode).and("status").is(OrderStatus.PENDING));
            Update update = new Update()
                    .set("status", OrderStatus.PAID)
                    .set("paid_at", now)
                    .set("updated_at", now);
            long modified = mongoTemplate.updateFirst(query, update, PaymentOrder.class).getModifiedCount();

            if (modified == 0) {
                log.info("[Webhook] Order already processed orderCode={}", orderCode);
                return;
            }

            paymentOrderRepository.findByOrderCode(orderCode).ifPresent(paymentOrderService::publishPaymentCompleted);
        } else {
            // Atomic transition PENDING → FAILED
            Query query = Query.query(
                    Criteria.where("order_code").is(orderCode).and("status").is(OrderStatus.PENDING));
            Update update = new Update()
                    .set("status", OrderStatus.FAILED)
                    .set("updated_at", LocalDateTime.now());
            mongoTemplate.updateFirst(query, update, PaymentOrder.class);
        }
    }
}
