package com.languagelearning.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Dùng cho social user (Google/Facebook) muốn tạo mật khẩu lần đầu.
 * Không cần currentPassword vì account chưa có password.
 */
@Data
public class SetPasswordRequest {

    @NotBlank(message = "New password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String newPassword;

    @NotBlank(message = "Confirm password is required")
    private String confirmNewPassword;
}
