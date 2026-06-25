package vn.chuongpl.payment_service.features.order;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.http.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;
import vn.chuongpl.payment_service.config.PayOSConfig;
import vn.chuongpl.payment_service.dtos.request.CreateOrderRequest;
import vn.chuongpl.payment_service.dtos.response.CreateOrderResponse;
import vn.chuongpl.payment_service.enums.ErrorCode;
import vn.chuongpl.payment_service.enums.OrderStatus;
import vn.chuongpl.payment_service.exception.AppException;
import vn.payos.PayOS;
import vn.payos.type.CheckoutResponseData;
import vn.payos.type.PaymentData;

import static org.mockito.Mockito.mock;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentOrderServiceTest {

    @Mock PaymentOrderRepository paymentOrderRepository;
    @Mock PaymentOrderMapper paymentOrderMapper;
    @Mock PayOS payOS;
    @Mock PayOSConfig payOSConfig;
    @Mock RabbitTemplate rabbitTemplate;
    @Mock RestTemplate restTemplate;
    @Mock ObjectMapper objectMapper;

    @InjectMocks
    PaymentOrderService paymentOrderService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(paymentOrderService, "userServiceUrl", "http://localhost:8081/user");
        ReflectionTestUtils.setField(paymentOrderService, "gatewayInternalSecret", "changeme");

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("user-1", null,
                        List.of(new SimpleGrantedAuthority("ROLE_RECRUITER")))
        );

        lenient().when(payOSConfig.getReturnUrl()).thenReturn("http://localhost:3000/success");
        lenient().when(payOSConfig.getCancelUrl()).thenReturn("http://localhost:3000/cancel");
    }

    @Test
    void createOrder_newOrder_success() throws Exception {
        // Arrange
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(Map.of("data", Map.of(
                        "name", "Pro", "price", 20000, "aiCredits", 30,
                        "jobLimit", 15, "cvLimit", -1, "durationDays", 30))));

        when(paymentOrderRepository.findByUserIdAndPackageIdAndStatus(any(), any(), any()))
                .thenReturn(Optional.empty());

        CheckoutResponseData checkoutData = mock(CheckoutResponseData.class);
        when(checkoutData.getCheckoutUrl()).thenReturn("https://pay.payos.vn/abc");
        when(checkoutData.getQrCode()).thenReturn("qr-data");
        when(payOS.createPaymentLink(any(PaymentData.class))).thenReturn(checkoutData);

        PaymentOrder savedOrder = PaymentOrder.builder()
                .id("order-1").orderCode(123L).paymentUrl("https://pay.payos.vn/abc").qrCode("qr-data")
                .status(OrderStatus.PENDING).build();
        when(paymentOrderRepository.save(any())).thenReturn(savedOrder);

        CreateOrderResponse expectedResponse = CreateOrderResponse.builder()
                .orderId("order-1").orderCode(123L).paymentUrl("https://pay.payos.vn/abc").qrCode("qr-data").build();
        when(paymentOrderMapper.toCreateOrderResponse(savedOrder)).thenReturn(expectedResponse);

        // Act
        CreateOrderResponse response = paymentOrderService.createOrder(new CreateOrderRequest("pro"));

        // Assert
        assertThat(response.getPaymentUrl()).isEqualTo("https://pay.payos.vn/abc");
        verify(payOS).createPaymentLink(any());
        verify(paymentOrderRepository).save(any());
    }

    @Test
    void createOrder_existingFreshPendingOrder_returnsExisting() throws Exception {
        // Arrange
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(Map.of("data", Map.of(
                        "name", "Pro", "price", 20000, "aiCredits", 30, "jobLimit", 15, "cvLimit", -1))));

        PaymentOrder existingOrder = PaymentOrder.builder()
                .id("existing-order").orderCode(999L).status(OrderStatus.PENDING)
                .paymentUrl("https://pay.payos.vn/existing")
                .createdAt(LocalDateTime.now().minusMinutes(5))
                .build();
        when(paymentOrderRepository.findByUserIdAndPackageIdAndStatus(any(), any(), any()))
                .thenReturn(Optional.of(existingOrder));

        CreateOrderResponse existingResponse = CreateOrderResponse.builder()
                .orderId("existing-order").paymentUrl("https://pay.payos.vn/existing").build();
        when(paymentOrderMapper.toCreateOrderResponse(existingOrder)).thenReturn(existingResponse);

        // Act
        CreateOrderResponse response = paymentOrderService.createOrder(new CreateOrderRequest("pro"));

        // Assert
        assertThat(response.getOrderId()).isEqualTo("existing-order");
        verify(payOS, never()).createPaymentLink(any());
    }

    @Test
    void createOrder_existingStalePendingOrder_cancelsAndCreatesNew() throws Exception {
        // Arrange
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(Map.of("data", Map.of(
                        "name", "Pro", "price", 20000, "aiCredits", 30, "jobLimit", 15, "cvLimit", -1))));

        PaymentOrder staleOrder = PaymentOrder.builder()
                .id("stale-order").orderCode(888L).status(OrderStatus.PENDING)
                .createdAt(LocalDateTime.now().minusMinutes(20))
                .build();
        when(paymentOrderRepository.findByUserIdAndPackageIdAndStatus(any(), any(), any()))
                .thenReturn(Optional.of(staleOrder));

        CheckoutResponseData checkoutData = mock(CheckoutResponseData.class);
        when(checkoutData.getCheckoutUrl()).thenReturn("https://pay.payos.vn/new");
        when(checkoutData.getQrCode()).thenReturn("new-qr");
        when(payOS.createPaymentLink(any())).thenReturn(checkoutData);

        PaymentOrder newOrder = PaymentOrder.builder().id("new-order").orderCode(777L)
                .paymentUrl("https://pay.payos.vn/new").status(OrderStatus.PENDING).build();
        when(paymentOrderRepository.save(any())).thenReturn(newOrder);

        CreateOrderResponse newResponse = CreateOrderResponse.builder()
                .orderId("new-order").paymentUrl("https://pay.payos.vn/new").build();
        when(paymentOrderMapper.toCreateOrderResponse(newOrder)).thenReturn(newResponse);

        // Act
        CreateOrderResponse response = paymentOrderService.createOrder(new CreateOrderRequest("pro"));

        // Assert
        assertThat(response.getOrderId()).isEqualTo("new-order");
        verify(payOS).cancelPaymentLink(eq(888L), isNull());
        verify(payOS).createPaymentLink(any());
    }

    @Test
    void cancelOrder_notOwner_throwsForbidden() {
        PaymentOrder order = PaymentOrder.builder()
                .id("order-1").userId("other-user").status(OrderStatus.PENDING).build();
        when(paymentOrderRepository.findById("order-1")).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> paymentOrderService.cancelOrder("order-1", "user-1"))
                .isInstanceOf(AppException.class)
                .satisfies(e -> assertThat(((AppException) e).getErrorCode()).isEqualTo(ErrorCode.FORBIDDEN));
    }

    @Test
    void cancelOrder_notPending_throwsNotCancellable() {
        PaymentOrder order = PaymentOrder.builder()
                .id("order-1").userId("user-1").status(OrderStatus.PAID).build();
        when(paymentOrderRepository.findById("order-1")).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> paymentOrderService.cancelOrder("order-1", "user-1"))
                .isInstanceOf(AppException.class)
                .satisfies(e -> assertThat(((AppException) e).getErrorCode()).isEqualTo(ErrorCode.PAYMENT_ORDER_NOT_CANCELLABLE));
    }

    @Test
    void cancelOrder_success() throws Exception {
        PaymentOrder order = PaymentOrder.builder()
                .id("order-1").userId("user-1").orderCode(555L).status(OrderStatus.PENDING).build();
        when(paymentOrderRepository.findById("order-1")).thenReturn(Optional.of(order));

        paymentOrderService.cancelOrder("order-1", "user-1");

        ArgumentCaptor<PaymentOrder> captor = ArgumentCaptor.forClass(PaymentOrder.class);
        verify(paymentOrderRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(OrderStatus.CANCELLED);
        verify(payOS).cancelPaymentLink(eq(555L), isNull());
    }
}
