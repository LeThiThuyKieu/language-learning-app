package com.languagelearning.controller;

import com.languagelearning.dto.ApiResponse;
import com.languagelearning.dto.UpdateUserProfileRequest;
import com.languagelearning.dto.UserProfileResponse;
import com.languagelearning.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserProfileService userProfileService;

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
}


