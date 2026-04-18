package com.languagelearning.controller;

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
    public ResponseEntity<Map<String, Integer>> completeNode(
            @PathVariable int nodeId,
            @AuthenticationPrincipal UserDetails userDetails) {
        int unlockedCount = progressService.completeNode(userDetails.getUsername(), nodeId);
        return ResponseEntity.ok(Map.of("unlockedCount", unlockedCount));
    }
}
