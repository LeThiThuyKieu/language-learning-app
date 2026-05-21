package com.languagelearning.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Scheduler rebuild leaderboard định kỳ.
 *
 * Mục đích:
 * 1. Sync leaderboard mỗi 1 giờ
 * 2. Fix lệch dữ liệu nếu có
 * 3. Backup khi WebSocket fail
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LeaderboardScheduler {

    private final LeaderboardService leaderboardService;

    /**
     * Rebuild leaderboard mỗi 1 giờ.
     * Cron: "0 0 3 * * *" = 03:00:00 mỗi ngày
     */
    @Scheduled(cron = "0 0 3 * * *")
    public void rebuildLeaderboardHourly() {
        log.info("[LeaderboardScheduler] Starting hourly rebuild...");
        try {
            leaderboardService.rebuildLeaderboard();
            log.info("[LeaderboardScheduler] Hourly rebuild done");
        } catch (Exception e) {
            log.error("[LeaderboardScheduler] Error: {}", e.getMessage());
        }
    }
}
