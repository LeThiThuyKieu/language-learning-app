package com.languagelearning.repository.mysql;

import com.languagelearning.entity.User;
import com.languagelearning.entity.UserReviewAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserReviewAttemptRepository extends JpaRepository<UserReviewAttempt, Long> {

    /**
     * Lấy lần làm review đầu tiên (attempted_at nhỏ nhất) của user cho một node.
     * Dùng để tính accuracy của tree.
     */
    @Query("SELECT r FROM UserReviewAttempt r WHERE r.user = :user AND r.node.id = :nodeId ORDER BY r.attemptedAt ASC LIMIT 1")
    Optional<UserReviewAttempt> findFirstByUserAndNodeId(@Param("user") User user, @Param("nodeId") Integer nodeId);
}
