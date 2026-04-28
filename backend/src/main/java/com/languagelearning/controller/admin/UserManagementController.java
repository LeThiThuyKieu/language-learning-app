package com.languagelearning.controller.admin;

import com.languagelearning.dto.admin.user_management.UserDto;
import com.languagelearning.dto.admin.user_management.UserStatsDto;
import com.languagelearning.dto.admin.user_management.UserActivityLogDto;
import com.languagelearning.dto.ApiResponse;
import com.languagelearning.service.admin.UserManagementService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/user_management")
@RequiredArgsConstructor
public class UserManagementController {

    private final UserManagementService userManagementService;

    /** Danh sách người dùng có phân trang */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<UserDto>>> getUsers(@RequestParam(defaultValue = "0") int page,@RequestParam(defaultValue = "10") int size) {
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

    /** Tạo người dùng mới từ Admin */
    @PostMapping
    public ResponseEntity<ApiResponse<UserDto>> createUser(@RequestBody CreateUserRequest req) {
        UserDto created = userManagementService.createUser(
                req.getEmail(), req.getPassword(),
                req.getRole(), req.getStatus(), req.getAuthProvider()
        );
        return ResponseEntity.ok(ApiResponse.success("Tạo người dùng thành công", created));
    }

    /** Cập nhật thông tin người dùng */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDto>> updateUser(@PathVariable Integer id,  @RequestBody UpdateUserRequest req) {
        UserDto updated = userManagementService.updateUser(id, req.getFullName(), req.getRole(), req.getStatus());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", updated));
    }

    /** Lịch sử hoạt động của user */
    @GetMapping("/{id}/activity")
    public ResponseEntity<ApiResponse<List<UserActivityLogDto>>> getActivity(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success("OK", userManagementService.getActivityLog(id)));
    }

    @Data
    static class CreateUserRequest {
        private String email;
        private String password;
        private String role;
        private String status;
        private String authProvider;
    }

    @Data
    static class UpdateUserRequest {
        private String fullName;
        private String role;
        private String status;
    }
}
