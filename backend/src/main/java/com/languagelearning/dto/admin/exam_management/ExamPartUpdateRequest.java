package com.languagelearning.dto.admin.exam_management;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ExamPartUpdateRequest {

    @NotNull(message = "partNumber là bắt buộc")
    @Min(value = 1, message = "partNumber phải >= 1")
    private Integer partNumber;

    private Integer orderIndex = 0;
}
