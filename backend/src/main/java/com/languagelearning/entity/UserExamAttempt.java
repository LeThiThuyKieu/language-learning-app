package com.languagelearning.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Lưu 1 lần làm bài thi của user (1 test gồm đủ 3 paper: Listening, R&W, Speaking).
 * User được phép làm nhiều lần.
 * Không lưu điểm — chỉ lưu câu trả lời và kết quả đúng/sai per câu.
 */
@Entity
@Table(name = "user_exam_attempt",
       indexes = {
           @Index(name = "idx_uea_user",    columnList = "user_id"),
           @Index(name = "idx_uea_test",    columnList = "test_id"),
           @Index(name = "idx_uea_user_test", columnList = "user_id, test_id"),
       })
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserExamAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** FK → users.id */
    @Column(name = "user_id", nullable = false)
    private Integer userId;

    /** FK → exam_test.id */
    @Column(name = "test_id", nullable = false)
    private Integer testId;

    /**
     * % tương đồng LLM của phần Writing (0–100), null nếu không có câu SHORT_WRITE.
     */
    @Column(name = "writing_score")
    private Integer writingScore;

    /**
     * % tương đồng LLM của phần Speaking (0–100), null nếu user không ghi âm.
     */
    @Column(name = "speaking_score")
    private Integer speakingScore;

    /** Tổng câu đúng (chỉ cho các loại có đáp án cụ thể: MC, Fill-in, Matching) */
    @Column(name = "correct_count")
    private Integer correctCount = 0;

    /** Tổng số câu hỏi (có đáp án cụ thể, không tính SHORT_WRITE và SPEAKING_TASK) */
    @Column(name = "total_count")
    private Integer totalCount = 0;

    /** Listening: số câu đúng */
    @Column(name = "listening_correct")
    private Integer listeningCorrect = 0;

    /** Listening: tổng câu có đáp án */
    @Column(name = "listening_total")
    private Integer listeningTotal = 0;

    /** Reading & Writing: số câu đúng */
    @Column(name = "rw_correct")
    private Integer rwCorrect = 0;

    /** Reading & Writing: tổng câu có đáp án */
    @Column(name = "rw_total")
    private Integer rwTotal = 0;

    @Column(name = "attempted_at", nullable = false)
    private LocalDateTime attemptedAt = LocalDateTime.now();

    @OneToMany(mappedBy = "attempt", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserExamQuestionResult> questionResults = new ArrayList<>();
}
