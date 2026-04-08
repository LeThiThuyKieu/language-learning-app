package com.languagelearning.controller;

import com.languagelearning.dto.ApiResponse;
import com.languagelearning.dto.UpdateUserProfileRequest;
import com.languagelearning.dto.UserProfileResponse;
import com.languagelearning.service.AvatarUploadService;
import com.languagelearning.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserProfileService userProfileService;
    private final AvatarUploadService avatarUploadService;

    /*
     * API dùng cho màn hình Profile khi tải lần đầu.
     * Trả về thông tin hồ sơ của user hiện tại.
     */
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getMyProfile(Authentication authentication) {
        String email = authentication.getName();
        UserProfileResponse response = userProfileService.getCurrentProfile(email);
        return ResponseEntity.ok(ApiResponse.success("Get profile successfully", response));
    }

    /*
     * API dùng cho form Edit Profile.
     * Cập nhật thông tin hồ sơ của user hiện tại.
     */
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateMyProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateUserProfileRequest request
    ) {
        String email = authentication.getName();
        UserProfileResponse response = userProfileService.updateCurrentProfile(email, request);
        return ResponseEntity.ok(ApiResponse.success("Update profile successfully", response));
    }

    /**
     * Tiếp nhận yêu cầu upload ảnh đại diện từ phía người dùng.
     * Phương thức xử lý yêu cầu POST tới đường dẫn /profile/avatar.
     */
    @PostMapping("/profile/avatar")
    public ResponseEntity<ApiResponse<String>> uploadAvatar(
            Authentication authentication,
            @RequestParam("file") MultipartFile file
    ) {
        String email = authentication.getName();
        userProfileService.getCurrentProfile(email);

        String avatarUrl = avatarUploadService.uploadAvatar(file);
        return ResponseEntity.ok(ApiResponse.success("Upload avatar successfully", avatarUrl));
    }
}


