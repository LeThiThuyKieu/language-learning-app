package com.languagelearning.dto.admin.exam_management;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ExamTestUpdateRequest {

    @NotBlank(message = "CEFR level không được để trống")
    private String cefrLevel;

    @NotNull(message = "Test number không được để trống")
    private Integer testNumber;

    @NotBlank(message = "Title không được để trống")
    private String title;

    private String description;

    /** null → giữ nguyên trạng thái hiện tại */
    private Boolean isActive;
}
