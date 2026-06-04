package com.languagelearning.dto.general_revision;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RevisionTaskDto {
    private Integer taskId;
    private Integer taskIndex;
    private String taskLabel;
    private String questionType;
    private String description;
    /** Số lần user đã làm task này (0 = chưa làm) */
    private Integer attemptCount = 0;
    /** true nếu user đã pass task này */
    private Boolean completed = false;
}
