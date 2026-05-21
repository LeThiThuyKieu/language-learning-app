package com.languagelearning.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO trả về cho BXH top 10.
 * Dữ liệu này được lấy từ bảng Leaderboard, không join thêm bảng User nữa để tối ưu hiệu năng.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardEntryResponse {
    private Integer rankPosition;
    private Integer userId;
    private String displayName;
    private String avatarUrl;
    private Integer totalKn;
    private Integer totalXp;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;
}