package com.languagelearning.dto.placement;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Một “câu nhỏ” trong bài speaking (cùng questionId, khác lineIndex). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlacementSpeakingLineDto {
    private Long questionId;
    private String mongoQuestionId;
    /** 0-based, khớp field lineIndex trong body nộp bài. */
    private Integer lineIndex;
    private String line;
}
