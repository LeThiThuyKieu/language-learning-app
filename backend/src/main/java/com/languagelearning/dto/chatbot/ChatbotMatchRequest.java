package com.languagelearning.dto.chatbot;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChatbotMatchRequest {

    @NotBlank(message = "Message không được để trống")
    private String message;

    /** null = không lọc theo category */
    private Integer categoryId;
}
