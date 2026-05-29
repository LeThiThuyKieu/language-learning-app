package com.languagelearning.controller.admin;

import com.languagelearning.dto.ApiResponse;
import com.languagelearning.dto.admin.feedback.AdminFeedbackDto;
import com.languagelearning.entity.Feedback;
import com.languagelearning.repository.mysql.FeedbackRepository;
import com.languagelearning.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/feedback")
@RequiredArgsConstructor
public class AdminFeedbackController {

    private final FeedbackService feedbackService;
    private final FeedbackRepository feedbackRepository;

    /**
     * GET /api/admin/feedback
     * Trả về danh sách feedbacks cho Admin UI.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> listAll(
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size,
            @RequestParam(name = "treeId", required = false) Integer treeId,
            @RequestParam(name = "userEmail", required = false) String userEmail,
            @RequestParam(name = "minRating", required = false) Integer minRating,
            @RequestParam(name = "maxRating", required = false) Integer maxRating,
            @RequestParam(name = "from", required = false) String from,
            @RequestParam(name = "to", required = false) String to
    ) {
        LocalDateTime fromDt = null;
        LocalDateTime toDt = null;
        try {
            if (from != null && !from.isBlank()) fromDt = LocalDateTime.parse(from);
            if (to != null && !to.isBlank()) toDt = LocalDateTime.parse(to);
        } catch (Exception ex) {
            // ignore parse errors and treat as null
        }

        var pageResult = feedbackService.searchFeedbacks(treeId, userEmail, minRating, maxRating, fromDt, toDt, PageRequest.of(Math.max(0, page), Math.max(1, size)));
        List<AdminFeedbackDto> items = pageResult.getContent();

        Map<String, Object> data = Map.of(
                "items", items,
                "page", pageResult.getNumber(),
                "size", pageResult.getSize(),
                "totalElements", pageResult.getTotalElements(),
                "totalPages", pageResult.getTotalPages()
        );

        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /**
     * GET /api/admin/feedback/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> stats() {
        long totalFeedback = feedbackRepository.count();
        long totalUsers = feedbackRepository.findAll().stream().map(f -> f.getUser() != null ? f.getUser().getId() : null).distinct().count();
        long totalTrees = feedbackRepository.findAll().stream().map(f -> f.getSkillTree() != null ? f.getSkillTree().getId() : null).distinct().count();
        Map<String, Object> data = Map.of(
                "totalFeedback", totalFeedback,
                "totalUsers", totalUsers,
                "totalTrees", totalTrees
        );
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> delete(@PathVariable Integer id) {
        feedbackService.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Deleted", "ok"));
    }
}
