package vn.chuongpl.api_gateway.configuration;

import com.nimbusds.jwt.JWTClaimsSet;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import lombok.experimental.NonFinal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationFilter implements GlobalFilter, Ordered {
    GatewayJwtUtils jwtUtils;
    BlacklistCheckService blacklistCheck;
    PublicRoutesMatcher publicRoutesMatcher;

    @NonFinal
    @Value("${app.gateway.internal-secret}")
    String internalSecret;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        if (publicRoutesMatcher.isPublic(exchange)) {
            return chain.filter(addInternalSecret(exchange));
        }

        List<String> authHeaders = exchange.getRequest().getHeaders().get(HttpHeaders.AUTHORIZATION);
        if (CollectionUtils.isEmpty(authHeaders)) {
            return reject(exchange.getResponse(), HttpStatus.UNAUTHORIZED, "Missing Authorization header");
        }

        String token = authHeaders.getFirst().replace("Bearer ", "").strip();

        try {
            JWTClaimsSet claims = jwtUtils.verify(token);
            String userId = jwtUtils.extractUserId(claims);
            String scope = jwtUtils.extractScope(claims);

            return blacklistCheck.isBlacklisted(token).flatMap(blacklisted -> {
                if (Boolean.TRUE.equals(blacklisted)) {
                    return reject(exchange.getResponse(), HttpStatus.UNAUTHORIZED, "Token revoked");
                }
                ServerWebExchange mutated = exchange.mutate().request(r -> r
                        .header("X-User-Id", userId == null ? "" : userId)
                        .header("X-User-Scope", scope == null ? "" : scope)
                        .header("X-Gateway-Secret", internalSecret)
                ).build();
                return chain.filter(mutated);
            });

        } catch (Exception e) {
            log.warn("JWT validation failed: {}", e.getMessage());
            return reject(exchange.getResponse(), HttpStatus.UNAUTHORIZED, "Invalid token");
        }
    }

    @Override
    public int getOrder() {
        return -1;
    }

    private ServerWebExchange addInternalSecret(ServerWebExchange exchange) {
        return exchange.mutate().request(r -> r.header("X-Gateway-Secret", internalSecret)).build();
    }

    private Mono<Void> reject(ServerHttpResponse response, HttpStatus status, String message) {
        response.setStatusCode(status);
        byte[] bytes = message.getBytes(StandardCharsets.UTF_8);
        return response.writeWith(Mono.just(response.bufferFactory().wrap(bytes)));
    }
}
