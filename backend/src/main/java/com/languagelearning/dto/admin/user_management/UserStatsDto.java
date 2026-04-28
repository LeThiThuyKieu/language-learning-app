package com.languagelearning.dto.admin.user_management;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatsDto {
    private long totalUsers;
    private long activeUsers;
    private long bannedUsers;
    private long newUsersToday;
}
