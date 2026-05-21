package com.languagelearning.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response gửi WebSocket khi rank thay đổi.
 *
 * Frontend nhận message này để update UI realtime.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RankUpdateResponse {
    private Integer userId;
    private Integer oldRank;
    private Integer newRank;
    private Integer totalKn;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;
}
