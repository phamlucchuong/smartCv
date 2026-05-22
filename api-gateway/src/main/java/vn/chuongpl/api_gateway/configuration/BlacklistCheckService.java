package vn.chuongpl.api_gateway.configuration;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class BlacklistCheckService {
    private final ReactiveRedisTemplate<String, String> redisTemplate;

    public Mono<Boolean> isBlacklisted(String token) {
        return redisTemplate.hasKey(token);
    }
}
