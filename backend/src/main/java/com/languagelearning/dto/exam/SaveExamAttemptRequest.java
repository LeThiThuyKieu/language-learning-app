package com.languagelearning.dto.exam;

import lombok.Data;

import java.util.List;

/**
 * Request lưu kết quả 1 lần làm bài thi.
 * Gửi khi user hoàn thành tất cả paper (Listening → R&W → Speaking).
 */
@Data
public class SaveExamAttemptRequest {

    private Integer testId;

    /** % writing trung bình từ LLM (null nếu không có SHORT_WRITE) */
    private Integer writingScore;

    /** % speaking trung bình từ LLM (null nếu không ghi âm) */
    private Integer speakingScore;

    /** Kết quả từng câu */
    private List<QuestionResultDto> questionResults;

    @Data
    public static class QuestionResultDto {
        private String  mongoDocId;
        private String  questionType;
        /**
         * Paper section: LISTENING | READING_WRITING | SPEAKING
         * Dùng để tính per-paper correct counts trong summary.
         */
        private String  paperType;
        private String  userAnswer;
        /** null với SHORT_WRITE và SPEAKING_TASK */
        private Boolean isCorrect;
        /** LLM score 0–100 (nullable) */
        private Integer llmScore;
        private String  llmFeedback;
        private String  llmBreakdown;
        private String  llmSuggestion;
        private Integer wordCount;
        /** Transcript ghi âm (chỉ SPEAKING_TASK) */
        private String  transcript;
    }
}
