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
}
