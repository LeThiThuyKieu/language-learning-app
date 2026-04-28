package com.languagelearning.controller.admin;

import com.languagelearning.dto.admin.dashboard.DashboardStatsDto;
import com.languagelearning.dto.ApiResponse;
import com.languagelearning.service.admin.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    /** Thống kê tổng quan cho trang Dashboard Admin */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<DashboardStatsDto>> getStats() {
        return ResponseEntity.ok(ApiResponse.success("OK", dashboardService.getStats()));
    }
}
