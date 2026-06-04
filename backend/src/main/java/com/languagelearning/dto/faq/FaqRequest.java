package com.languagelearning.dto.faq;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FaqRequest {

    @NotBlank(message = "Câu hỏi không được để trống")
    private String question;

    @NotBlank(message = "Câu trả lời không được để trống")
    private String answer;

    @NotNull(message = "Thứ tự hiển thị không được để trống")
    private Integer displayOrder;

    /** "ACTIVE" hoặc "INACTIVE" */
    private String status = "ACTIVE";
}
