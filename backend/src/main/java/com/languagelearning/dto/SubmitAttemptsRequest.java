package com.languagelearning.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request gửi lên khi user hoàn thành một node.
 * Chứa danh sách kết quả từng câu hỏi + nodeId để complete node.
 */
@Data
@NoArgsConstructor
public class SubmitAttemptsRequest {

    /** ID của node vừa hoàn thành */
    private Integer nodeId;

    /** Danh sách kết quả từng câu hỏi */
    private List<AttemptItem> attempts;

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
