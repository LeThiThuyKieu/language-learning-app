package com.languagelearning.service.adaptive_learn;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Scheduler cập nhật độ khó adaptive của các skill tree.
 *
 * Chạy mỗi tuần một lần vào thứ Hai lúc 02:00 AM.
 * Cập nhật ngay khi tree có ít nhất 1 mẫu hợp lệ (user done + feedback).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdaptiveDifficultyScheduler {

    private final AdaptiveDifficultyService adaptiveDifficultyService;

    /**
     * Cập nhật difficulty mỗi tuần vào thứ Hai lúc 02:00 AM.
     * Chạy trước LeaderboardScheduler (03:00) để tránh xung đột.
     * Cron: 0 0 2 * * MON
     */
    @Scheduled(cron = "0 59 10 * * THU")
    public void updateDifficultiesWeekly() {
        log.info("[AdaptiveDifficultyScheduler] Starting weekly difficulty update...");
        try {
            adaptiveDifficultyService.updateAllTreeDifficulties();
            log.info("[AdaptiveDifficultyScheduler] Weekly difficulty update done");
        } catch (Exception e) {
            log.error("[AdaptiveDifficultyScheduler] Error during update: {}", e.getMessage(), e);
        }
    }
}
