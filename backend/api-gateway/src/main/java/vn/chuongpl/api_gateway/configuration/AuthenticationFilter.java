package vn.chuongpl.api_gateway.configuration;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import vn.chuongpl.api_gateway.service.IdentityService;

import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationFilter implements GlobalFilter, Ordered {
    IdentityService identityService;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        HttpMethod method = exchange.getRequest().getMethod();

        if (path.endsWith("user/api/auth/login")
                || path.endsWith("user/api/auth/register")
                || path.endsWith("user/api/auth/verify-registration")
                || path.endsWith("user/api/auth/resend-otp")
                || path.endsWith("user/api/auth/forgot-password")
                || path.endsWith("user/api/auth/reset-password")
                || path.endsWith("notification/api/otp/send")
                || path.endsWith("notification/api/otp/verify")
                || (path.contains("job/api/jobs") && method == HttpMethod.GET && !path.contains("/my") && !path.contains("/admin"))) {
            return chain.filter(exchange);
        }

        List<String> authHeaders = exchange.getRequest().getHeaders().get(HttpHeaders.AUTHORIZATION);
        if (CollectionUtils.isEmpty(authHeaders)) {
            return unauthenticated(exchange.getResponse());
        }

        String token = authHeaders.getFirst().replace("Bearer ", "");
        return identityService.introspect(token).flatMap(response -> {
            if (response == null || response.getData() == null || !response.getData().isAuthenticated()) {
                return unauthenticated(exchange.getResponse());
            }
            return chain.filter(exchange);
        });
    }

    @Override
    public int getOrder() {
        return -1;
    }

    Mono<Void> unauthenticated(ServerHttpResponse response) {
        String body = "Unauthorized";
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        return response.writeWith(Mono.just(response.bufferFactory().wrap(body.getBytes())));
    }
}
