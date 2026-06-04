package com.languagelearning.dto.general_revision;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RevisionTopicDto {
    private Integer topicId;
    private String title;
    private String description;
    private Integer orderIndex;
    private List<RevisionTaskDto> tasks;
    /** Số task đã completed (0 → tasks.size()) */
    private Integer completedTasks = 0;
}
