package com.languagelearning.dto.admin.learn_progress;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserLearnSummaryDto {
    private Integer userId;
    private String email;
    private String fullName;
    private String avatarUrl;
    private Integer currentLevelId;
    private String currentLevelName;
    private Integer completedTrees;
    private Integer totalTrees;
    private String currentProgressLabel;
}
