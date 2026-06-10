package com.languagelearning.dto.general_revision;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response trả về sau khi submit task ôn tập.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubmitRevisionTaskResponse {
    private int knEarned;
    private int totalKn;
    private int streakCount;
    private int score;
}
