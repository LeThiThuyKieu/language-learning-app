package com.languagelearning.dto.chatbot;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Kết quả match keyword:
 * - matched=true, fallback=false → rule matched, botResponse là câu trả lời từ rule
 * - matched=true, fallback=true  → không match rule nào, botResponse là fallback mặc định
 * - matched=false                → (không dùng nữa, giữ lại để tương thích)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotMatchResponse {
    private boolean matched;
    private String botResponse;
    private Integer ruleId;
    private boolean fallback;
}
