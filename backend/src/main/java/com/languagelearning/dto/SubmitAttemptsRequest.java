package com.languagelearning.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request gửi lên khi user hoàn thành một node.
 * Chứa danh sách kết quả từng câu hỏi + nodeId để complete node.
 * Với node REVIEW, còn có thêm thông tin thời gian và outcome.
 */
@Data
@NoArgsConstructor
public class SubmitAttemptsRequest {

    /** ID của node vừa hoàn thành */
    private Integer nodeId;

    /** Danh sách kết quả từng câu hỏi */
    private List<AttemptItem> attempts;

    // ──Thông tin bổ sung cho node REVIEW ──

    /** Thời gian làm bài (giây), null nếu không phải REVIEW */
    private Integer elapsedSeconds;

    /** true nếu hết giờ */
    private Boolean timedOut;

    /** Outcome: FAST_TRACKER | STEADY | SLOW_PASS | FAIL | CARELESS */
    private String outcome;

    @Data
    @NoArgsConstructor
    public static class AttemptItem {
        /** mongo_question_id của câu hỏi */
        private String mongoQuestionId;
        /** Câu trả lời của user (text) */
        private String userAnswer;
        /** Đúng hay sai */
        private boolean correct;
    }
}
