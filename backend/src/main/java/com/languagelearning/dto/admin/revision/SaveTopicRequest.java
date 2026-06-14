package com.languagelearning.dto.admin.revision;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body tạo mới / cập nhật Topic.
 */
@Data
public class SaveTopicRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    private Integer orderIndex;

    private Boolean isActive = true;
}
