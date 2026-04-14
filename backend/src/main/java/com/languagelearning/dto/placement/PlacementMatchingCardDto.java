package com.languagelearning.dto.placement;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Một thẻ cột trái hoặc phải (đã xáo). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlacementMatchingCardDto {
    private String cardId;
    private String text;
}
