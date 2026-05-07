package com.languagelearning.service;

import com.languagelearning.dto.UpdateUserProfileRequest;
import com.languagelearning.dto.UserProfileResponse;
import com.languagelearning.entity.Leaderboard;
import com.languagelearning.entity.Level;
import com.languagelearning.entity.User;
import com.languagelearning.entity.UserBadge;
import com.languagelearning.entity.UserKn;
import com.languagelearning.entity.UserNodeProgress;
import com.languagelearning.entity.UserProfile;
import com.languagelearning.entity.UserStreak;
import com.languagelearning.exception.BadCredentialsException;
import com.languagelearning.repository.mysql.LeaderboardRepository;
import com.languagelearning.repository.mysql.LevelRepository;
import com.languagelearning.repository.mysql.UserKnRepository;
import com.languagelearning.repository.mysql.UserStreakRepository;
import com.languagelearning.repository.mysql.UserBadgeRepository;
import com.languagelearning.repository.mysql.UserNodeProgressRepository;
import com.languagelearning.repository.mysql.UserProfileRepository;
import com.languagelearning.repository.mysql.UserRepository;
import com.languagelearning.util.AvatarDefaults;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.Map;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class UserProfileService {
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final LevelRepository levelRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final UserNodeProgressRepository userNodeProgressRepository;
    private final LeaderboardRepository leaderboardRepository;
    private final UserStreakRepository userStreakRepository;
    private final UserKnRepository userKnRepository;
    private final AvatarUploadService avatarUploadService;


    /*
     * Dùng cho phần Overview của trang hồ sơ.
     * Lấy toàn bộ thông tin profile của user đang đăng nhập.
     */
    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        UserProfile profile = userProfileRepository.findByUser(user)
                .orElseGet(() -> createDefaultProfile(user));

        return mapToResponse(user, profile);
    }

    /*
     * Dùng cho phần Chỉnh sửa hồ sơ.
     * Cập nhật fullName, avatarUrl, targetGoal và currentLevelId.
     */
    @Transactional
    public UserProfileResponse updateCurrentProfile(String email, UpdateUserProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        UserProfile profile = userProfileRepository.findByUser(user)
                .orElseGet(() -> createDefaultProfile(user));

        if (request.getFullName() != null) {
            profile.setFullName(request.getFullName());
        }
        if (request.getAvatarUrl() != null) {
            String oldAvatarUrl = profile.getAvatarUrl();
            profile.setAvatarUrl(request.getAvatarUrl());
            if (oldAvatarUrl != null && !oldAvatarUrl.equals(request.getAvatarUrl())) {
                avatarUploadService.deleteAvatarIfManaged(oldAvatarUrl);
            }
        }
        if (request.getTargetGoal() != null) {
            profile.setTargetGoal(request.getTargetGoal());
        }
        if (request.getCurrentLevelId() != null) {
            levelRepository.findById(request.getCurrentLevelId())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid current level id"));
            profile.setCurrentLevel(request.getCurrentLevelId());
        }

        UserProfile savedProfile = userProfileRepository.save(profile);
        return mapToResponse(user, savedProfile);
    }

    /*
     * Dùng khi user chưa có bản ghi user_profile.
     * Tạo profile mặc định để trang hồ sơ luôn hiển thị được.
     */
    private UserProfile createDefaultProfile(User user) {
        UserProfile profile = new UserProfile();
        profile.setUser(user);
        profile.setAvatarUrl(AvatarDefaults.randomAvatarUrl());
        profile.setTotalXp(0);
        profile.setStreakCount(0);
        return userProfileRepository.save(profile);
    }

    /*
     * Dùng để tổng hợp dữ liệu cho các block trên trang hồ sơ.
     * Bao gồm thông tin cơ bản, thống kê tiến độ, thứ hạng và badges.
     */
    private UserProfileResponse mapToResponse(User user, UserProfile profile) {
        Optional<Level> currentLevel = Optional.ofNullable(profile.getCurrentLevel())
                .flatMap(levelRepository::findById);

        List<UserBadge> userBadges = userBadgeRepository.findByUser(user).stream()
                .sorted(Comparator.comparing(UserBadge::getEarnedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        List<UserNodeProgress> nodeProgresses = userNodeProgressRepository.findByUser(user);
        int totalNodes = nodeProgresses.size();
        int completedNodes = (int) nodeProgresses.stream()
                .filter(item -> item.getStatus() == UserNodeProgress.NodeProgressStatus.completed)
                .count();
        int totalAttempts = nodeProgresses.stream()
                .map(UserNodeProgress::getAttemptCount)
                .filter(value -> value != null)
                .reduce(0, Integer::sum);
        int completionRate = totalNodes == 0 ? 0 : (int) ((completedNodes * 100.0) / totalNodes);
        Integer rankPosition = leaderboardRepository.findByUser(user)
                .map(Leaderboard::getRankPosition)
                .orElse(null);

        int totalKn = userKnRepository.findByUser(user)
                .map(UserKn::getTotalKn)
                .orElse(0);

        LocalDate today = LocalDate.now();
        LocalDate startOfWeek = today.with(DayOfWeek.MONDAY);
        LocalDate endOfWeek = startOfWeek.plusDays(6);

        Map<LocalDate, Integer> activityByDate = userStreakRepository
                .findByUserAndDateBetween(user, startOfWeek, endOfWeek)
                .stream()
                .collect(Collectors.toMap(
                        UserStreak::getDate,
                        item -> item.getEarnedXp() == null ? 0 : item.getEarnedXp(),
                        Integer::sum
                ));

        List<Integer> weeklyActivityXp = IntStream.range(0, 7)
                .mapToObj(offset -> startOfWeek.plusDays(offset))
                .map(day -> activityByDate.getOrDefault(day, 0))
                .toList();

        Integer todayXp = activityByDate.getOrDefault(today, 0);

        List<UserProfileResponse.BadgeItem> badgeItems = userBadges.stream()
                .map(userBadge -> new UserProfileResponse.BadgeItem(
                        userBadge.getBadge().getId(),
                        userBadge.getBadge().getBadgeName(),
                        userBadge.getBadge().getDescription(),
                        userBadge.getBadge().getRequiredXp(),
                        userBadge.getBadge().getIconUrl(),
                        userBadge.getEarnedAt()
                ))
                .toList();

        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                profile.getFullName(),
                profile.getAvatarUrl(),
                profile.getTargetGoal(),
                profile.getCurrentLevel(),
                currentLevel.map(Level::getLevelName).orElse(null),
                currentLevel.map(Level::getCefrCode).orElse(null),
                profile.getTotalXp() == null ? 0 : profile.getTotalXp(),
                profile.getStreakCount() == null ? 0 : profile.getStreakCount(),
                rankPosition,
                totalKn,
                completedNodes,
                totalNodes,
                completionRate,
                totalAttempts,
                                weeklyActivityXp,
                                todayXp,
                user.getCreatedAt(),
                user.getLastLogin(),
                badgeItems
        );
    }
}