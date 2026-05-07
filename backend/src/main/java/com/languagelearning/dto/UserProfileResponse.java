package com.languagelearning.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {

    private Integer userId;
    private String email;
    private String fullName;
    private String avatarUrl;
    private String targetGoal;

    private Integer currentLevelId;
    private String currentLevelName;
    private String currentLevelCefr;

    private Integer totalXp;
    private Integer streakCount;
    private Integer rankPosition;
    private Integer totalKn;

    private Integer completedNodes;
    private Integer totalNodes;
    private Integer completionRate; // %

    private Integer totalAttempts;
    private List<Integer> weeklyActivityXp;
    private Integer todayXp;

    @JsonFormat(pattern = "dd-MM-yyyy")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "dd-MM-yyyy HH:mm:ss", timezone = "Asia/Ho_Chi_Minh")
    private LocalDateTime lastLogin;

    private List<BadgeItem> badges;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BadgeItem {

        private Integer id;
        private String badgeName;
        private String description;
        private Integer requiredXp;
        private String iconUrl;

        @JsonFormat(pattern = "dd-MM-yyyy HH:mm:ss", timezone = "Asia/Ho_Chi_Minh")
        private LocalDateTime earnedAt;
    }
}