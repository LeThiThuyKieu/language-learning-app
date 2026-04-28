package com.languagelearning.dto.admin.placement_test_management;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlacementTestStatsDto {
    private long totalTests;
    private long completedTests;
    private long inProgressTests;
    private double averageScore;
}
