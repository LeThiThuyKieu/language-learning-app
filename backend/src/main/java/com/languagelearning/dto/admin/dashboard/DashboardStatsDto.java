package com.languagelearning.dto.admin.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Thống kê tổng quan cho trang Dashboard Admin.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDto {
    // Row 1
    private long totalUsers;
    private long activeUsers;
    private long totalXp;
    private long completedNodes;

    // Row 2
    private long inProgressNodes;
    private long newUsersToday;
    private long completedPlacement;
    private long bannedUsers;

    // Số người dùng theo cấp độ: key = tên level (Beginner/Intermediate/Advanced), value = số lượng
    private Map<String, Long> usersByLevel;
}
