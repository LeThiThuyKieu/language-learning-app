package com.languagelearning.dto.admin.learn_progress;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class UserLearnProgressDto {
    private Integer userId;
    private String email;
    private String fullName;
    private String avatarUrl;
    private Integer currentLevelId;
    private String currentLevelName;
    private Integer completedTrees;
    private Integer totalTrees;
    private Integer completedNodes;
    private Integer totalNodes;
    private String currentProgressLabel;   // "Phần X - Node Y/5"
    private List<TreeProgressDto> trees;
}
