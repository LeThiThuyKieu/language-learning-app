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
import java.time.format.DateTimeParseException;
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

    @org.springframework.beans.factory.annotation.Value("${app.email-verification.enforced-since:2026-05-22T00:00:00}")
    private String emailVerificationEnforcedSince;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        User user = userRepository.findByEmail(request.getEmail()).orElseGet(User::new);
        boolean isNewUser = user.getId() == null;

        // Nếu email đã tồn tại nhưng chưa xác thực, cho phép đăng ký lại để làm mới token.
        if (!isNewUser && user.isEmailVerified()) {
            throw new UserAlreadyExistsException("Email already registered");
        }

        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setAuthProvider(User.AuthProvider.LOCAL);
        user.setProviderUserId(null);
        user.setStatus(User.UserStatus.active);
        user.setEmailVerified(false);

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
        final User savedUser = user;

        // Xóa token cũ theo email nếu có, rồi tạo token mới và gửi mail xác thực mới.
        verificationService.invalidateByEmail(savedUser.getEmail());
        String verificationToken = verificationService.generateToken(savedUser.getEmail(), java.time.Duration.ofHours(24));
        emailService.sendVerificationEmail(savedUser.getEmail(), verificationToken);

        UserProfile profile = userProfileRepository.findByUser(savedUser).orElseGet(() -> {
            UserProfile newProfile = new UserProfile();
            newProfile.setUser(savedUser);
            newProfile.setAvatarUrl(AvatarDefaults.randomAvatarUrl());
            newProfile.setTotalXp(0);
            newProfile.setStreakCount(0);
            return newProfile;
        });
        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            profile.setFullName(request.getFullName());
        }
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

        // Với tài khoản local, chỉ chặn xác thực email đối với tài khoản được tạo sau mốc bật tính năng.
        // Tài khoản cũ vẫn đăng nhập bình thường để không làm gián đoạn người dùng hiện tại.
        if (user.getAuthProvider() == User.AuthProvider.LOCAL && !user.isEmailVerified()) {
            if (mustVerifyEmail(user)) {
                throw new BadCredentialsException("Vui lòng xác thực email trước khi đăng nhập");
            }

            // Tự động cho phép tài khoản cũ để tương thích ngược với dữ liệu đã có sẵn.
            user.setEmailVerified(true);
            userRepository.save(user);
        }

        if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
            throw new BadCredentialsException("This account uses social login. Please continue with Google/Facebook.");
        }
        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Email hoặc mật khẩu không đúng");
        }

        // Sinh JWT
        String token = jwtTokenProvider.generateToken(user.getEmail());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getEmail());

        // Update last login
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        return new AuthResponse(UserDTO.fromUser(user), token, refreshToken);
    }

    private boolean mustVerifyEmail(User user) {
        if (user.getCreatedAt() == null) {
            return true;
        }

        try {
            LocalDateTime enforcedSince = LocalDateTime.parse(emailVerificationEnforcedSince);
            return !user.getCreatedAt().isBefore(enforcedSince);
        } catch (DateTimeParseException ex) {
            // Nếu cấu hình sai định dạng, mặc định vẫn yêu cầu xác thực để an toàn.
            return true;
        }
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

        // Chặn gửi OTP mới nếu tài khoản đang trong thời gian bị khoá do nhập sai quá nhiều lần
        if (otpService.isLocked(request.getEmail())) {
            throw new IllegalStateException("Tài khoản đang bị tạm khoá do nhập sai OTP quá nhiều lần. Vui lòng thử lại sau.");
        }

        boolean hasPassword = user.getPasswordHash() != null && !user.getPasswordHash().isBlank();
        String otp = otpService.generateAndStore(request.getEmail());
        emailService.sendOtpEmail(request.getEmail(), otp, hasPassword);
    }

    // Xác thực OTP người dùng nhập có đúng với OTP đã gửi hay không.
    public void verifyOtp(VerifyOtpRequest request) {
        int remaining = otpService.getRemainingAttempts(request.getEmail());
        if (remaining == 0) {
            throw new BadCredentialsException("Bạn đã nhập sai OTP quá nhiều lần. Vui lòng yêu cầu mã OTP mới.");
        }
        if (!otpService.verify(request.getEmail(), request.getOtp())) {
            int remainingAfter = otpService.getRemainingAttempts(request.getEmail());
            if (remainingAfter == 0) {
                throw new BadCredentialsException("Mã OTP không đúng. OTP đã bị vô hiệu hoá, vui lòng gửi lại mã mới.");
            }
            throw new BadCredentialsException("Mã OTP không đúng. Còn " + remainingAfter + " lần thử.");
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


