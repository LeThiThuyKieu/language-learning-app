package com.languagelearning.dto.admin.revision;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminTaskDetailDto {
    private Integer id;
    private Integer taskIndex;
    private String taskLabel;
    private String questionType;
    private String description;
    /** Số câu hỏi của task này */
    private Long questionCount;
}
