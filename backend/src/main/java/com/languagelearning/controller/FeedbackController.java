package com.languagelearning.controller;

import com.languagelearning.dto.feedback.FeedbackRequest;
import com.languagelearning.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    /**
     * POST /api/feedback
     * Gửi feedback cho một skill tree. Mỗi user chỉ được gửi 1 lần/tree.
     */
    @PostMapping
    public ResponseEntity<Map<String, String>> submitFeedback(
            @RequestBody FeedbackRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        feedbackService.submitFeedback(userDetails.getUsername(), request);
        return ResponseEntity.ok(Map.of("message", "Feedback submitted"));
    }

    /**
     * GET /api/feedback/check/{treeId}
     * Kiểm tra user đã feedback cho tree này chưa.
     * Response: { "done": true/false }
     */
    @GetMapping("/check/{treeId}")
    public ResponseEntity<Map<String, Boolean>> checkFeedback(
            @PathVariable Integer treeId,
            @AuthenticationPrincipal UserDetails userDetails) {
        boolean done = feedbackService.hasFeedback(userDetails.getUsername(), treeId);
        return ResponseEntity.ok(Map.of("done", done));
    }
}
