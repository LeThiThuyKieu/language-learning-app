package com.languagelearning.service.admin;

import com.languagelearning.dto.admin.dashboard.DashboardStatsDto;
import com.languagelearning.entity.User;
import com.languagelearning.entity.UserNodeProgress;
import com.languagelearning.entity.UserProfile;
import com.languagelearning.repository.mysql.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserNodeProgressRepository userNodeProgressRepository;
    private final PlacementTestRepository placementTestRepository;
    private final LevelRepository levelRepository;

    /**
     * Tổng hợp thống kê cho trang Dashboard Admin.
     */
    @Transactional(readOnly = true)
    public DashboardStatsDto getStats() {
        List<User> allUsers = userRepository.findAll();
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();

        long totalUsers = allUsers.size();
        long activeUsers = allUsers.stream()
                .filter(u -> u.getStatus() == User.UserStatus.active).count();
        long bannedUsers = allUsers.stream()
                .filter(u -> u.getStatus() == User.UserStatus.banned).count();
        long newUsersToday = allUsers.stream()
                .filter(u -> u.getCreatedAt() != null && u.getCreatedAt().isAfter(todayStart))
                .count();

        List<UserProfile> allProfiles = userProfileRepository.findAll();

        long totalXp = allProfiles.stream()
                .mapToLong(p -> p.getTotalXp() != null ? p.getTotalXp() : 0)
                .sum();

        List<UserNodeProgress> allProgress = userNodeProgressRepository.findAll();
        long completedNodes = allProgress.stream()
                .filter(p -> p.getStatus() == UserNodeProgress.NodeProgressStatus.completed).count();
        long inProgressNodes = allProgress.stream()
                .filter(p -> p.getStatus() == UserNodeProgress.NodeProgressStatus.in_progress).count();

        long completedPlacement = placementTestRepository.findAll().stream()
                .filter(pt -> "COMPLETED".equals(pt.getStatus())).count();

        // Số người dùng theo cấp độ từ user_profile.current_level → join với levels table
        Map<String, Long> usersByLevel = new LinkedHashMap<>();
        levelRepository.findAll().forEach(level -> {
            long count = allProfiles.stream()
                    .filter(p -> level.getId().equals(p.getCurrentLevel()))
                    .count();
            usersByLevel.put(level.getLevelName(), count);
        });
        // Thêm "Chưa xác định" cho user chưa có level
        long noLevel = allProfiles.stream()
                .filter(p -> p.getCurrentLevel() == null).count();
        if (noLevel > 0) usersByLevel.put("Chưa xác định", noLevel);

        return DashboardStatsDto.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .bannedUsers(bannedUsers)
                .newUsersToday(newUsersToday)
                .totalXp(totalXp)
                .completedNodes(completedNodes)
                .inProgressNodes(inProgressNodes)
                .completedPlacement(completedPlacement)
                .usersByLevel(usersByLevel)
                .build();
    }
}
