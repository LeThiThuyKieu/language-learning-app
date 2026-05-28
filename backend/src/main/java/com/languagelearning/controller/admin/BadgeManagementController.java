package com.languagelearning.controller.admin;

import com.languagelearning.dto.ApiResponse;
import com.languagelearning.dto.admin.badge_management.BadgeDto;
import com.languagelearning.dto.admin.badge_management.BadgeStatsDto;
import com.languagelearning.service.admin.BadgeManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/badges")
@RequiredArgsConstructor
public class BadgeManagementController {

    private final BadgeManagementService badgeManagementService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<BadgeDto>>> getBadges(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(ApiResponse.success("OK", badgeManagementService.getBadges(page, size, keyword)));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<BadgeStatsDto>> getStats() {
        return ResponseEntity.ok(ApiResponse.success("OK", badgeManagementService.getStats()));
    }
}