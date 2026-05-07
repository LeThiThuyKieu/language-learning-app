package com.languagelearning.repository.mysql;

import com.languagelearning.entity.User;
import com.languagelearning.entity.UserStreak;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserStreakRepository extends JpaRepository<UserStreak, Integer> {
    List<UserStreak> findByUser(User user);
    Optional<UserStreak> findByUserAndDate(User user, LocalDate date);
    List<UserStreak> findByUserAndDateBetween(User user, LocalDate startDate, LocalDate endDate);
}


