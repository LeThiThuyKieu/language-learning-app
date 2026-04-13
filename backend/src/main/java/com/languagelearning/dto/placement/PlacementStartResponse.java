package com.languagelearning.dto.placement;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Trả id phiên test sau POST /start. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlacementStartResponse {
    private Integer testId;
}
