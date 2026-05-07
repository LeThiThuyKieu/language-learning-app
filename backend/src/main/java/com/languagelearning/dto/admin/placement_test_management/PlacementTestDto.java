package com.languagelearning.dto.admin.placement_test_management;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlacementTestDto {
    private Integer id;
    private Integer userId;
    private String userName;
    private String userEmail;
    private String userAvatar;
    private String status;
    private Double totalScore;
    private String detectedLevelName;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    /** Tổng số lần user đã làm placement test (cả hoàn thành lẫn chưa hoàn thành- chưa hoàn thành tức đang làm giữa chừng mà thoát ra ko làm nữa) */
    private long totalAttempts;
}
