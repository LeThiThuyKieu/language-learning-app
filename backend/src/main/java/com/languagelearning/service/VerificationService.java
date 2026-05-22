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
    private static final String EMAIL_PREFIX = "email-verif:email:";

    private final StringRedisTemplate redisTemplate;

    /**
     * Tạo token an toàn cho URL và lưu hai chiều:
     * token -> email và email -> token để có thể xóa token cũ khi đăng ký lại.
     */
    public String generateToken(String email, Duration ttl) {
        invalidateByEmail(email);

        byte[] random = new byte[24];
        new SecureRandom().nextBytes(random);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(random);
        redisTemplate.opsForValue().set(key(token), email.toLowerCase(), ttl);
        redisTemplate.opsForValue().set(emailKey(email), token, ttl);
        return token;
    }

    /**
     * Kiểm tra token và trả về email tương ứng.
     * Nếu token hợp lệ thì xóa luôn cả hai chiều để tránh dùng lại.
     */
    public String consumeToken(String token) {
        String key = key(token);
        String email = redisTemplate.opsForValue().get(key);
        if (email != null) {
            redisTemplate.delete(key);
            redisTemplate.delete(emailKey(email));
        }
        return email;
    }

    /** Xóa token cũ theo email trước khi tạo token mới. */
    public void invalidateByEmail(String email) {
        String emailKey = emailKey(email);
        String existingToken = redisTemplate.opsForValue().get(emailKey);
        if (existingToken != null) {
            redisTemplate.delete(key(existingToken));
        }
        redisTemplate.delete(emailKey);
    }

    private String key(String token) {
        return TOKEN_PREFIX + token;
    }

    private String emailKey(String email) {
        return EMAIL_PREFIX + email.toLowerCase();
    }
}
