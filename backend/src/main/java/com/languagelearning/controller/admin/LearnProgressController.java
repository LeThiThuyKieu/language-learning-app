package com.languagelearning.controller.admin;

import com.languagelearning.dto.ApiResponse;
import com.languagelearning.dto.admin.learn_progress.UserLearnProgressDto;
import com.languagelearning.dto.admin.learn_progress.UserLearnSummaryDto;
import com.languagelearning.service.admin.LearnProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/learn-progress")
@RequiredArgsConstructor
public class LearnProgressController {

    private final LearnProgressService learnProgressService;

    /** Danh sách tóm tắt tiến trình học của tất cả user */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<UserLearnSummaryDto>>> getSummaryList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search
    ) {
        return ResponseEntity.ok(ApiResponse.success("OK",
                learnProgressService.getSummaryList(page, size, search)));
    }

    /** Chi tiết tiến trình học của một user */
    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserLearnProgressDto>> getDetail(
            @PathVariable Integer userId
    ) {
        return ResponseEntity.ok(ApiResponse.success("OK",
                learnProgressService.getDetail(userId)));
    }
}
