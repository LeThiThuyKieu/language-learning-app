package com.languagelearning.dto.chatbot;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/** Request body để tạo / cập nhật rule */
@Data
public class ChatbotRuleRequest {

    @NotBlank(message = "Rule name không được để trống")
    private String ruleName;

    @NotBlank(message = "Keywords không được để trống")
    private String keywords;

    @NotBlank(message = "Bot response không được để trống")
    private String botResponse;

    /** null = áp dụng cho mọi category */
    private Integer categoryId;

    @NotNull(message = "Priority không được để trống")
    private Integer priority;

    @NotNull(message = "isActive không được để trống")
    private Boolean isActive;
}
