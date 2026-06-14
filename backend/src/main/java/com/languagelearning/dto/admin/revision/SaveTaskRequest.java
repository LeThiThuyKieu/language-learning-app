package com.languagelearning.dto.admin.revision;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body tạo mới / cập nhật Task.
 */
@Data
public class SaveTaskRequest {

    @NotBlank(message = "taskLabel is required")
    private String taskLabel;

    @NotBlank(message = "questionType is required")
    private String questionType;  // VOCAB_IMAGE | LISTENING | MATCHING | WRITING

    private String description;

    private Integer taskIndex;
}
