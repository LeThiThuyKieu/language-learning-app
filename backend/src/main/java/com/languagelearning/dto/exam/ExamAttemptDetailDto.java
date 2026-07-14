package com.languagelearning.dto.exam;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Chi tiết 1 lần làm bài — dùng khi user xem lại bài.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamAttemptDetailDto {

    private Long          id;
    private Integer       testId;
    private String        testTitle;
    private Integer       writingScore;
    private Integer       speakingScore;
    private Integer       correctCount;
    private Integer       totalCount;
    private LocalDateTime attemptedAt;

    /** Kết quả từng câu — bao gồm nội dung câu hỏi từ MongoDB */
    private List<QuestionResultDetailDto> questionResults;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionResultDetailDto {
        private String  mongoDocId;
        private String  questionType;

        /**
         * Paper section: LISTENING | READING_WRITING | SPEAKING
         * Dùng để group câu hỏi theo phần thi khi xem lại.
         */
        private String  paperType;

        /**
         * Part number trong paper (1, 2, 3...).
         */
        private Integer partNumber;

        // Metadata từ MongoDB (để hiển thị lại câu hỏi)
        private String  instruction;
        private Integer questionNumber;
        private String  text;           // MC
        private String  sentence;       // FILL_IN_TEXT
        private String  formContent;    // FILL_IN_FORM
        private String  promptText;     // SHORT_WRITE
        private String  partTitle;      // SPEAKING_TASK

        /**
         * FILL_IN_FORM: options per blank — [{number: int, options: ["class","subject","course"]}]
         * Dùng để convert chữ cái A/B/C trong correct_answer sang text thực.
         */
        private java.util.List<java.util.Map<String, Object>> blanksOptions;

        /** MULTIPLE_CHOICE: [{id, text, image_url}] */
        private java.util.List<java.util.Map<String, Object>> options;

        /** R&W: ảnh passage/notice */
        private String passageImageUrl;

        /** MATCHING: left/right items */
        private java.util.List<java.util.Map<String, Object>> leftItems;
        private java.util.List<java.util.Map<String, Object>> rightItems;

        /** SHORT_WRITE: bullet points + story images */
        private java.util.List<String> bulletPoints;
        private java.util.List<java.util.Map<String, Object>> storyImages;

        /** SPEAKING_TASK: image url */
        private String imageUrl;

        // Kết quả
        private String  userAnswer;
        private Boolean isCorrect;
        /** Đáp án đúng (từ MySQL correct_answer). Null với SHORT_WRITE và SPEAKING_TASK */
        private String  correctAnswer;

        // LLM fields
        private Integer llmScore;
        private String  llmFeedback;
        private String  llmBreakdown;
        private String  llmSuggestion;
        private Integer wordCount;
        private String  transcript;

        // Question range
        private Integer questionNumberStart;
        private Integer questionNumberEnd;
    }
}
