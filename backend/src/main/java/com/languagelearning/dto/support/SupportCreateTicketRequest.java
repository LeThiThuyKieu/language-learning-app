package com.languagelearning.dto.support;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SupportCreateTicketRequest {
    private @NotNull Integer categoryId;
    private @NotBlank String message;

    // "CHAT" hoặc "EMAIL" — mặc định EMAIL nếu không truyền
    private String source;

    // Bot response từ chatbot rule-based (optional) — nếu có sẽ lưu vào DB như message BOT
    private String botResponse;

    // Fields for guest users (optional, only used when not authenticated)
    private String guestName;

    @Email(message = "Email không hợp lệ")
    private String guestEmail;
}
