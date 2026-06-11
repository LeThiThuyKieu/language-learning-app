package com.languagelearning.dto.admin.general_revision;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TaskAttemptSummaryDto {
    private Integer taskId;
    private String taskLabel;
    private String questionType;
    private Long attemptCount;
    private Integer bestScore;
    private Integer lastScore;
    private LocalDateTime lastAttemptAt;
}
