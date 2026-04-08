package com.languagelearning.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserProfileRequest {

    @Size(max = 100, message = "Full name must be at most 100 characters")
    private String fullName;

    @Size(max = 255, message = "Avatar URL must be at most 255 characters")

    private String avatarUrl;

    @Size(max = 255, message = "Target goal must be at most 255 characters")
    private String targetGoal;

    @jakarta.validation.constraints.Positive(message = "Level ID must be positive")
    private Integer currentLevelId;
}