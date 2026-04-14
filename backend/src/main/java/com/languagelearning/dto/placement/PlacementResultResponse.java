package com.languagelearning.dto.placement;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/** Kết quả cuối + xếp Level theo thang 160. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlacementResultResponse {
    private Integer testId;
    /** TB cộng bốn điểm kỹ năng (0–160) */
    private Double totalScore;
    private String band;
    private String bandLabelVi;
    private Integer detectedLevelId;
    private String detectedLevelName;
    /** Điểm đóng góp từng kỹ năng trên thang 0–40 (= điểm 160 làm tròn ÷ 4). */
    private Map<String, Double> skillScores;
}
