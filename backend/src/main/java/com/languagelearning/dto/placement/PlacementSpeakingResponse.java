package com.languagelearning.dto.placement;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** Danh sách câu đọc theo level. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlacementSpeakingResponse {
    private int level;
    private List<PlacementSpeakingLineDto> lines;
}
