package com.languagelearning.service;

import com.languagelearning.dto.RankUpdateResponse;
import com.languagelearning.entity.Leaderboard;
import com.languagelearning.entity.User;
import com.languagelearning.entity.UserKn;
import com.languagelearning.repository.mysql.LeaderboardRepository;
import com.languagelearning.repository.mysql.UserKnRepository;
import com.languagelearning.repository.mysql.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

/**
 * LeaderboardService - Quản lý xếp hạng realtime
 *
 * Khi user hoàn thành bài học:
 * 1. Tính rank mới (COUNT query tối ưu - không sort toàn bộ)
 * 2. Update leaderboard entry
 * 3. Push WebSocket realtime
 * 4. Scheduler sync định kỳ để fix lệch dữ liệu
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final LeaderboardRepository leaderboardRepository;
    private final UserKnRepository userKnRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Cập nhật rank realtime khi user cộng KN.
     *
     * Flow:
     * 1. Lấy total_kn từ user_kn
     * 2. Tính rank = COUNT(users có KN > current) + 1
     * 3. Update leaderboard
     * 4. Push WebSocket
     */
    @Transactional
    public void updateRankRealtime(Integer userId, Integer newTotalKn) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

            // Tính rank mới (chỉ COUNT, không sort)
            Integer newRank = calculateUserRank(newTotalKn);

            // Lấy hoặc tạo leaderboard entry
            Leaderboard leaderboard = leaderboardRepository.findByUser(user)
                    .orElseGet(() -> {
                        Leaderboard lb = new Leaderboard();
                        lb.setUser(user);
                        lb.setTotalXp(0);
                        lb.setTotalKn(0);
                        lb.setRankPosition(0);
                        return lb;
                    });

            Integer oldRank = leaderboard.getRankPosition();

            // Update leaderboard
            leaderboard.setTotalKn(newTotalKn);
            leaderboard.setRankPosition(newRank);
            leaderboard.setUpdatedAt(LocalDateTime.now());
            leaderboardRepository.save(leaderboard);

            log.info("[Leaderboard] User {} rank: {} → {}, KN: {}",
                    userId, oldRank, newRank, newTotalKn);

            // Push WebSocket
            pushRankUpdate(userId, oldRank, newRank, newTotalKn);

        } catch (Exception e) {
            log.error("[Leaderboard] Error updating rank: {}", e.getMessage());
        }
    }

    /**
     * Tính rank tối ưu - chỉ COUNT số users có KN lớn hơn.
     *
     * Query: SELECT COUNT(*) + 1 FROM user_kn WHERE total_kn > :currentKn
     *
     * @param currentTotalKn KN hiện tại của user
     * @return rank position (1 = top 1)
     */
    @Transactional(readOnly = true)
    public Integer calculateUserRank(Integer currentTotalKn) {
        Long countHigher = leaderboardRepository.countByTotalKnGreaterThan(currentTotalKn);
        return Math.toIntExact(countHigher + 1);
    }

    /**
     * Rebuild leaderboard toàn bộ (dùng cho scheduler).
     *
     * Mỗi 1 giờ chạy để:
     * - Sync dữ liệu nếu WebSocket bị fail
     * - Fix lệch dữ liệu do edge case
     */
    @Transactional
    public void rebuildLeaderboard() {
        log.info("[Leaderboard] Starting rebuild...");

        try {
            List<UserKn> allUserKns = userKnRepository.findAll();

            // Sort theo totalKn DESC để tính rank
            allUserKns.sort(Comparator.comparingInt(UserKn::getTotalKn).reversed());

            for (int i = 0; i < allUserKns.size(); i++) {
                UserKn userKn = allUserKns.get(i);
                int rank = i + 1;

                Leaderboard leaderboard = leaderboardRepository.findByUser(userKn.getUser())
                        .orElseGet(() -> {
                            Leaderboard lb = new Leaderboard();
                            lb.setUser(userKn.getUser());
                            lb.setTotalXp(0);
                            return lb;
                        });

                leaderboard.setTotalKn(userKn.getTotalKn());
                leaderboard.setRankPosition(rank);
                leaderboard.setUpdatedAt(LocalDateTime.now());
                leaderboardRepository.save(leaderboard);
            }

            log.info("[Leaderboard] Rebuild done. Total users: {}", allUserKns.size());

        } catch (Exception e) {
            log.error("[Leaderboard] Rebuild error: {}", e.getMessage());
        }
    }

    /**
     * Push WebSocket khi rank thay đổi.
     *
     * Topic: /topic/rank/{userId}
     * Frontend subscribe để nhận realtime
     */
    private void pushRankUpdate(Integer userId, Integer oldRank, Integer newRank, Integer totalKn) {
        try {
            RankUpdateResponse response = new RankUpdateResponse(
                    userId, oldRank, newRank, totalKn, LocalDateTime.now()
            );

            messagingTemplate.convertAndSend(
                    "/topic/rank/" + userId,
                    response
            );

            log.debug("[WebSocket] Rank update pushed to user {}", userId);

        } catch (Exception e) {
            log.error("[WebSocket] Error pushing: {}", e.getMessage());
        }
    }
}
