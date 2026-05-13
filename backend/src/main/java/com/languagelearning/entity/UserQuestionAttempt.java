package com.languagelearning.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Lưu lịch sử từng lần user trả lời một câu hỏi.
 * Dùng để thống kê tỉ lệ đúng/sai theo câu hỏi → điều chỉnh độ khó.
 */
@Entity
@Table(name = "user_question_attempt")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserQuestionAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id")
    private QuestionIndex question;

    @Column(name = "user_answer", columnDefinition = "TEXT")
    private String userAnswer;

    @Column(name = "is_correct")
    private Boolean isCorrect;

    /** 10 nếu đúng, 0 nếu sai */
    @Column(name = "score")
    private Integer score;

    @Column(name = "attempt_time")
    private LocalDateTime attemptTime;

    @PrePersist
    private void prePersist() {
        if (this.attemptTime == null) {
            this.attemptTime = LocalDateTime.now();
        }
    }
}
