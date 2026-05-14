package com.languagelearning.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Lưu kết quả tổng hợp mỗi lần user làm Node Review.
 * Dùng để thống kê: tỷ lệ pass/fail, thời gian trung bình, outcome phân bố.
 */
@Entity
@Table(name = "user_review_attempt")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserReviewAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "node_id", nullable = false)
    private SkillNode node;

    @Column(name = "correct_count", nullable = false)
    private Integer correctCount = 0;

    @Column(name = "total_count", nullable = false)
    private Integer totalCount = 0;

    /** Tỷ lệ đúng 0-100% */
    @Column(name = "accuracy", nullable = false)
    private Integer accuracy = 0;

    /** Thời gian làm bài tính bằng giây */
    @Column(name = "elapsed_seconds", nullable = false)
    private Integer elapsedSeconds = 0;

    /** true nếu hết giờ */
    @Column(name = "timed_out", nullable = false)
    private Boolean timedOut = false;

    /** FAST_TRACKER | STEADY | SLOW_PASS | FAIL | CARELESS */
    @Column(name = "outcome", nullable = false, length = 20)
    private String outcome;

    /** true nếu đạt (outcome != FAIL và != CARELESS) */
    @Column(name = "passed", nullable = false)
    private Boolean passed = false;

    @Column(name = "attempted_at", nullable = false)
    private LocalDateTime attemptedAt;

    @PrePersist
    private void prePersist() {
        if (this.attemptedAt == null) {
            this.attemptedAt = LocalDateTime.now();
        }
    }
}
