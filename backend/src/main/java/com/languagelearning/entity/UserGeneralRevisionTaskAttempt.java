package com.languagelearning.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Lịch sử làm từng task ôn tập tổng hợp.
 * User có thể làm nhiều lần, không giới hạn.
 * Không tính thời gian, không có pass/fail.
 */
@Entity
@Table(name = "user_general_revision_task_attempt")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserGeneralRevisionTaskAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private GeneralRevisionTask task;

    @Column(name = "correct_count", nullable = false)
    private Integer correctCount = 0;

    @Column(name = "total_count", nullable = false)
    private Integer totalCount = 0;

    /** Score 0-100 = (correctCount / totalCount) * 100 */
    @Column(name = "score", nullable = false)
    private Integer score = 0;

    @Column(name = "attempted_at", nullable = false)
    private LocalDateTime attemptedAt;

    @PrePersist
    protected void onCreate() {
        if (attemptedAt == null) {
            attemptedAt = LocalDateTime.now();
        }
    }
}
