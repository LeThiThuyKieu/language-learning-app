package com.languagelearning.controller.admin;

import com.languagelearning.dto.ApiResponse;
import com.languagelearning.dto.admin.exam_progress.ExamProgressDetailDto;
import com.languagelearning.dto.admin.exam_progress.ExamProgressStatsDto;
import com.languagelearning.dto.admin.exam_progress.ExamProgressSummaryDto;
import com.languagelearning.service.admin.ExamProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/exam-progress")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ExamProgressController {

    private final ExamProgressService examProgressService;

    /** 4 stat cards toàn hệ thống */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<ExamProgressStatsDto>> getGlobalStats() {
        return ResponseEntity.ok(ApiResponse.success("OK",
                examProgressService.getGlobalStats()));
    }

    /** Danh sách tóm tắt tiến trình thi của tất cả user (phân trang) */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ExamProgressSummaryDto>>> getSummaryList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search
    ) {
        return ResponseEntity.ok(ApiResponse.success("OK",
                examProgressService.getSummaryList(page, size, search)));
    }

    /** Chi tiết tất cả lần thi của 1 user */
    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<ExamProgressDetailDto>> getDetail(
            @PathVariable Integer userId
    ) {
        return ResponseEntity.ok(ApiResponse.success("OK",
                examProgressService.getDetail(userId)));
    }
}
