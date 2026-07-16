package com.languagelearning.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;

@Service
@RequiredArgsConstructor
public class OtpService {

    private static final String OTP_PREFIX       = "otp:reset:";
    private static final String ATTEMPT_PREFIX   = "otp:attempt:";
    private static final int    MAX_ATTEMPTS     = 5;
    private static final Duration OTP_TTL        = Duration.ofMinutes(5);
    private static final Duration ATTEMPT_TTL    = Duration.ofSeconds(60);

    private final StringRedisTemplate redisTemplate;

    /** Tạo OTP 6 số, lưu Redis TTL mặc định (5 phút), trả về mã. */
    public String generateAndStore(String email) {
        String otp = String.format("%06d", new SecureRandom().nextInt(1_000_000));
        String normalizedEmail = email.toLowerCase();
        redisTemplate.opsForValue().set(key(normalizedEmail), otp, OTP_TTL);
        // Reset attempt counter khi gửi OTP mới
        redisTemplate.delete(attemptKey(normalizedEmail));
        return otp;
    }

    /**
     * Xác thực OTP — đếm số lần sai, khoá sau MAX_ATTEMPTS lần.
     * Không xóa OTP đúng, để dùng lại ở bước reset.
     */
    public boolean verify(String email, String otp) {
        String normalizedEmail = email.toLowerCase();
        String stored = redisTemplate.opsForValue().get(key(normalizedEmail));

        // OTP đã hết hạn hoặc chưa được tạo
        if (stored == null) {
            return false;
        }

        // Kiểm tra số lần sai
        String attemptStr = redisTemplate.opsForValue().get(attemptKey(normalizedEmail));
        int attempts = attemptStr != null ? Integer.parseInt(attemptStr) : 0;
        if (attempts >= MAX_ATTEMPTS) {
            // Đã vượt giới hạn — OTP bị vô hiệu hoá
            redisTemplate.delete(key(normalizedEmail));
            return false;
        }

        if (otp != null && otp.equals(stored)) {
            // Đúng — reset counter
            redisTemplate.delete(attemptKey(normalizedEmail));
            return true;
        }

        // Sai — tăng counter
        redisTemplate.opsForValue().increment(attemptKey(normalizedEmail));
        redisTemplate.expire(attemptKey(normalizedEmail), ATTEMPT_TTL);
        return false;
    }

    /** Kiểm tra xem email có đang bị khoá do nhập sai OTP quá nhiều lần không. */
    public boolean isLocked(String email) {
        String normalizedEmail = email.toLowerCase();
        String attemptStr = redisTemplate.opsForValue().get(attemptKey(normalizedEmail));
        if (attemptStr == null) return false;
        return Integer.parseInt(attemptStr) >= MAX_ATTEMPTS;
    }

    /** Số lần sai còn lại (để trả về cho frontend). */
    public int getRemainingAttempts(String email) {
        String normalizedEmail = email.toLowerCase();
        String attemptStr = redisTemplate.opsForValue().get(attemptKey(normalizedEmail));
        int attempts = attemptStr != null ? Integer.parseInt(attemptStr) : 0;
        return Math.max(0, MAX_ATTEMPTS - attempts);
    }

    /** Xóa OTP sau khi reset password thành công. */
    public void invalidate(String email) {
        String normalizedEmail = email.toLowerCase();
        redisTemplate.delete(key(normalizedEmail));
        redisTemplate.delete(attemptKey(normalizedEmail));
    }

    private String key(String email) {
        return OTP_PREFIX + email.toLowerCase();
    }

    private String attemptKey(String email) {
        return ATTEMPT_PREFIX + email.toLowerCase();
    }
}
