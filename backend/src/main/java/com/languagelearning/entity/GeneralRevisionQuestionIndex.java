package com.languagelearning.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Bảng MySQL {@code general_revision_questions}: 
 * mapping giữa MongoDB (_id) và SQL (topic_id, task_id),
 * đồng thời lưu correct_answer để chấm điểm.
 * 
 * Tương tự bảng {@code questions} nhưng dành cho General Revision.
 */
@Entity
@Table(name = "general_revision_questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GeneralRevisionQuestionIndex {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "mongo_question_id", nullable = false, unique = true, length = 50)
    private String mongoQuestionId;

    @Column(name = "topic_id", nullable = false)
    private Integer topicId;

    @Column(name = "task_id", nullable = false)
    private Integer taskId;

    @Column(name = "question_type", nullable = false, length = 50)
    private String questionType;

    /**
     * Đáp án đúng để chấm điểm.
     * - VOCAB_IMAGE / LISTENING: đáp án text
     * - SPEAKING / MATCHING: NULL (chấm bằng logic khác)
     */
    @Column(name = "correct_answer", columnDefinition = "TEXT")
    private String correctAnswer;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
