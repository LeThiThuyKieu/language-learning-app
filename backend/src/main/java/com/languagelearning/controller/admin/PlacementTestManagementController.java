package com.languagelearning.controller.admin;

import com.languagelearning.dto.admin.placement_test_management.PlacementTestDto;
import com.languagelearning.dto.admin.placement_test_management.PlacementTestStatsDto;
import com.languagelearning.dto.admin.placement_test_management.PlacementTestAttemptDto;
import com.languagelearning.dto.ApiResponse;
import com.languagelearning.service.admin.PlacementTestManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/placement-tests")
@RequiredArgsConstructor
public class PlacementTestManagementController {

    private final PlacementTestManagementService placementTestManagementService;

    /**
     * Danh sách placement tests có phân trang.
     * GET /api/admin/placement-tests?page=0&size=10
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<PlacementTestDto>>> getTests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(ApiResponse.success("OK", placementTestManagementService.getTests(page, size)));
    }

    /**
     * Thống kê tổng quan placement tests.
     * GET /api/admin/placement-tests/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<PlacementTestStatsDto>> getStats() {
        return ResponseEntity.ok(ApiResponse.success("OK", placementTestManagementService.getStats()));
    }

    /**
     * Lấy chi tiết một placement test.
     * GET /api/admin/placement-tests/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PlacementTestDto>> getTestDetail(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success("OK", placementTestManagementService.getTestDetail(id)));
    }

    /**
     * Xóa một placement test.
     * DELETE /api/admin/placement-tests/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTest(@PathVariable Integer id) {
        placementTestManagementService.deleteTest(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa placement test thành công", null));
    }

    /**
     * Lịch sử tất cả các lần làm bài của một user.
     * GET /api/admin/placement-tests/user/{userId}/history
     */
    @GetMapping("/user/{userId}/history")
    public ResponseEntity<ApiResponse<java.util.List<PlacementTestAttemptDto>>> getUserHistory(
            @PathVariable Integer userId
    ) {
        return ResponseEntity.ok(ApiResponse.success("OK",
                placementTestManagementService.getUserHistory(userId)));
    }
}
