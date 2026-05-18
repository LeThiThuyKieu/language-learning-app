package com.languagelearning.repository.mysql;

import com.languagelearning.entity.Leaderboard;
import com.languagelearning.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeaderboardRepository extends JpaRepository<Leaderboard, Integer> {
    // Repository cho bảng `leaderboard`.
    // Chứa các truy vấn phục vụ hiển thị bảng xếp hạng và tính thứ hạng realtime.
    @Query("SELECT l FROM Leaderboard l ORDER BY l.totalKn DESC, l.totalXp DESC")
    List<Leaderboard> findAllOrderByTotalKnDesc();

    /*
     * Dùng cho trang Profile.
     * Lấy thứ hạng của user hiện tại.
     */
    Optional<Leaderboard> findByUser(User user);

    /**
     * Count số users có tổng KN lớn hơn giá trị truyền vào.
     * Dùng để tính rank realtime: rank = count + 1
     * -> không sort toàn bộ hệ thống
     */
    @Query("SELECT COUNT(l) FROM Leaderboard l WHERE l.totalKn > :currentKn")
    Long countByTotalKnGreaterThan(@Param("currentKn") Integer currentKn);

    /**
     * Đếm số user có thứ hạng cao hơn so với giá trị truyền vào.
     * Thứ tự so sánh: `total_kn` giảm dần, nếu bằng nhau thì so `total_xp` giảm dần (tie-breaker).
     * Dùng để tính rank = count + 1 với tie-break đúng theo yêu cầu.
     */
    @Query("SELECT COUNT(l) FROM Leaderboard l WHERE l.totalKn > :currentKn OR (l.totalKn = :currentKn AND l.totalXp > :currentXp)")
    Long countByTotalKnGreaterThanOrTotalXpGreaterWhenEqual(@Param("currentKn") Integer currentKn, @Param("currentXp") Integer currentXp);

    
    /**
     * Lấy top 10 dùng cho BXH hiển thị realtime.
     */
    List<Leaderboard> findTop10ByOrderByTotalKnDescTotalXpDesc();
}

