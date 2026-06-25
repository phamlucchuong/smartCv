package vn.chuongpl.payment_service.features.webhook;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
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
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class PayOSWebhookService {

    PayOS payOS;
    PayOSConfig payOSConfig;
    PaymentOrderRepository paymentOrderRepository;
    PaymentOrderService paymentOrderService;
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

        Optional<PaymentOrder> orderOpt = paymentOrderRepository.findByOrderCode(orderCode);
        if (orderOpt.isEmpty()) {
            log.warn("[Webhook] Order not found for orderCode={}", orderCode);
            return;
        }

        PaymentOrder order = orderOpt.get();
        if (order.getStatus() != OrderStatus.PENDING) {
            log.info("[Webhook] Order already in terminal status={} orderCode={}", order.getStatus(), orderCode);
            return;
        }

        if ("00".equals(code)) {
            order.setStatus(OrderStatus.PAID);
            order.setPaidAt(LocalDateTime.now());
            order.setUpdatedAt(LocalDateTime.now());
            paymentOrderRepository.save(order);
            paymentOrderService.publishPaymentCompleted(order);
        } else {
            order.setStatus(OrderStatus.FAILED);
            order.setUpdatedAt(LocalDateTime.now());
            paymentOrderRepository.save(order);
        }
    }
}
