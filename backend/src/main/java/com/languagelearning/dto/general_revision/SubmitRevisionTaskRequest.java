package com.languagelearning.dto.general_revision;

import lombok.Data;

/**
 * Request body gửi lên khi user hoàn thành 1 task ôn tập.
 */
@Data
public class SubmitRevisionTaskRequest {
    private Integer topicId;
    private Integer taskId;
    private Integer correctCount;
    private Integer totalCount;
}
