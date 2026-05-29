package com.languagelearning.dto.admin.badge_management;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BadgeStatsDto {
    private long totalBadges;
    private long totalAwards;
    private long uniqueEarners;
    private double averageRequiredKn;
    private Integer minRequiredKn;
    private Integer maxRequiredKn;
    private String topBadgeName;
    private long topBadgeRecipients;
    private List<BadgeStatItemDto> badgeUsage;
}