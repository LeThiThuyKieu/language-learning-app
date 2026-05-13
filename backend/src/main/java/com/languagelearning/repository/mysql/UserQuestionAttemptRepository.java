package com.languagelearning.repository.mysql;

import com.languagelearning.entity.User;
import com.languagelearning.entity.UserQuestionAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserQuestionAttemptRepository extends JpaRepository<UserQuestionAttempt, Long> {

    @Query("SELECT a FROM UserQuestionAttempt a WHERE a.user = :user AND a.question IS NOT NULL")
    List<UserQuestionAttempt> findByUserWithQuestion(@Param("user") User user);
}
