package com.languagelearning.dto.exam;

import lombok.Data;
import java.util.List;

/**
 * Request payload gửi lên để chấm Speaking bằng LLM.
 * User ghi âm xuyên suốt 1 Part, transcript của toàn bộ Part được gửi lên.
 */
@Data
public class SpeakingGradeRequest {

    /** mongoDocId của SPEAKING_TASK question */
    private String mongoDocId;

    /** Part number (1, 2, 3...) */
    private Integer partNumber;

    /** Part title để LLM có context */
    private String partContext;

    /** Thời lượng part (phút) */
    private Integer partDurationMinutes;

    /**
     * Transcript toàn bộ part — user nói liên tục, STT chuyển thành text.
     */
    private String transcript;

    /**
     * Danh sách tất cả câu hỏi trong Part này (từ tất cả phases).
     * LLM dùng để đánh giá user có trả lời đủ câu không.
     * Mỗi item: "Phase X: <questionText>"
     */
    private List<String> allQuestionsText;

    /**
     * Tổng số câu hỏi trong part (để LLM đánh giá coverage).
     */
    private Integer totalQuestions;
}
