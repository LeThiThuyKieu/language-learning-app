package com.languagelearning.dto.support;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SupportReplyRequest {
    private @NotBlank String message;
    private String status;
}
