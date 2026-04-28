package com.languagelearning.dto.support;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SupportCreateTicketRequest {
    private @NotNull Integer categoryId;
    private @NotBlank String message;
    
    // Fields for guest users (optional, only used when not authenticated)
    private String guestName;
    
    @Email(message = "Email không hợp lệ")
    private String guestEmail;
}
