package vn.chuongpl.user_service.integration.notification;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NotificationClient {
    RestTemplate restTemplate;

    @NonFinal
    @Value("${NOTIFICATION_SERVICE_URL:http://localhost:8084}")
    String notificationServiceUrl;

    public void sendOTP(String target, String targetType) {
        String url = notificationServiceUrl + "/api/otp/send";
        Map<String, Object> request = new HashMap<>();
        request.put("target", target);
        request.put("target_type", targetType);

        restTemplate.postForObject(url, request, Void.class);
    }

    public boolean verifyOTP(String target, String targetType, String code) {
        String url = notificationServiceUrl + "/api/otp/verify";
        Map<String, Object> request = new HashMap<>();
        request.put("target", target);
        request.put("target_type", targetType);
        request.put("code", code);

        try {
            restTemplate.postForObject(url, request, Void.class);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
