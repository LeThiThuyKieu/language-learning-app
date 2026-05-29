package com.languagelearning.service;

import com.languagelearning.dto.learning.SkipTestSubmitRequest;
import com.languagelearning.entity.Level;
import com.languagelearning.entity.User;
import com.languagelearning.entity.UserSkipTestAttempt;
import com.languagelearning.exception.BadCredentialsException;
import com.languagelearning.repository.mysql.LevelRepository;
import com.languagelearning.repository.mysql.UserRepository;
import com.languagelearning.repository.mysql.UserSkipTestAttemptRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SkipTestService {

    private final UserRepository userRepository;
    private final LevelRepository levelRepository;
    private final UserSkipTestAttemptRepository userSkipTestAttemptRepository;

    /**
     * Lưu kết quả một lần thử skip-test vào DB.
     *
     * @param email       email của user đang đăng nhập
     * @param levelId     ID của level muốn học vượt lên
     * @param request     kết quả bài làm (correctCount, totalCount, accuracy, passed)
     */
    @Transactional
    public void saveAttempt(String email, Integer levelId, SkipTestSubmitRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("User not found: " + email));

        Level level = levelRepository.findById(levelId)
                .orElseThrow(() -> new IllegalArgumentException("Level not found: " + levelId));

        UserSkipTestAttempt attempt = UserSkipTestAttempt.builder()
                .user(user)
                .targetLevel(level)
                .correctCount(request.getCorrectCount())
                .totalCount(request.getTotalCount())
                .accuracy(request.getAccuracy())
                .passed(request.isPassed())
                .build();

        userSkipTestAttemptRepository.save(attempt);
        log.info("Saved skip-test attempt for user={} level={} accuracy={}% passed={}",
                user.getId(), levelId, request.getAccuracy(), request.isPassed());
    }

    /**
     * Kiểm tra user đã từng pass skip-test cho level này chưa.
     */
    @Transactional(readOnly = true)
    public boolean hasPassed(String email, Integer levelId) {
        return userRepository.findByEmail(email)
                .map(u -> userSkipTestAttemptRepository
                        .existsByUser_IdAndTargetLevel_IdAndPassedTrue(u.getId(), levelId))
                .orElse(false);
    }

    /**
     * Đếm số lần thử của user cho level này.
     */
    @Transactional(readOnly = true)
    public int countAttempts(String email, Integer levelId) {
        return userRepository.findByEmail(email)
                .map(u -> userSkipTestAttemptRepository
                        .countByUser_IdAndTargetLevel_Id(u.getId(), levelId))
                .orElse(0);
    }
}
