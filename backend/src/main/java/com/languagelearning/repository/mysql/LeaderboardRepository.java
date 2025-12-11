package com.languagelearning.repository.mysql;

import com.languagelearning.entity.Leaderboard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeaderboardRepository extends JpaRepository<Leaderboard, Integer> {
    @Query("SELECT l FROM Leaderboard l ORDER BY l.totalXp DESC")
    List<Leaderboard> findAllOrderByTotalXpDesc();
}


