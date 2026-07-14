package com.languagelearning.dto.exam;

import lombok.Data;

import java.util.List;

/**
 * Request payload gửi lên để chấm bài Writing (SHORT_WRITE) bằng LLM.
 */
@Data
public class WritingGradeRequest {

    /** mongoDocId của câu hỏi SHORT_WRITE */
    private String mongoDocId;

    /** writeType: "EMAIL" | "STORY" */
    private String writeType;

    /** Prompt đề bài (e.g. "Write an email to your friend...") */
    private String promptText;

    /** Các gợi ý bullet points trong đề bài */
    private List<String> bulletPoints;

    /** Số từ tối thiểu yêu cầu */
    private Integer minWords;

    /** Số từ tối đa (nullable) */
    private Integer maxWords;

    /** Bài làm của user */
    private String userAnswer;

    /** Đáp án mẫu từ DB (correct_answer). Nullable — dùng để tham khảo nếu có. */
    private String correctAnswer;
}
