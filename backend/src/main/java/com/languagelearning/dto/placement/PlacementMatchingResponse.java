package com.languagelearning.dto.placement;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** 5 cặp: hai cột đã shuffle, client ghép theo cardId. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlacementMatchingResponse {
    private int level;
    private List<PlacementMatchingCardDto> leftColumn;
    private List<PlacementMatchingCardDto> rightColumn;
}
