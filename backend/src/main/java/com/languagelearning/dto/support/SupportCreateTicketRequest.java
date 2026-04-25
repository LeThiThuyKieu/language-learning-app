package com.languagelearning.dto.support;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SupportCreateTicketRequest {
    private @NotNull Integer categoryId;
    private @NotBlank String message;
}
