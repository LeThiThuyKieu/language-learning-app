package com.languagelearning.dto.chatbot;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Kết quả match keyword:
 * - matched=true  → botResponse chứa câu trả lời tự động
 * - matched=false → không tìm thấy rule, chuyển sang admin
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotMatchResponse {
    private boolean matched;
    private String botResponse;
    private Integer ruleId;
}
