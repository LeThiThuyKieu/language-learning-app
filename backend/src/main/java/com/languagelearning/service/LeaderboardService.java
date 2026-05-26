package com.languagelearning.service;

import com.languagelearning.dto.RankUpdateResponse;
import com.languagelearning.dto.LeaderboardEntryResponse;
import com.languagelearning.entity.Leaderboard;
import com.languagelearning.entity.User;
import com.languagelearning.entity.UserKn;
import com.languagelearning.entity.UserProfile;
import com.languagelearning.repository.mysql.LeaderboardRepository;
import com.languagelearning.repository.mysql.UserKnRepository;
import com.languagelearning.repository.mysql.UserRepository;
import com.languagelearning.repository.mysql.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.math.BigInteger;

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

    public enum LeaderboardPeriod {
        WEEK,
        MONTH,
        ALL;

        public static LeaderboardPeriod from(String raw) {
            if (raw == null || raw.isBlank()) {
                return WEEK;
            }
            try {
                LeaderboardPeriod parsed = LeaderboardPeriod.valueOf(raw.trim().toUpperCase());
                return parsed;
            } catch (IllegalArgumentException ex) {
                return WEEK;
            }
        }
    }

    private final LeaderboardRepository leaderboardRepository;
    private final UserKnRepository userKnRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
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
    /**
     * Cập nhật thứ hạng realtime khi user thay đổi `total_kn` hoặc `total_xp`.
     *
     * Luồng:
     * 1) Tính thứ hạng mới theo: `total_kn` giảm dần; nếu bằng nhau thì dùng `total_xp` giảm dần (tie-break).
     * 2) Cập nhật/tao bản ghi `leaderboard` cho user.
     * 3) Push WebSocket riêng cho user tại `/topic/rank/{userId}` để cập nhật rank cá nhân.
     * 4) Broadcast snapshot top 10 lên `/topic/leaderboard` để các client hiển thị BXH chung realtime.
     */
    @Transactional
    public void updateRankRealtime(Integer userId, Integer newTotalKn, Integer newTotalXp) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

            // Tính rank mới (COUNT với tie-breaker: total_kn DESC, total_xp DESC)
            Integer newRank = calculateUserRank(newTotalKn, newTotalXp);

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

            // Update leaderboard (set both KN và XP)
            leaderboard.setTotalKn(newTotalKn);
            leaderboard.setTotalXp(newTotalXp == null ? 0 : newTotalXp);
            leaderboard.setRankPosition(newRank);
            leaderboard.setUpdatedAt(LocalDateTime.now());
            leaderboardRepository.save(leaderboard);

            log.info("[Leaderboard] User {} rank: {} → {}, KN: {}",
                    userId, oldRank, newRank, newTotalKn);

            // Push rank update cho user vừa thay đổi
            pushRankUpdate(userId, oldRank, newRank, newTotalKn);

            // Chỉ broadcast TOP 10 khi thay đổi có thể ảnh hưởng danh sách TOP 10
            int oldRankSafe = oldRank == null ? Integer.MAX_VALUE : oldRank;
            int newRankSafe = newRank == null ? Integer.MAX_VALUE : newRank;
            if (oldRankSafe <= 10 || newRankSafe <= 10) {
                broadcastLeaderboardSnapshot();
            }

        } catch (Exception e) {
            log.error("[Leaderboard] Error updating rank: {}", e.getMessage());
        }
    }

    /**
     * Lấy top N BXH để render UI.
     *
     * Dữ liệu lấy từ bảng leaderboard đã được sync bởi progress/rebuild.
     */
    /**
     * Lấy snapshot top N (mặc định N<=10) để hiển thị bảng xếp hạng.
     * Trả về danh sách đã include `rankPosition` (1-based).
     */
    @Transactional(readOnly = true)
    public List<LeaderboardEntryResponse> getTopLeaderboard(int limit) {
        return getTopLeaderboard(limit, LeaderboardPeriod.ALL);
    }

    @Transactional(readOnly = true)
    public List<LeaderboardEntryResponse> getTopLeaderboard(int limit, LeaderboardPeriod period) {
        int safeLimit = Math.max(1, Math.min(limit, 10));

        if (period == LeaderboardPeriod.WEEK || period == LeaderboardPeriod.MONTH) {
            return getTopLeaderboardByPeriod(safeLimit, period);
        }

        List<Leaderboard> topLeaderboards = leaderboardRepository.findTop10ByOrderByTotalKnDescTotalXpDesc();

        return IntStream.range(0, Math.min(safeLimit, topLeaderboards.size()))
            .mapToObj(index -> toResponse(topLeaderboards.get(index), index + 1))
                .toList();
    }

    @Transactional(readOnly = true)
    protected List<LeaderboardEntryResponse> getTopLeaderboardByPeriod(int limit, LeaderboardPeriod period) {
        LocalDate today = LocalDate.now();
        LocalDate startDate = period == LeaderboardPeriod.WEEK
                ? today.minusDays(6)
                : YearMonth.now().atDay(1);

        String sql = """
            SELECT us.user_id AS userId,
                   COALESCE(SUM(us.earned_kn), 0) AS periodKn,
                   COALESCE(SUM(us.earned_xp), 0) AS periodXp
            FROM user_streak us
            WHERE us.date BETWEEN ?1 AND ?2
            GROUP BY us.user_id
            ORDER BY periodKn DESC, periodXp DESC, us.user_id ASC
            LIMIT ?3
            """;

        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery(sql)
                .setParameter(1, startDate)
                .setParameter(2, today)
                .setParameter(3, limit)
                .getResultList();

        return IntStream.range(0, rows.size())
            .mapToObj(index -> toPeriodResponse(rows.get(index), index + 1))
            .toList();
    }

    /**
     * Tính rank tối ưu - chỉ COUNT số users có KN lớn hơn.
     *
     * Query: SELECT COUNT(*) + 1 FROM user_kn WHERE total_kn > :currentKn
     *
     * @param currentTotalKn KN hiện tại của user
     * @return rank position (1 = top 1)
     */
    @PersistenceContext
    private EntityManager entityManager;

        /**
         * Tính thứ hạng của user dựa trên `currentTotalKn` và `currentTotalXp`.
         * Sử dụng truy vấn COUNT tối ưu (không sort toàn bộ bảng).
         */
        @Transactional(readOnly = true)
    public Integer calculateUserRank(Integer currentTotalKn, Integer currentTotalXp) {
        int curXp = currentTotalXp == null ? 0 : currentTotalXp;

        String sql = "SELECT COUNT(*) FROM user_kn uk " +
                "LEFT JOIN user_profile up ON up.user_id = uk.user_id " +
            "WHERE uk.total_kn > ?1 OR (uk.total_kn = ?1 AND COALESCE(up.total_xp,0) > ?2)";

        Object result = entityManager.createNativeQuery(sql)
            .setParameter(1, currentTotalKn)
            .setParameter(2, curXp)
                .getSingleResult();

        long countHigher = 0;
        if (result instanceof BigInteger) {
            countHigher = ((BigInteger) result).longValue();
        } else if (result instanceof Number) {
            countHigher = ((Number) result).longValue();
        }

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

            // Sort theo totalKn DESC, nếu bằng thì so totalXp DESC (tie-breaker)
            allUserKns.sort(Comparator
                    .comparingInt(UserKn::getTotalKn).reversed()
                    .thenComparing((UserKn uk) -> userProfileRepository.findByUser(uk.getUser())
                            .map(up -> up.getTotalXp() == null ? 0 : up.getTotalXp()).orElse(0), Comparator.reverseOrder())
            );

            for (int i = 0; i < allUserKns.size(); i++) {
                UserKn userKn = allUserKns.get(i);
                int rank = i + 1;

                int totalXp = userProfileRepository.findByUser(userKn.getUser())
                        .map(up -> up.getTotalXp() == null ? 0 : up.getTotalXp()).orElse(0);

                Leaderboard leaderboard = leaderboardRepository.findByUser(userKn.getUser())
                        .orElseGet(() -> {
                            Leaderboard lb = new Leaderboard();
                            lb.setUser(userKn.getUser());
                            lb.setTotalXp(0);
                            return lb;
                        });

                leaderboard.setTotalKn(userKn.getTotalKn());
                leaderboard.setTotalXp(totalXp);
                leaderboard.setRankPosition(rank);
                leaderboard.setUpdatedAt(LocalDateTime.now());
                leaderboardRepository.save(leaderboard);
            }

            // Sync xong thì phát lại BXH top 10 cho client đang mở.
            broadcastLeaderboardSnapshot();
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

    /**
     * Broadcast lại top 10 để frontend không phải polling.
     */
    /**
     * Gửi snapshot top 10 lên topic `/topic/leaderboard` để mọi client nhận được cập nhật BXH.
     * Dùng khi có thay đổi KN/XP hoặc sau khi rebuild toàn bộ leaderboard.
     */
    private void broadcastLeaderboardSnapshot() {
        try {
            List<LeaderboardEntryResponse> snapshot = getTopLeaderboard(10, LeaderboardPeriod.ALL);
            messagingTemplate.convertAndSend("/topic/leaderboard", snapshot);
        } catch (Exception e) {
            log.error("[WebSocket] Error broadcasting leaderboard snapshot: {}", e.getMessage());
        }
    }

    private LeaderboardEntryResponse toPeriodResponse(Object[] row, Integer rankPosition) {
        Integer userId = row[0] == null ? null : ((Number) row[0]).intValue();
        int periodKn = row[1] == null ? 0 : ((Number) row[1]).intValue();
        int periodXp = row.length > 2 && row[2] == null ? 0 : (row.length > 2 ? ((Number) row[2]).intValue() : 0);

        if (userId == null) {
            return new LeaderboardEntryResponse(rankPosition, 0, "Unknown", null, 0, periodXp, LocalDateTime.now());
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return new LeaderboardEntryResponse(rankPosition, userId, "Unknown", null, 0, periodXp, LocalDateTime.now());
        }

        Optional<UserProfile> profile = userProfileRepository.findByUser(user);
        String displayName = profile.map(UserProfile::getFullName)
                .filter(name -> name != null && !name.isBlank())
                .orElse(user.getEmail());

        // For period leaderboards we show period KN as `totalKn` and period XP as `totalXp`.
        return new LeaderboardEntryResponse(
            rankPosition,
            userId,
            displayName,
            profile.map(UserProfile::getAvatarUrl).orElse(null),
            periodKn,
            periodXp,
            LocalDateTime.now()
        );
    }

        /**
         * Chuyển entity `Leaderboard` thành DTO trả về cho API/WebSocket.
         * `rankPosition` có thể được truyền vào (1-based) khi build snapshot top N.
         */
        private LeaderboardEntryResponse toResponse(Leaderboard leaderboard, Integer rankPosition) {
        Optional<UserProfile> profile = userProfileRepository.findByUser(leaderboard.getUser());
        String displayName = profile.map(UserProfile::getFullName)
            .filter(name -> name != null && !name.isBlank())
            .orElse(leaderboard.getUser().getEmail());

        return new LeaderboardEntryResponse(
            rankPosition,
            leaderboard.getUser().getId(),
            displayName,
            profile.map(UserProfile::getAvatarUrl).orElse(null),
            leaderboard.getTotalKn() == null ? 0 : leaderboard.getTotalKn(),
            leaderboard.getTotalXp() == null ? 0 : leaderboard.getTotalXp(),
            leaderboard.getUpdatedAt()
        );
        }
}
