package com.languagelearning.dto.admin.general_revision;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class GeneralRevisionProgressDetailDto {
    // Summary fields
    private Integer userId;
    private String email;
    private String fullName;
    private String avatarUrl;
    private Integer completedTopics;
    private Integer totalTopics;
    private Integer totalAttempts;
    private String progressLabel;

    // Detail fields
    private List<TopicProgressDetailDto> topics;
}
