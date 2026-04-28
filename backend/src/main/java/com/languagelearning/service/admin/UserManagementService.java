package com.languagelearning.service.admin;

import com.languagelearning.dto.admin.user_management.UserActivityLogDto;
import com.languagelearning.dto.admin.user_management.UserDto;
import com.languagelearning.dto.admin.user_management.UserStatsDto;
import com.languagelearning.entity.Role;
import com.languagelearning.entity.User;
import com.languagelearning.entity.UserNodeProgress;
import com.languagelearning.entity.UserProfile;
import com.languagelearning.repository.mysql.RoleRepository;
import com.languagelearning.repository.mysql.UserNodeProgressRepository;
import com.languagelearning.repository.mysql.UserProfileRepository;
import com.languagelearning.repository.mysql.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserManagementService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserNodeProgressRepository userNodeProgressRepository;

    /**
     * Lấy danh sách người dùng có phân trang, sắp xếp theo ngày tạo mới nhất.
     */
    @Transactional(readOnly = true)
    public Page<UserDto> getUsers(int page, int size) {
        Page<User> users = userRepository.findAll(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        return users.map(this::toDto);
    }

    /**
     * Thống kê tổng quan: tổng users, đang hoạt động, bị cấm, mới hôm nay.
     */
    @Transactional(readOnly = true)
    public UserStatsDto getStats() {
        List<User> all = userRepository.findAll();
        long total = all.size();
        long active = all.stream().filter(u -> u.getStatus() == User.UserStatus.active).count();
        long banned = all.stream().filter(u -> u.getStatus() == User.UserStatus.banned).count();
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        long newToday = all.stream()
                .filter(u -> u.getCreatedAt() != null && u.getCreatedAt().isAfter(todayStart))
                .count();
        return UserStatsDto.builder()
                .totalUsers(total)
                .activeUsers(active)
                .bannedUsers(banned)
                .newUsersToday(newToday)
                .build();
    }

    /**
     * Cấm người dùng theo ID.
     */
    @Transactional
    public UserDto banUser(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        user.setStatus(User.UserStatus.banned);
        return toDto(userRepository.save(user));
    }

    /**
     * Bỏ cấm người dùng theo ID.
     */
    @Transactional
    public UserDto unbanUser(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        user.setStatus(User.UserStatus.active);
        return toDto(userRepository.save(user));
    }

    /**
     * Cập nhật fullName, role, status của user.
     */
    @Transactional
    public UserDto updateUser(Integer userId, String fullName, String roleName, String status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        if (status != null && !status.isBlank()) {
            // Chấp nhận cả "active"/"banned" (lowercase) và "Active"/"Banned" (capitalized)
            user.setStatus(User.UserStatus.valueOf(status.toLowerCase()));
        }
        if (roleName != null && !roleName.isBlank()) {
            // DB lưu "USER" / "ADMIN" — normalize về uppercase
            String normalizedRole = roleName.toUpperCase();
            Role role = roleRepository.findByRoleName(normalizedRole)
                    .orElseGet(() -> {
                        Role r = new Role();
                        r.setRoleName(normalizedRole);
                        return roleRepository.save(r);
                    });
            user.setRoles(new HashSet<>(List.of(role)));
        }
        final User savedUser = userRepository.save(user);

        if (fullName != null && !fullName.isBlank()) {
            UserProfile profile = userProfileRepository.findByUserId(userId)
                    .orElseGet(() -> {
                        UserProfile p = new UserProfile();
                        p.setUser(savedUser);
                        return p;
                    });
            profile.setFullName(fullName);
            userProfileRepository.save(profile);
        }

        return toDto(savedUser);
    }

    /**
     * Lịch sử hoạt động: đăng nhập + các node đã hoàn thành.
     */
    @Transactional(readOnly = true)
    public List<UserActivityLogDto> getActivityLog(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        List<UserActivityLogDto> logs = new ArrayList<>();

        // Đăng ký tài khoản
        if (user.getCreatedAt() != null) {
            logs.add(UserActivityLogDto.builder()
                    .action("Đăng ký tài khoản")
                    .detail("Tạo tài khoản qua " + user.getAuthProvider().name())
                    .timestamp(user.getCreatedAt())
                    .build());
        }

        // Đăng nhập gần nhất
        if (user.getLastLogin() != null) {
            logs.add(UserActivityLogDto.builder()
                    .action("Đăng nhập")
                    .detail("Đăng nhập lần cuối")
                    .timestamp(user.getLastLogin())
                    .build());
        }

        // Các node đã hoàn thành
        List<UserNodeProgress> progresses = userNodeProgressRepository.findByUser(user);
        for (UserNodeProgress p : progresses) {
            if (p.getStatus() == UserNodeProgress.NodeProgressStatus.completed && p.getUpdatedAt() != null) {
                String nodeName = p.getNode() != null ? p.getNode().getTitle() : "Node #" + p.getNode().getId();
                logs.add(UserActivityLogDto.builder()
                        .action("Hoàn thành bài học")
                        .detail("Hoàn thành: " + nodeName)
                        .timestamp(p.getUpdatedAt())
                        .build());
            }
        }

        // Sắp xếp mới nhất trước
        logs.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));
        return logs;
    }

    /**
     * Tạo người dùng mới từ trang Admin.
     */
    @Transactional
    public UserDto createUser(String email, String password, String roleName,
                              String status, String authProvider) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email đã tồn tại: " + email);
        }
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setAuthProvider(User.AuthProvider.valueOf(authProvider));
        user.setStatus(User.UserStatus.valueOf(status.toLowerCase()));

        Role role = roleRepository.findByRoleName(roleName.toUpperCase())
                .orElseGet(() -> {
                    Role r = new Role();
                    r.setRoleName(roleName.toUpperCase());
                    return roleRepository.save(r);
                });
        user.setRoles(new HashSet<>(List.of(role)));
        user = userRepository.save(user);

        UserProfile profile = new UserProfile();
        profile.setUser(user);
        profile.setTotalXp(0);
        profile.setStreakCount(0);
        userProfileRepository.save(profile);

        return toDto(user);
    }

    private UserDto toDto(User user) {
        Optional<UserProfile> profileOpt = userProfileRepository.findByUserId(user.getId());
        String role = user.getRoles().stream().map(Role::getRoleName).findFirst().orElse("USER");
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .authProvider(user.getAuthProvider().name())
                .status(user.getStatus().name())
                .createdAt(user.getCreatedAt())
                .lastLogin(user.getLastLogin())
                .fullName(profileOpt.map(UserProfile::getFullName).orElse(null))
                .avatarUrl(profileOpt.map(UserProfile::getAvatarUrl).orElse(null))
                .totalXp(profileOpt.map(UserProfile::getTotalXp).orElse(0))
                .streakCount(profileOpt.map(UserProfile::getStreakCount).orElse(0))
                .currentLevel(profileOpt.map(UserProfile::getCurrentLevel).orElse(null))
                .role(role)
                .build();
    }
}
