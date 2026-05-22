package com.languagelearning.service;

import com.languagelearning.dto.*;
import com.languagelearning.entity.Role;
import com.languagelearning.entity.User;
import com.languagelearning.entity.UserProfile;
import com.languagelearning.exception.BadCredentialsException;
import com.languagelearning.exception.InvalidTokenException;
import com.languagelearning.exception.UserAlreadyExistsException;
import com.languagelearning.repository.mysql.RoleRepository;
import com.languagelearning.repository.mysql.UserProfileRepository;
import com.languagelearning.repository.mysql.UserRepository;
import com.languagelearning.util.AvatarDefaults;
import com.languagelearning.util.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final OtpService otpService;
    private final EmailService emailService;
    private final VerificationService verificationService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // check neu tồn tại user
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email already registered");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setAuthProvider(User.AuthProvider.LOCAL);
        user.setProviderUserId(null);
        user.setStatus(User.UserStatus.active);

        // assign default role (USER)
        Role userRole = roleRepository.findByRoleName("USER")
                .orElseGet(() -> {
                    Role newRole = new Role();
                    newRole.setRoleName("USER");
                    return roleRepository.save(newRole);
                });

        Set<Role> roles = new HashSet<>();
        roles.add(userRole);
        user.setRoles(roles);

        user = userRepository.save(user);

        // mark not verified and send verification email
        user.setEmailVerified(false);
        userRepository.save(user);

        // generate verification token valid 24 hours and send email link
        String verificationToken = verificationService.generateToken(user.getEmail(), java.time.Duration.ofHours(24));
        emailService.sendVerificationEmail(user.getEmail(), verificationToken);

        UserProfile profile = new UserProfile();
        profile.setUser(user);
        profile.setFullName(request.getFullName());
        profile.setAvatarUrl(AvatarDefaults.randomAvatarUrl());
        profile.setTotalXp(0);
        profile.setStreakCount(0);
        userProfileRepository.save(profile);

        // Do NOT issue JWT yet — require email verification first
        return new AuthResponse(UserDTO.fromUser(user), null, null);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        // Check if user is banned
        if (user.getStatus() == User.UserStatus.banned) {
            throw new BadCredentialsException("Account is banned");
        }

        // Require email verification for LOCAL accounts
        if (user.getAuthProvider() == User.AuthProvider.LOCAL && (user.isEmailVerified() == false)) {
            throw new BadCredentialsException("Vui lòng xác thực email trước khi đăng nhập");
        }

        if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
            throw new BadCredentialsException("This account uses social login. Please continue with Google/Facebook.");
        }
        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        // Sinh JWT
        String token = jwtTokenProvider.generateToken(user.getEmail());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getEmail());

        // Update last login
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        return new AuthResponse(UserDTO.fromUser(user), token, refreshToken);
    }

    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();

        // Validate refresh token
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new InvalidTokenException("Invalid or expired refresh token");
        }

        // Extract username from token
        String email = jwtTokenProvider.extractUsername(refreshToken);

        // Find user
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidTokenException("User not found"));

        // Check if user is banned
        if (user.getStatus() == User.UserStatus.banned) {
            throw new InvalidTokenException("Account is banned");
        }

        // Generate new token
        String newToken = jwtTokenProvider.generateToken(user.getEmail());
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(user.getEmail());

        return new AuthResponse(UserDTO.fromUser(user), newToken, newRefreshToken);
    }

    public UserDTO getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        return UserDTO.fromUser(user);
    }

    @Transactional
    public void logout(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);
        });
    }
    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        // Social user chưa có password → dùng setPassword thay thế
        if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
            throw new BadCredentialsException("Tài khoản chưa có mật khẩu. Vui lòng dùng chức năng 'Tạo mật khẩu'.");
        }

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Current password is incorrect");
        }

        if (!request.getNewPassword().equals(request.getConfirmNewPassword())) {
            throw new IllegalArgumentException("Confirm password does not match");
        }

        if (request.getCurrentPassword().equals(request.getNewPassword())) {
            throw new IllegalArgumentException("New password must be different from current password");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    /**
     * Tạo mật khẩu lần đầu cho social user (Google/Facebook).
     * Yêu cầu: account chưa có passwordHash.
     */
    @Transactional
    public void setPassword(String email, SetPasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        if (user.getPasswordHash() != null && !user.getPasswordHash().isBlank()) {
            throw new IllegalStateException("Tài khoản đã có mật khẩu. Vui lòng dùng chức năng 'Đổi mật khẩu'.");
        }

        if (!request.getNewPassword().equals(request.getConfirmNewPassword())) {
            throw new IllegalArgumentException("Mật khẩu xác nhận không khớp");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    // Gửi OTP qua email — hoạt động cho cả LOCAL lẫn social account.
    // Subject email sẽ khác nhau tùy account đã có password chưa.
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Email không tồn tại trong hệ thống"));

        boolean hasPassword = user.getPasswordHash() != null && !user.getPasswordHash().isBlank();
        String otp = otpService.generateAndStore(request.getEmail());
        emailService.sendOtpEmail(request.getEmail(), otp, hasPassword);
    }

    // Xác thực OTP người dùng nhập có đúng với OTP đã gửi hay không.
    public void verifyOtp(VerifyOtpRequest request) {
        if (!otpService.verify(request.getEmail(), request.getOtp())) {
            throw new BadCredentialsException("Mã OTP không đúng hoặc đã hết hạn");
        }
    }

    // Đặt lại mật khẩu mới sau khi xác thực OTP thành công.
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if (!otpService.verify(request.getEmail(), request.getOtp())) {
            throw new BadCredentialsException("Mã OTP không đúng hoặc đã hết hạn");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Email không tồn tại trong hệ thống"));

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Xóa OTP sau khi đã dùng xong
        otpService.invalidate(request.getEmail());
    }

    /** Gửi lại email xác thực (resend). */
    public void sendVerificationEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Email không tồn tại trong hệ thống"));

        if (user.isEmailVerified()) return; // already verified

        String token = verificationService.generateToken(email, java.time.Duration.ofHours(24));
        emailService.sendVerificationEmail(email, token);
    }

    /** Xác thực email bằng OTP. */
    @Transactional
    public void verifyEmail(VerifyOtpRequest request) {
        if (!otpService.verify(request.getEmail(), request.getOtp())) {
            throw new BadCredentialsException("Mã xác thực không đúng hoặc đã hết hạn");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Email không tồn tại trong hệ thống"));

        user.setEmailVerified(true);
        userRepository.save(user);

        otpService.invalidate(request.getEmail());
    }

    /** Verify using token (from link). Returns associated email or throws if invalid. */
    @Transactional
    public String verifyEmailToken(String token) {
        String email = verificationService.consumeToken(token);
        if (email == null) {
            throw new BadCredentialsException("Token không hợp lệ hoặc đã hết hạn");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Email không tồn tại trong hệ thống"));

        user.setEmailVerified(true);
        userRepository.save(user);
        return email;
    }

}


