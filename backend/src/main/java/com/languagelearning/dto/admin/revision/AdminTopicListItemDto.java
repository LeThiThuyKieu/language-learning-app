package com.languagelearning.dto.admin.revision;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminTopicListItemDto {
    private Integer id;
    private String title;
    private String description;
    private Integer orderIndex;
    private Boolean isActive;
    /** Số task trong topic */
    private Integer taskCount;
    /** Tổng số câu hỏi trong topic */
    private Long questionCount;
}
