package com.languagelearning.service.admin;

import com.languagelearning.dto.admin.UserDto;
import com.languagelearning.dto.admin.UserStatsDto;
import com.languagelearning.entity.Role;
import com.languagelearning.entity.User;
import com.languagelearning.entity.UserProfile;
import com.languagelearning.repository.mysql.RoleRepository;
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

    /**
     * Lấy danh sách người dùng có phân trang, sắp xếp theo ngày tạo mới nhất.
     * Join với UserProfile để lấy fullName, avatar, XP, streak, level.
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
     * Cấm người dùng theo ID — đổi status thành banned.
     */
    @Transactional
    public UserDto banUser(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        user.setStatus(User.UserStatus.banned);
        return toDto(userRepository.save(user));
    }

    /**
     * Bỏ cấm người dùng theo ID — đổi status thành active.
     */
    @Transactional
    public UserDto unbanUser(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        user.setStatus(User.UserStatus.active);
        return toDto(userRepository.save(user));
    }

    /**
     * Map User entity + UserProfile → AdminUserDto.
     * Lấy role đầu tiên trong danh sách roles của user.
     */
    private UserDto toDto(User user) {
        Optional<UserProfile> profileOpt = userProfileRepository.findByUserId(user.getId());

        String role = user.getRoles().stream()
                .map(Role::getRoleName)
                .findFirst()
                .orElse("USER");

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

    /**
     * Tạo người dùng mới từ trang Admin.
     * Hash password, gán role, tạo UserProfile mặc định.
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
}
