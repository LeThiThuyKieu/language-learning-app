package com.languagelearning.controller;

import com.languagelearning.dto.ApiResponse;
import com.languagelearning.dto.LeaderboardEntryResponse;
import com.languagelearning.service.leaderboard.LeaderboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
public class LeaderboardController {
    private final LeaderboardService leaderboardService;

    // Controller cung cấp REST API cho bảng xếp hạng (top N).
    // Frontend gọi GET /api/leaderboard/top để lấy snapshot top 10.

    /**
     * API lấy top 10 BXH theo total_kn.
     */
    @GetMapping("/top")
    public ResponseEntity<ApiResponse<List<LeaderboardEntryResponse>>> getTopLeaderboard(
            @RequestParam(defaultValue = "10") int limit
    ) {
        List<LeaderboardEntryResponse> entries = leaderboardService.getTopLeaderboard(limit);
        return ResponseEntity.ok(ApiResponse.success("Get leaderboard successfully", entries));
    }
}