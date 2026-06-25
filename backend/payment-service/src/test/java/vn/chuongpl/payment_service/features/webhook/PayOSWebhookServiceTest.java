package vn.chuongpl.payment_service.features.webhook;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.chuongpl.payment_service.config.PayOSConfig;
import vn.chuongpl.payment_service.enums.OrderStatus;
import vn.chuongpl.payment_service.features.order.PaymentOrder;
import vn.chuongpl.payment_service.features.order.PaymentOrderRepository;
import vn.chuongpl.payment_service.features.order.PaymentOrderService;
import vn.payos.PayOS;
import vn.payos.type.Webhook;
import vn.payos.type.WebhookData;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.mock;

@ExtendWith(MockitoExtension.class)
class PayOSWebhookServiceTest {

    @Mock PayOS payOS;
    @Mock PayOSConfig payOSConfig;
    @Mock PaymentOrderRepository paymentOrderRepository;
    @Mock PaymentOrderService paymentOrderService;
    @Mock ObjectMapper objectMapper;

    @InjectMocks
    PayOSWebhookService payOSWebhookService;

    @BeforeEach
    void setUp() {
        lenient().when(payOSConfig.getWebhookToken()).thenReturn("valid-token");
    }

    @Test
    void handleWebhook_invalidToken_returnsWithoutProcessing() {
        payOSWebhookService.handleWebhook("wrong-token", "{}");
        verifyNoInteractions(paymentOrderRepository);
        verifyNoInteractions(payOS);
    }

    @Test
    void handleWebhook_alreadyPaid_returnsIdempotent() throws Exception {
        WebhookData webhookData = mock(WebhookData.class);
        when(webhookData.getOrderCode()).thenReturn(123L);
        when(webhookData.getCode()).thenReturn("00");
        when(objectMapper.readValue(anyString(), eq(Webhook.class))).thenReturn(mock(Webhook.class));
        when(payOS.verifyPaymentWebhookData(any(Webhook.class))).thenReturn(webhookData);

        PaymentOrder order = PaymentOrder.builder()
                .id("order-1").orderCode(123L).status(OrderStatus.PAID).build();
        when(paymentOrderRepository.findByOrderCode(123L)).thenReturn(Optional.of(order));

        payOSWebhookService.handleWebhook("valid-token", "{}");

        verify(paymentOrderRepository, never()).save(any());
        verify(paymentOrderService, never()).publishPaymentCompleted(any());
    }

    @Test
    void handleWebhook_successCode_transitionsToPaid_publishesEvent() throws Exception {
        WebhookData webhookData = mock(WebhookData.class);
        when(webhookData.getOrderCode()).thenReturn(456L);
        when(webhookData.getCode()).thenReturn("00");
        when(objectMapper.readValue(anyString(), eq(Webhook.class))).thenReturn(mock(Webhook.class));
        when(payOS.verifyPaymentWebhookData(any(Webhook.class))).thenReturn(webhookData);

        PaymentOrder order = PaymentOrder.builder()
                .id("order-2").orderCode(456L).status(OrderStatus.PENDING).build();
        when(paymentOrderRepository.findByOrderCode(456L)).thenReturn(Optional.of(order));
        when(paymentOrderRepository.save(any())).thenReturn(order);

        payOSWebhookService.handleWebhook("valid-token", "{}");

        ArgumentCaptor<PaymentOrder> captor = ArgumentCaptor.forClass(PaymentOrder.class);
        verify(paymentOrderRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(OrderStatus.PAID);
        assertThat(captor.getValue().getPaidAt()).isNotNull();
        verify(paymentOrderService).publishPaymentCompleted(any());
    }

    @Test
    void handleWebhook_failureCode_transitionsToFailed() throws Exception {
        WebhookData webhookData = mock(WebhookData.class);
        when(webhookData.getOrderCode()).thenReturn(789L);
        when(webhookData.getCode()).thenReturn("01");
        when(objectMapper.readValue(anyString(), eq(Webhook.class))).thenReturn(mock(Webhook.class));
        when(payOS.verifyPaymentWebhookData(any(Webhook.class))).thenReturn(webhookData);

        PaymentOrder order = PaymentOrder.builder()
                .id("order-3").orderCode(789L).status(OrderStatus.PENDING).build();
        when(paymentOrderRepository.findByOrderCode(789L)).thenReturn(Optional.of(order));
        when(paymentOrderRepository.save(any())).thenReturn(order);

        payOSWebhookService.handleWebhook("valid-token", "{}");

        ArgumentCaptor<PaymentOrder> captor = ArgumentCaptor.forClass(PaymentOrder.class);
        verify(paymentOrderRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(OrderStatus.FAILED);
        verify(paymentOrderService, never()).publishPaymentCompleted(any());
    }
}
