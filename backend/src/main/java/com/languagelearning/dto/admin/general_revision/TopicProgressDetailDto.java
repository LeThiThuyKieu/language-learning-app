package com.languagelearning.dto.admin.general_revision;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class TopicProgressDetailDto {
    private Integer topicId;
    private String title;
    private String description;
    private Integer completedTasks;
    private String status;
    private LocalDateTime updatedAt;
    private List<TaskAttemptSummaryDto> tasks;
}
