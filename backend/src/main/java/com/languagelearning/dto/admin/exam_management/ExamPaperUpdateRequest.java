package com.languagelearning.dto.admin.exam_management;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ExamPaperUpdateRequest {

    @NotNull(message = "Duration không được để trống")
    private Integer durationMinutes;

    /** Có thể null (R&W, Speaking) */
    private String audioUrl;
}
