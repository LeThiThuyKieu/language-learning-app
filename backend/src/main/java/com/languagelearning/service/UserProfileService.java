package com.languagelearning.service;

import com.languagelearning.dto.UpdateUserProfileRequest;
import com.languagelearning.dto.UserProfileResponse;
import com.languagelearning.entity.Leaderboard;
import com.languagelearning.entity.Level;
import com.languagelearning.entity.SkillNode;
import com.languagelearning.entity.SkillTree;
import com.languagelearning.entity.User;
import com.languagelearning.entity.UserBadge;
import com.languagelearning.entity.UserKn;
import com.languagelearning.entity.UserNodeProgress;
import com.languagelearning.entity.UserProfile;
import com.languagelearning.entity.UserSkillTreeProgress;
import com.languagelearning.entity.UserStreak;
import com.languagelearning.exception.BadCredentialsException;
import com.languagelearning.repository.mysql.LeaderboardRepository;
import com.languagelearning.repository.mysql.LevelRepository;
import com.languagelearning.repository.mysql.SkillNodeRepository;
import com.languagelearning.repository.mysql.SkillTreeRepository;
import com.languagelearning.repository.mysql.BadgeRepository;
import com.languagelearning.repository.mysql.UserKnRepository;
import com.languagelearning.repository.mysql.UserStreakRepository;
import com.languagelearning.repository.mysql.UserBadgeRepository;
import com.languagelearning.repository.mysql.UserNodeProgressRepository;
import com.languagelearning.repository.mysql.UserProfileRepository;
import com.languagelearning.repository.mysql.UserRepository;
import com.languagelearning.repository.mysql.UserSkillTreeProgressRepository;
import com.languagelearning.repository.mysql.UserQuestionAttemptRepository;
import com.languagelearning.util.AvatarDefaults;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.Map;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class UserProfileService {
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final LevelRepository levelRepository;
    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final UserNodeProgressRepository userNodeProgressRepository;
    private final LeaderboardRepository leaderboardRepository;
    private final UserStreakRepository userStreakRepository;
    private final UserKnRepository userKnRepository;
    private final AvatarUploadService avatarUploadService;
    private final SkillTreeRepository skillTreeRepository;
    private final SkillNodeRepository skillNodeRepository;
    private final UserSkillTreeProgressRepository userSkillTreeProgressRepository;
    private final UserQuestionAttemptRepository userQuestionAttemptRepository;


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
        
        int totalKn = userKnRepository.findByUser(user)
                .map(UserKn::getTotalKn)
                .orElse(0);

        // Tính rank dựa trên total_kn
        List<Leaderboard> allLeaderboards = leaderboardRepository.findAllOrderByTotalKnDesc();
        Integer rankPosition = null;
        for (int i = 0; i < allLeaderboards.size(); i++) {
            if (allLeaderboards.get(i).getUser().getId().equals(user.getId())) {
                rankPosition = i + 1;
                break;
            }
        }

        // Tính tiến trình theo tree (dựa trên level hiện tại của user)
        int completedTrees = 0;
        int totalTrees = 0;
        String currentProgressLabel = null;

        Integer currentLevelId = profile.getCurrentLevel();
        if (currentLevelId != null) {
            List<SkillTree> trees = skillTreeRepository.findByLevel_IdOrderByOrderIndex(currentLevelId);
            totalTrees = trees.size();

            Map<Integer, UserSkillTreeProgress.ProgressStatus> treeStatusMap = userSkillTreeProgressRepository
                    .findByUser(user).stream()
                    .filter(p -> p.getSkillTree() != null)
                    .collect(Collectors.toMap(
                            p -> p.getSkillTree().getId(),
                            UserSkillTreeProgress::getStatus,
                            (a, b) -> a
                    ));

            Map<Integer, UserNodeProgress.NodeProgressStatus> nodeStatusMap = nodeProgresses.stream()
                    .filter(p -> p.getNode() != null)
                    .collect(Collectors.toMap(
                            p -> p.getNode().getId(),
                            UserNodeProgress::getStatus,
                            (a, b) -> a
                    ));

            for (SkillTree tree : trees) {
                UserSkillTreeProgress.ProgressStatus treeStatus =
                        treeStatusMap.getOrDefault(tree.getId(), UserSkillTreeProgress.ProgressStatus.locked);
                if (treeStatus == UserSkillTreeProgress.ProgressStatus.done) {
                    completedTrees++;
                }
            }

            // Tìm tree đang học: ưu tiên tree có status in_progress,
            // nếu không có thì lấy tree đầu tiên chưa done (locked/not started)
            int activeTreeIdx = -1;
            for (int ti = 0; ti < trees.size(); ti++) {
                SkillTree tree = trees.get(ti);
                UserSkillTreeProgress.ProgressStatus treeStatus =
                        treeStatusMap.getOrDefault(tree.getId(), UserSkillTreeProgress.ProgressStatus.locked);
                if (treeStatus == UserSkillTreeProgress.ProgressStatus.in_progress) {
                    activeTreeIdx = ti;
                    break; // in_progress được ưu tiên cao nhất
                }
                if (treeStatus != UserSkillTreeProgress.ProgressStatus.done && activeTreeIdx == -1) {
                    activeTreeIdx = ti; // ghi nhận tree đầu tiên chưa done, tiếp tục tìm in_progress
                }
            }

            if (activeTreeIdx >= 0) {
                SkillTree activeTree = trees.get(activeTreeIdx);
                List<SkillNode> nodes = skillNodeRepository.findBySkillTree_IdOrderByOrderIndex(activeTree.getId());
                int activeNodeIdx = 1;
                for (int ni = 0; ni < nodes.size(); ni++) {
                    SkillNode node = nodes.get(ni);
                    if (nodeStatusMap.getOrDefault(node.getId(), UserNodeProgress.NodeProgressStatus.not_started)
                            == UserNodeProgress.NodeProgressStatus.completed) {
                        activeNodeIdx = ni + 2;
                    } else {
                        activeNodeIdx = ni + 1;
                        break;
                    }
                }
                activeNodeIdx = Math.min(activeNodeIdx, nodes.size());
                currentProgressLabel = "Tree " + (activeTreeIdx + 1) + " - Node " + activeNodeIdx + "/" + nodes.size();
            }
        }

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

        // Tất cả badges đang active (earned + not-earned), sắp xếp theo required_kn tăng dần
        Set<Integer> earnedBadgeIds = userBadges.stream()
                .map(ub -> ub.getBadge().getId())
                .collect(Collectors.toSet());
        Map<Integer, LocalDateTime> earnedAtMap = userBadges.stream()
                .collect(Collectors.toMap(
                        ub -> ub.getBadge().getId(),
                        UserBadge::getEarnedAt,
                        (a, b) -> a
                ));

        List<UserProfileResponse.BadgeItem> badgeItems = badgeRepository.findAll().stream()
                .filter(badge -> badge.getStatus() == null || "active".equalsIgnoreCase(badge.getStatus()))
                .sorted(Comparator.comparingInt(b -> b.getRequiredKn() == null ? 0 : b.getRequiredKn()))
                .map(badge -> new UserProfileResponse.BadgeItem(
                        badge.getId(),
                        badge.getBadgeName(),
                        badge.getDescription(),
                        badge.getRequiredKn(),
                        badge.getIconUrl(),
                        earnedBadgeIds.contains(badge.getId()),
                        earnedAtMap.get(badge.getId())
                ))
                .toList();

        UserProfileResponse resp = new UserProfileResponse();
        resp.setUserId(user.getId());
        resp.setEmail(user.getEmail());
        resp.setFullName(profile.getFullName());
        resp.setAvatarUrl(profile.getAvatarUrl());
        resp.setTargetGoal(profile.getTargetGoal());
        resp.setCurrentLevelId(profile.getCurrentLevel());
        resp.setCurrentLevelName(currentLevel.map(Level::getLevelName).orElse(null));
        resp.setCurrentLevelCefr(currentLevel.map(Level::getCefrCode).orElse(null));
        resp.setTotalXp(profile.getTotalXp() == null ? 0 : profile.getTotalXp());
        resp.setStreakCount(profile.getStreakCount() == null ? 0 : profile.getStreakCount());
        resp.setRankPosition(rankPosition);
        resp.setTotalKn(totalKn);
        resp.setCompletedNodes(completedNodes);
        resp.setTotalNodes(totalNodes);
        resp.setCompletionRate(completionRate);
        resp.setTotalAttempts(totalAttempts);
        resp.setCompletedTrees(completedTrees);
        resp.setTotalTrees(totalTrees);
        resp.setCurrentProgressLabel(currentProgressLabel);

        // Tính accuracy theo từng loại câu hỏi
        java.util.Map<String, Integer> accuracyByType = new java.util.LinkedHashMap<>();
        try {
            var attempts = userQuestionAttemptRepository.findByUserWithQuestion(user);
            String[] types = {"VOCAB", "LISTENING", "SPEAKING", "MATCHING"};
            for (String type : types) {
                var filtered = attempts.stream()
                        .filter(a -> a.getQuestion() != null
                                && a.getQuestion().getQuestionType() != null
                                && a.getQuestion().getQuestionType().name().equals(type))
                        .toList();
                if (!filtered.isEmpty()) {
                    long correct = filtered.stream().filter(a -> Boolean.TRUE.equals(a.getIsCorrect())).count();
                    accuracyByType.put(type, (int) Math.round((correct * 100.0) / filtered.size()));
                }
            }
        } catch (Exception ignored) {}
        resp.setAccuracyByType(accuracyByType);
        resp.setWeeklyActivityXp(weeklyActivityXp);
        resp.setTodayXp(todayXp);
        resp.setCreatedAt(user.getCreatedAt());
        resp.setLastLogin(user.getLastLogin());
        resp.setBadges(badgeItems);
        resp.setHasPassword(user.getPasswordHash() != null && !user.getPasswordHash().isBlank());
        resp.setAuthProvider(user.getAuthProvider().name());
        return resp;
    }
}