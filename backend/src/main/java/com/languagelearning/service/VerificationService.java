package com.languagelearning.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class VerificationService {

    private static final String TOKEN_PREFIX = "email-verif:token:";

    private final StringRedisTemplate redisTemplate;

    /** Generate a URL-safe token and store mapping token -> email with TTL. */
    public String generateToken(String email, Duration ttl) {
        byte[] random = new byte[24];
        new SecureRandom().nextBytes(random);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(random);
        redisTemplate.opsForValue().set(key(token), email.toLowerCase(), ttl);
        return token;
    }

    /** Verify token and return associated email, or null if not found/expired. */
    public String consumeToken(String token) {
        String key = key(token);
        String email = redisTemplate.opsForValue().get(key);
        if (email != null) {
            redisTemplate.delete(key);
        }
        return email;
    }

    private String key(String token) {
        return TOKEN_PREFIX + token;
    }
}
