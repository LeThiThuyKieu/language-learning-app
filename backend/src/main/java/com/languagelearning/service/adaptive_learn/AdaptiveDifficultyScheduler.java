package com.languagelearning.service.adaptive_learn;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Scheduler cập nhật độ khó adaptive của các skill tree.
 *
 * Chạy hàng ngày lúc 02:00 AM.
 * Chỉ cập nhật tree khi có ≥ 30 mẫu hợp lệ (user done + feedback).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdaptiveDifficultyScheduler {

    private final AdaptiveDifficultyService adaptiveDifficultyService;

    /**
     * Cập nhật difficulty hàng ngày lúc 02:00 AM.
     * Chạy trước LeaderboardScheduler (03:00) để tránh xung đột.
     */
    @Scheduled(cron = "0 0 2 * * *")
    public void updateDifficultiesDaily() {
        log.info("[AdaptiveDifficultyScheduler] Starting daily difficulty update...");
        try {
            adaptiveDifficultyService.updateAllTreeDifficulties();
            log.info("[AdaptiveDifficultyScheduler] Daily difficulty update done");
        } catch (Exception e) {
            log.error("[AdaptiveDifficultyScheduler] Error during update: {}", e.getMessage(), e);
        }
    }
}
