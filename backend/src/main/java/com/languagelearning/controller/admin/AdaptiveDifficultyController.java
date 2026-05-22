package com.languagelearning.controller.admin;

import com.languagelearning.service.adaptive_learn.AdaptiveDifficultyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Admin endpoint để trigger adaptive difficulty update thủ công.
 * Dùng cho demo / test mà không cần chờ scheduler 02:00 AM.
 */
@RestController
@RequestMapping("/api/admin/adaptive")
@RequiredArgsConstructor
public class AdaptiveDifficultyController {

    private final AdaptiveDifficultyService adaptiveDifficultyService;

    /**
     * POST /api/admin/adaptive/trigger
     * Trigger cập nhật difficulty cho tất cả tree ngay lập tức.
     */
    @PostMapping("/trigger")
    public ResponseEntity<Map<String, String>> triggerUpdate() {
        adaptiveDifficultyService.updateAllTreeDifficulties();
        return ResponseEntity.ok(Map.of("message", "Adaptive difficulty update triggered successfully"));
    }
}
