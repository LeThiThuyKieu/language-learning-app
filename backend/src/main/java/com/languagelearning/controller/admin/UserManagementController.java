package com.languagelearning.controller.admin;

import com.languagelearning.dto.admin.UserDto;
import com.languagelearning.dto.admin.UserStatsDto;
import com.languagelearning.dto.ApiResponse;
import com.languagelearning.service.admin.UserManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/user_management")
@RequiredArgsConstructor
public class UserManagementController {

    private final UserManagementService userManagementService;

    /** Danh sách người dùng có phân trang */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<UserDto>>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(ApiResponse.success("OK", userManagementService.getUsers(page, size)));
    }

    /** Thống kê tổng quan */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<UserStatsDto>> getStats() {
        return ResponseEntity.ok(ApiResponse.success("OK", userManagementService.getStats()));
    }

    /** Cấm người dùng */
    @PutMapping("/{id}/ban")
    public ResponseEntity<ApiResponse<UserDto>> banUser(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success("Đã cấm người dùng", userManagementService.banUser(id)));
    }

    /** Bỏ cấm người dùng */
    @PutMapping("/{id}/unban")
    public ResponseEntity<ApiResponse<UserDto>> unbanUser(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success("Đã bỏ cấm người dùng", userManagementService.unbanUser(id)));
    }
}
