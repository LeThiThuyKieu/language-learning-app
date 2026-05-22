package com.languagelearning.controller;

import com.languagelearning.dto.*;
import com.languagelearning.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            String email = authentication.getName();
            authService.logout(email);
        }
        return ResponseEntity.ok(ApiResponse.success("Logout successful", null));
    }
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        String email = authentication.getName();
        authService.changePassword(email, request);
        return ResponseEntity.ok(ApiResponse.success("Change password successfully", null));
    }

    // Tạo mật khẩu lần đầu cho social user (Google/Facebook).
    @PostMapping("/set-password")
    public ResponseEntity<ApiResponse<String>> setPassword(
            Authentication authentication,
            @Valid @RequestBody SetPasswordRequest request
    ) {
        String email = authentication.getName();
        authService.setPassword(email, request);
        return ResponseEntity.ok(ApiResponse.success("Tạo mật khẩu thành công", null));
    }

    // Gửi OTP về email để bắt đầu quy trình đặt lại mật khẩu.
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request
    ) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Mã OTP đã được gửi tới email của bạn", null));
    }

    // Xác thực mã OTP người dùng nhập vào.
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<String>> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request
    ) {
        authService.verifyOtp(request);
        return ResponseEntity.ok(ApiResponse.success("Xác thực OTP thành công", null));
    }

    // Gửi lại email xác thực
    @PostMapping("/send-verification")
    public ResponseEntity<ApiResponse<String>> sendVerification(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.sendVerificationEmail(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Email xác thực đã được gửi lại", null));
    }

    // Cho phép frontend POST token để xác thực (tùy chọn thay vì bấm link).

    // Xác thực email sau khi đăng ký
    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<String>> verifyEmail(@Valid @RequestBody VerifyOtpRequest request) {
        authService.verifyEmail(request);
        return ResponseEntity.ok(ApiResponse.success("Xác thực email thành công", null));
    }

    // Xác thực email bằng token (từ link). Frontend hits backend with token, or backend can be hit directly.
    @PostMapping("/verify-email-token")
    public ResponseEntity<ApiResponse<String>> verifyEmailToken(@RequestBody TokenRequest request) {
        String email = authService.verifyEmailToken(request.getToken());
        return ResponseEntity.ok(ApiResponse.success("Xác thực email thành công", email));
    }

    // Đặt lại mật khẩu mới sau khi OTP đã được xác thực.
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request
    ) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Đặt lại mật khẩu thành công", null));
    }
    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        UserDTO user = authService.getCurrentUser(email);
        return ResponseEntity.ok(user);
    }
}



