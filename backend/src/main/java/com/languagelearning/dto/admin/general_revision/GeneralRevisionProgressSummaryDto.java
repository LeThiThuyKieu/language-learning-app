package com.languagelearning.dto.admin.general_revision;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GeneralRevisionProgressSummaryDto {
    private Integer userId;
    private String email;
    private String fullName;
    private String avatarUrl;
    private Integer completedTopics;
    private Integer totalTopics;
    private Integer totalAttempts;
    private String progressLabel;
}
