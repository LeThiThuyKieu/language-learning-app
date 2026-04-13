package com.languagelearning.dto.placement;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Chấm theo level: continue = được lên level tiếp; finished = dừng adaptive (<50%). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlacementSubmitResponse {
    private Integer testId;
    private String status;
    private Double levelAverageRatio;
    private String message;
}
