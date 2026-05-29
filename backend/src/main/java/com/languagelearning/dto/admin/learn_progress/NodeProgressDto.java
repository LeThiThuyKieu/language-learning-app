package com.languagelearning.dto.admin.learn_progress;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NodeProgressDto {
    private Integer nodeId;
    private String title;
    private String nodeType;
    private Integer orderIndex;
    private String status;       // not_started | in_progress | completed
    private Integer earnedXp;
    private Integer maxXp;
    private Integer attemptCount;
}
