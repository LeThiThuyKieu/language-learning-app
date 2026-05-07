package com.languagelearning.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;

@Service
@RequiredArgsConstructor
public class OtpService {

    private static final String OTP_PREFIX = "otp:reset:";
    private static final Duration OTP_TTL = Duration.ofMinutes(1); // hết hạn sau 1 phút

    private final StringRedisTemplate redisTemplate;

    /** Tạo OTP 6 số, lưu Redis TTL 1 phút, trả về mã. */
    public String generateAndStore(String email) {
        String otp = String.format("%06d", new SecureRandom().nextInt(1_000_000));
        redisTemplate.opsForValue().set(key(email), otp, OTP_TTL);
        return otp;
    }

    /** Xác thực OTP — không xóa, để dùng lại ở bước reset. */
    public boolean verify(String email, String otp) {
        String stored = redisTemplate.opsForValue().get(key(email));
        return otp != null && otp.equals(stored);
    }

    /** Xóa OTP sau khi reset password thành công. */
    public void invalidate(String email) {
        redisTemplate.delete(key(email));
    }

    private String key(String email) {
        return OTP_PREFIX + email.toLowerCase();
    }
}
