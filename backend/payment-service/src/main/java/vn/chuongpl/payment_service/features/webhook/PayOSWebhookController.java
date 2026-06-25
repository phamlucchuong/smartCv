package vn.chuongpl.payment_service.features.webhook;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.chuongpl.payment_service.dtos.ApiResponse;

@Slf4j
@RestController
@RequestMapping("/api/webhook")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class PayOSWebhookController {

    PayOSWebhookService payOSWebhookService;

    @PostMapping("/payos")
    public ResponseEntity<ApiResponse<Void>> handlePayOSWebhook(
            @RequestParam String token,
            @RequestBody String rawBody) {
        try {
            payOSWebhookService.handleWebhook(token, rawBody);
            return ResponseEntity.ok(ApiResponse.<Void>builder().message("received").build());
        } catch (Exception e) {
            log.error("[Webhook] Processing failed: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.<Void>builder().ok(false).message("Processing failed").build());
        }
    }
}
