package com.languagelearning.dto.placement;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Từng câu nhỏ trong 1 bài speaking của 1 level bất kì (cùng questionId, khác lineIndex). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlacementSpeakingLineDto {
    private Long questionId;
    private String mongoQuestionId;
    private Integer lineIndex; // Số dùng
    private String line; //Nội dung của dòng đó
}
