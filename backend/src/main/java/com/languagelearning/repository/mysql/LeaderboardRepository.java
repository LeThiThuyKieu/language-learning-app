package com.languagelearning.repository.mysql;

import com.languagelearning.entity.Leaderboard;
import com.languagelearning.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeaderboardRepository extends JpaRepository<Leaderboard, Integer> {
    @Query("SELECT l FROM Leaderboard l ORDER BY l.totalXp DESC")
    List<Leaderboard> findAllOrderByTotalXpDesc();

    /*
     * Dùng cho trang Profile.
     * Lấy thứ hạng của user hiện tại.
     */
    Optional<Leaderboard> findByUser(User user);
}


