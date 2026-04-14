package com.languagelearning.dto.placement;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Một bài nghe + URL audio + số ô trống (không gửi đáp án). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlacementListeningResponse {
    private int level;
    private Long questionId;
    private String mongoQuestionId;
    private String audioUrl;
    private String textWithBlanks;
    private int blankCount;
}
