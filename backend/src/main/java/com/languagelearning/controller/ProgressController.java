package com.languagelearning.controller;

import com.languagelearning.dto.SubmitAttemptsRequest;
import com.languagelearning.service.ProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;

    /** Lấy số node đã unlock */
    @GetMapping("/trees/{treeId}/unlocked")
    public ResponseEntity<Map<String, Integer>> getUnlocked(
            @PathVariable int treeId,
            @AuthenticationPrincipal UserDetails userDetails) {
        int count = progressService.getUnlockedCount(userDetails.getUsername(), treeId);
        return ResponseEntity.ok(Map.of("unlockedCount", count));
    }

    /** Đánh dấu node hoàn thành */
    @PostMapping("/nodes/{nodeId}/complete")
    public ResponseEntity<Map<String, Object>> completeNode(
            @PathVariable int nodeId,
            @RequestParam(defaultValue = "0") int correctCount,
            @AuthenticationPrincipal UserDetails userDetails) {
        ProgressService.CompleteNodeResult result = progressService.completeNode(userDetails.getUsername(), nodeId, correctCount);
        return ResponseEntity.ok(Map.of(
                "unlockedCount", result.unlockedCount(),
                "knEarned", result.knEarned(),
                "newBadges", result.newBadgeNames()
        ));
    }

    /**
     * Ghi lại kết quả từng câu hỏi + hoàn thành node.
     * POST /api/progress/nodes/submit
     */
    @PostMapping("/nodes/submit")
    public ResponseEntity<Map<String, Object>> submitAttempts(
            @RequestBody SubmitAttemptsRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ProgressService.CompleteNodeResult result = progressService.submitAttempts(userDetails.getUsername(), request);
        return ResponseEntity.ok(Map.of(
                "unlockedCount", result.unlockedCount(),
                "knEarned", result.knEarned(),
                "newBadges", result.newBadgeNames()
        ));
    }
}
