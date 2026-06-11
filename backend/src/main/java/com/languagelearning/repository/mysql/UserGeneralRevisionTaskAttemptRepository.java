package com.languagelearning.repository.mysql;

import com.languagelearning.entity.User;
import com.languagelearning.entity.UserGeneralRevisionTaskAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Repository
public interface UserGeneralRevisionTaskAttemptRepository
        extends JpaRepository<UserGeneralRevisionTaskAttempt, Long> {

    List<UserGeneralRevisionTaskAttempt> findByUserOrderByAttemptedAtDesc(User user);

    @Query("SELECT COUNT(a) FROM UserGeneralRevisionTaskAttempt a WHERE a.user = :user AND a.task.id = :taskId")
    int countByUserAndTaskId(@Param("user") User user, @Param("taskId") Integer taskId);

    /**
     * Trả về Map<taskId, count> cho tất cả task của user.
     * Dùng trong service để tránh lazy load N+1.
     */
    @Query("SELECT a.task.id, COUNT(a) FROM UserGeneralRevisionTaskAttempt a WHERE a.user = :user GROUP BY a.task.id")
    List<Object[]> countAttemptsGroupedByTaskRaw(@Param("user") User user);

    default Map<Integer, Long> countAttemptsGroupedByTaskForUser(User user) {
        return countAttemptsGroupedByTaskRaw(user)
                .stream()
                .collect(Collectors.toMap(
                        row -> (Integer) row[0],
                        row -> (Long) row[1]
                ));
    }

    /**
     * Tổng hợp lịch sử làm task của user theo từng task:
     * [taskId, count, maxScore, lastAttemptAt]
     */
    @Query("SELECT a.task.id, COUNT(a), MAX(a.score), MAX(a.attemptedAt) " +
           "FROM UserGeneralRevisionTaskAttempt a " +
           "WHERE a.user = :user " +
           "GROUP BY a.task.id")
    List<Object[]> findAttemptSummaryRawByUser(@Param("user") User user);

    /**
     * Trả về tổng số lần attempt của user (dùng cho summary).
     */
    @Query("SELECT COUNT(a) FROM UserGeneralRevisionTaskAttempt a WHERE a.user = :user")
    long countTotalAttemptsByUser(@Param("user") User user);

    /**
     * Lấy score của lần attempt gần nhất theo từng task.
     * Trả về [taskId, score] của bản ghi có attemptedAt lớn nhất.
     */
    @Query("SELECT a.task.id, a.score FROM UserGeneralRevisionTaskAttempt a " +
           "WHERE a.user = :user AND a.attemptedAt = (" +
           "  SELECT MAX(a2.attemptedAt) FROM UserGeneralRevisionTaskAttempt a2 " +
           "  WHERE a2.user = :user AND a2.task.id = a.task.id" +
           ")")
    List<Object[]> findLastScoreByUserGroupedByTask(@Param("user") User user);
}
