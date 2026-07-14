package com.languagelearning.repository.mysql;

import com.languagelearning.entity.UserExamAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserExamAttemptRepository extends JpaRepository<UserExamAttempt, Long> {

    /** Tất cả lần thi của user (mọi test), mới nhất trước */
    List<UserExamAttempt> findByUserIdOrderByAttemptedAtDesc(Integer userId);

    /** Tất cả lần thi của user với 1 test cụ thể */
    List<UserExamAttempt> findByUserIdAndTestIdOrderByAttemptedAtDesc(Integer userId, Integer testId);

    /** Lần thi gần nhất của user với 1 test */
    Optional<UserExamAttempt> findFirstByUserIdAndTestIdOrderByAttemptedAtDesc(Integer userId, Integer testId);

    /** Tất cả attempt của 1 test (admin view) */
    @Query("SELECT a FROM UserExamAttempt a WHERE a.testId = :testId ORDER BY a.attemptedAt DESC")
    List<UserExamAttempt> findByTestId(@Param("testId") Integer testId);
}
