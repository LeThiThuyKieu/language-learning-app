package com.languagelearning.repository;

import com.languagelearning.entity.User;
import com.languagelearning.entity.StreakHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StreakHistoryRepository extends JpaRepository<StreakHistory, Integer> {
    List<StreakHistory> findByUser(User user);
    Optional<StreakHistory> findByUserAndDate(User user, LocalDate date);
}

