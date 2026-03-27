package vn.chuongpl.user_service.features.auth;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@Slf4j
@RequiredArgsConstructor
public class JwtBlacklistService {
    private final RedisTemplate<String, String> redisTemplate;

    public boolean isBlacklisted(String token) {
        return redisTemplate.hasKey(token);
    }

    public void addTokenToBlacklist(String token, long TTL) {
        log.debug("add token to black list " + token);
        redisTemplate.opsForValue().set(token, "blacklist token", Duration.ofSeconds(TTL));
    }
}
