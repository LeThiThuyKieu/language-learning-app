package com.languagelearning.dto.admin.placement_test_management;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Một lần làm bài placement test của user (dùng trong lịch sử).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlacementTestAttemptDto {
    private Integer id;
    private String status;
    private Double totalScore;
    private String detectedLevelName;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
}
