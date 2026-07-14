package com.languagelearning.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Kết quả từng câu hỏi trong 1 lần thi.
 * Mỗi bản ghi = 1 câu của 1 lần làm bài.
 */
@Entity
@Table(name = "user_exam_question_result",
       indexes = {
           @Index(name = "idx_ueqr_attempt",    columnList = "attempt_id"),
           @Index(name = "idx_ueqr_mongo_doc",  columnList = "mongo_doc_id"),
       })
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserExamQuestionResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    private UserExamAttempt attempt;

    /** Khớp với ExamQuestionIndex.mongoDocId */
    @Column(name = "mongo_doc_id", nullable = false, length = 100)
    private String mongoDocId;

    /** Loại câu: MULTIPLE_CHOICE, FILL_IN_FORM, MATCHING, FILL_IN_TEXT, SHORT_WRITE, SPEAKING_TASK */
    @Column(name = "question_type", nullable = false, length = 30)
    private String questionType;

    /** Câu trả lời của user (raw string / JSON) */
    @Column(name = "user_answer", columnDefinition = "TEXT")
    private String userAnswer;

    /**
     * Đối với câu có đáp án cụ thể: đúng/sai.
     * Đối với SHORT_WRITE và SPEAKING_TASK: null.
     */
    @Column(name = "is_correct")
    private Boolean isCorrect;

    /**
     * % tương đồng LLM cho SHORT_WRITE và SPEAKING_TASK (0–100).
     * null với các loại khác.
     */
    @Column(name = "llm_score")
    private Integer llmScore;

    /** Feedback ngắn từ LLM (nullable, chỉ cho SHORT_WRITE / SPEAKING_TASK) */
    @Column(name = "llm_feedback", columnDefinition = "TEXT")
    private String llmFeedback;

    /** Breakdown JSON từ LLM (nullable) */
    @Column(name = "llm_breakdown", columnDefinition = "TEXT")
    private String llmBreakdown;

    /** Gợi ý cải thiện từ LLM (nullable, chỉ Writing) */
    @Column(name = "llm_suggestion", columnDefinition = "TEXT")
    private String llmSuggestion;

    /** Số từ (nullable, chỉ Writing) */
    @Column(name = "word_count")
    private Integer wordCount;

    /** Transcript ghi âm (nullable, chỉ SPEAKING_TASK) */
    @Column(name = "transcript", columnDefinition = "TEXT")
    private String transcript;
}
