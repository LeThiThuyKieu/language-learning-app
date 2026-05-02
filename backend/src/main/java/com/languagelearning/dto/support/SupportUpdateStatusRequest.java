package com.languagelearning.dto.support;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SupportUpdateStatusRequest {
    private @NotBlank String status;
}
