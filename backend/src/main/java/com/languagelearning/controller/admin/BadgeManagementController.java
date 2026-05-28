package com.languagelearning.controller.admin;

import com.languagelearning.dto.ApiResponse;
import com.languagelearning.dto.admin.badge_management.BadgeDto;
import com.languagelearning.dto.admin.badge_management.BadgeStatsDto;
import com.languagelearning.service.admin.BadgeManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<BadgeDto>> createBadge(
            @RequestParam String badgeName,
            @RequestParam(required = false) String description,
            @RequestParam Integer requiredKn,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.success("OK", badgeManagementService.createBadge(badgeName, description, requiredKn, file)));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<BadgeDto>> updateBadge(
            @PathVariable Integer id,
            @RequestParam String badgeName,
            @RequestParam(required = false) String description,
            @RequestParam Integer requiredKn,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.success("OK", badgeManagementService.updateBadge(id, badgeName, description, requiredKn, file)));
    }
}