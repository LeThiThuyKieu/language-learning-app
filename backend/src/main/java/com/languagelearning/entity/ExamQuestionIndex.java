package com.languagelearning.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;

/**
 * Mapping giữa MySQL (metadata + correct_answer) và MongoDB (nội dung câu hỏi).
 */
@Entity
@Table(name = "exam_question")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamQuestionIndex {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "part_id", nullable = false)
    @ToString.Exclude
    @JsonIgnore
    private ExamPart part;

    /** Khớp với _id trong MongoDB collection exam_questions */
    @Column(name = "mongo_doc_id", nullable = false, unique = true)
    private String mongoDocId;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false)
    private QuestionType questionType;

    @Column(name = "question_number_start", nullable = false)
    private Integer questionNumberStart;

    @Column(name = "question_number_end", nullable = false)
    private Integer questionNumberEnd;

    /**
     * Đáp án đúng để show lại sau khi nộp bài:
     * MULTIPLE_CHOICE / FILL_IN_TEXT → string đơn, vd: "B", "playing"
     * FILL_IN_FORM / MATCHING        → JSON string, vd: {"6":"July","7":"18"}
     * SHORT_WRITE / SPEAKING_TASK    → null (LLM đánh giá sau)
     */
    @Column(name = "correct_answer", columnDefinition = "TEXT")
    private String correctAnswer;

    @Column(name = "order_index")
    private Integer orderIndex = 0;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum QuestionType {
        MULTIPLE_CHOICE,
        FILL_IN_FORM,
        MATCHING,
        FILL_IN_TEXT,
        SHORT_WRITE,
        SPEAKING_TASK
    }
}


