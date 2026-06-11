package com.languagelearning.dto.admin.revision;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AdminTopicDetailDto {
    private Integer id;
    private String title;
    private String description;
    private Integer orderIndex;
    private Boolean isActive;
    private Long totalQuestions;
    private List<AdminTaskDetailDto> tasks;
}
