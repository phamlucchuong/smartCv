package vn.chuongpl.payment_service.features.order;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import vn.chuongpl.payment_service.config.PayOSConfig;
import vn.chuongpl.payment_service.config.RabbitMQConfig;
import vn.chuongpl.payment_service.dtos.PageResponse;
import vn.chuongpl.payment_service.dtos.PaymentCompletedEvent;
import vn.chuongpl.payment_service.dtos.request.CreateOrderRequest;
import vn.chuongpl.payment_service.dtos.response.CreateOrderResponse;
import vn.chuongpl.payment_service.dtos.response.OrderResponse;
import vn.chuongpl.payment_service.enums.ErrorCode;
import vn.chuongpl.payment_service.enums.OrderStatus;
import vn.chuongpl.payment_service.exception.AppException;
import vn.payos.PayOS;
import vn.payos.type.CheckoutResponseData;
import vn.payos.type.ItemData;
import vn.payos.type.PaymentData;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class PaymentOrderService {

    PaymentOrderRepository paymentOrderRepository;
    PaymentOrderMapper paymentOrderMapper;
    PayOS payOS;
    PayOSConfig payOSConfig;
    RabbitTemplate rabbitTemplate;
    RestTemplate restTemplate;
    ObjectMapper objectMapper;

    @Value("${integration.user-service-url}")
    String userServiceUrl;

    @Value("${app.gateway.internal-secret}")
    String gatewayInternalSecret;

    public CreateOrderResponse createOrder(CreateOrderRequest request) {
        String userId = getCurrentUserId();
        String userRole = getCurrentUserRole();

        Map<String, Object> packageData = fetchServicePackage(request.getPackageId());

        // Duplicate check
        var existing = paymentOrderRepository.findByUserIdAndPackageIdAndStatus(userId, request.getPackageId(), OrderStatus.PENDING);
        if (existing.isPresent()) {
            PaymentOrder existingOrder = existing.get();
            if (existingOrder.getCreatedAt().isAfter(LocalDateTime.now().minusMinutes(15))) {
                return paymentOrderMapper.toCreateOrderResponse(existingOrder);
            }
            // Stale — cancel on PayOS and locally
            try {
                payOS.cancelPaymentLink(existingOrder.getOrderCode(), null);
            } catch (Exception e) {
                log.warn("[Payment] Failed to cancel stale PayOS link orderCode={}: {}", existingOrder.getOrderCode(), e.getMessage());
            }
            existingOrder.setStatus(OrderStatus.CANCELLED);
            existingOrder.setUpdatedAt(LocalDateTime.now());
            paymentOrderRepository.save(existingOrder);
        }

        String packageName = (String) packageData.get("name");
        Long price = packageData.get("price") instanceof Number n ? n.longValue() : 0L;
        Integer aiCredits = packageData.get("aiCredits") instanceof Number n ? n.intValue() : null;
        Integer jobLimit = packageData.get("jobLimit") instanceof Number n ? n.intValue() : null;
        Integer cvLimit = packageData.get("cvLimit") instanceof Number n ? n.intValue() : null;
        Integer durationDays = packageData.get("durationDays") instanceof Number n ? n.intValue() : null;

        String description = "SmartCV - " + packageName;
        if (description.length() > 25) description = description.substring(0, 25);

        for (int attempt = 0; attempt < 3; attempt++) {
            long orderCode = generateOrderCode();
            try {
                PaymentData paymentData = PaymentData.builder()
                        .orderCode(orderCode)
                        .amount((int) price.longValue())
                        .description(description)
                        .returnUrl(payOSConfig.getReturnUrl())
                        .cancelUrl(payOSConfig.getCancelUrl())
                        .item(ItemData.builder()
                                .name(packageName)
                                .price((int) price.longValue())
                                .quantity(1)
                                .build())
                        .build();

                CheckoutResponseData responseData = payOS.createPaymentLink(paymentData);

                PaymentOrder order = PaymentOrder.builder()
                        .id(UUID.randomUUID().toString())
                        .orderCode(orderCode)
                        .userId(userId)
                        .userRole(userRole)
                        .packageId(request.getPackageId())
                        .packageName(packageName)
                        .packageAiCredits(aiCredits)
                        .packageJobLimit(jobLimit)
                        .packageCvLimit(cvLimit)
                        .packageDurationDays(durationDays)
                        .amount(price)
                        .status(OrderStatus.PENDING)
                        .paymentUrl(responseData.getCheckoutUrl())
                        .qrCode(responseData.getQrCode())
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();

                PaymentOrder saved = paymentOrderRepository.save(order);
                return paymentOrderMapper.toCreateOrderResponse(saved);

            } catch (DuplicateKeyException e) {
                log.warn("[Payment] OrderCode collision attempt {}/3", attempt + 1);
                if (attempt == 2) throw new AppException(ErrorCode.PAYMENT_ORDER_CREATION_FAILED);
            } catch (Exception e) {
                log.error("[Payment] PayOS createPaymentLink failed: {}", e.getMessage());
                throw new AppException(ErrorCode.PAYMENT_GATEWAY_ERROR);
            }
        }
        throw new AppException(ErrorCode.PAYMENT_ORDER_CREATION_FAILED);
    }

    public PageResponse<OrderResponse> getOrders(String userId, int page, int size) {
        Page<PaymentOrder> orderPage = paymentOrderRepository.findByUserId(
                userId,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "created_at"))
        );
        List<OrderResponse> items = orderPage.getContent().stream()
                .map(paymentOrderMapper::toOrderResponse)
                .toList();
        return PageResponse.<OrderResponse>builder()
                .items(items)
                .total(orderPage.getTotalElements())
                .page(page)
                .pageSize(size)
                .totalPages(orderPage.getTotalPages())
                .build();
    }

    public OrderResponse getOrderById(String orderId, String userId) {
        PaymentOrder order = paymentOrderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_ORDER_NOT_FOUND));
        return paymentOrderMapper.toOrderResponse(order);
    }

    public void cancelOrder(String orderId, String userId) {
        PaymentOrder order = paymentOrderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_ORDER_NOT_FOUND));

        if (!order.getUserId().equals(userId)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new AppException(ErrorCode.PAYMENT_ORDER_NOT_CANCELLABLE);
        }

        try {
            payOS.cancelPaymentLink(order.getOrderCode(), null);
        } catch (Exception e) {
            log.warn("[Payment] Failed to cancel PayOS link orderCode={}: {}", order.getOrderCode(), e.getMessage());
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setUpdatedAt(LocalDateTime.now());
        paymentOrderRepository.save(order);
    }

    public void publishPaymentCompleted(PaymentOrder order) {
        PaymentCompletedEvent event = PaymentCompletedEvent.builder()
                .userId(order.getUserId())
                .userRole(order.getUserRole())
                .packageId(order.getPackageId())
                .packageName(order.getPackageName())
                .packageAiCredits(order.getPackageAiCredits())
                .packageJobLimit(order.getPackageJobLimit())
                .packageCvLimit(order.getPackageCvLimit())
                .packageDurationDays(order.getPackageDurationDays())
                .orderId(order.getId())
                .paidAt(order.getPaidAt())
                .build();
        rabbitTemplate.convertAndSend(RabbitMQConfig.PAYMENT_EXCHANGE, RabbitMQConfig.PAYMENT_COMPLETED_KEY, event);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> fetchServicePackage(String packageId) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Gateway-Secret", gatewayInternalSecret);
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    userServiceUrl + "/internal/packages/" + packageId,
                    HttpMethod.GET,
                    entity,
                    Map.class
            );
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new AppException(ErrorCode.SERVICE_PACKAGE_NOT_FOUND);
            }
            Object data = response.getBody().get("data");
            if (data instanceof Map<?, ?> dataMap) {
                return (Map<String, Object>) dataMap;
            }
            throw new AppException(ErrorCode.SERVICE_PACKAGE_NOT_FOUND);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("[Payment] Failed to fetch service package {}: {}", packageId, e.getMessage());
            throw new AppException(ErrorCode.SERVICE_PACKAGE_NOT_FOUND);
        }
    }

    private String getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return principal.toString();
    }

    private String getCurrentUserRole() {
        return SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElse("CANDIDATE");
    }

    private long generateOrderCode() {
        return (System.currentTimeMillis() % 1_000_000_000_000L) * 1000
                + ThreadLocalRandom.current().nextInt(1000);
    }
}
