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

    /** Tất cả attempt của 1 user, kèm eager load question results */
    @Query("SELECT DISTINCT a FROM UserExamAttempt a LEFT JOIN FETCH a.questionResults WHERE a.userId = :userId ORDER BY a.attemptedAt DESC")
    List<UserExamAttempt> findByUserIdWithResults(@Param("userId") Integer userId);

    // ─── Global aggregate stats (dùng cho admin stat cards) ───────────────────

    /** Tổng số lượt thi toàn hệ thống */
    @Query("SELECT COUNT(a) FROM UserExamAttempt a")
    long countAll();

    /** Số user đã thi ít nhất 1 lần */
    @Query("SELECT COUNT(DISTINCT a.userId) FROM UserExamAttempt a")
    long countDistinctUsers();

    /**
     * TB tỉ lệ đúng câu có đáp án chuẩn (correct_count / total_count), %.
     * total_count = Listening + R&W objective, KHÔNG tính SHORT_WRITE / SPEAKING_TASK.
     */
    @Query("SELECT AVG(CAST(a.correctCount AS double) / a.totalCount * 100) FROM UserExamAttempt a WHERE a.totalCount > 0")
    Double avgObjectiveAccuracyGlobal();

    /** Tổng writing_score (LLM) — dùng để tính avgAiScore */
    @Query("SELECT SUM(a.writingScore) FROM UserExamAttempt a WHERE a.writingScore IS NOT NULL")
    Double sumWritingScore();

    /** Tổng speaking_score (LLM) — dùng để tính avgAiScore */
    @Query("SELECT SUM(a.speakingScore) FROM UserExamAttempt a WHERE a.speakingScore IS NOT NULL")
    Double sumSpeakingScore();

    /** Số attempt có writing_score */
    @Query("SELECT COUNT(a) FROM UserExamAttempt a WHERE a.writingScore IS NOT NULL")
    long countWithWritingScore();

    /** Số attempt có speaking_score */
    @Query("SELECT COUNT(a) FROM UserExamAttempt a WHERE a.speakingScore IS NOT NULL")
    long countWithSpeakingScore();
}
