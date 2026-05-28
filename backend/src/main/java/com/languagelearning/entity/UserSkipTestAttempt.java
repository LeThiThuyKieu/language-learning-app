package com.languagelearning.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_skip_test_attempt")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSkipTestAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Level muốn học vượt lên */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_level_id", nullable = false)
    private Level targetLevel;

    @Column(name = "correct_count", nullable = false)
    private int correctCount;

    @Column(name = "total_count", nullable = false)
    private int totalCount;

    /** Tỷ lệ đúng 0-100% */
    @Column(name = "accuracy", nullable = false)
    private int accuracy;

    /** true nếu đạt (accuracy >= 70%) */
    @Column(name = "passed", nullable = false)
    private boolean passed;

    @Column(name = "attempted_at", nullable = false)
    @Builder.Default
    private LocalDateTime attemptedAt = LocalDateTime.now();
}
