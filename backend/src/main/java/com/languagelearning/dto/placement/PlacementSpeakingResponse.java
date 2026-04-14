package com.languagelearning.dto.placement;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** 1 đoạn speaking theo level . */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlacementSpeakingResponse {
    private int level;
    private String audioUrl;
    private List<PlacementSpeakingLineDto> lines;
}
