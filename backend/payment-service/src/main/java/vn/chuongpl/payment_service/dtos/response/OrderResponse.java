package vn.chuongpl.payment_service.dtos.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import vn.chuongpl.payment_service.enums.OrderStatus;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderResponse {
    String orderId;
    Long orderCode;
    String userRole;
    String packageId;
    String packageName;
    Integer packageAiCredits;
    Integer packageJobLimit;
    Integer packageCvLimit;
    Integer packageDurationDays;
    Long amount;
    OrderStatus status;
    String paymentUrl;
    String qrCode;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
    LocalDateTime paidAt;
}
