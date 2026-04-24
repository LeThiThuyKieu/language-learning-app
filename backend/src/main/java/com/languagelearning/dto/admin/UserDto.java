package com.languagelearning.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Integer id;
    private String email;
    private String authProvider;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;

    // From UserProfile
    private String fullName;
    private String avatarUrl;
    private Integer totalXp;
    private Integer streakCount;
    private Integer currentLevel;

    // Role
    private String role;
}
