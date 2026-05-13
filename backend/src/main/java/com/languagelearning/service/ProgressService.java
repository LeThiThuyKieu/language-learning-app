package com.languagelearning.service;

import com.languagelearning.entity.*;
import com.languagelearning.dto.SubmitAttemptsRequest;
import com.languagelearning.exception.BadCredentialsException;
import com.languagelearning.repository.mysql.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProgressService {

    /** Kết quả trả về sau khi hoàn thành node */
    public record CompleteNodeResult(int unlockedCount, int knEarned, List<BadgeInfo> newBadgeNames) {}

    /** Thông tin badge mới được trao */
    public record BadgeInfo(String name, String iconUrl) {}

    private final UserRepository userRepository;
    private final SkillNodeRepository skillNodeRepository;
    private final SkillTreeRepository skillTreeRepository;
    private final UserNodeProgressRepository userNodeProgressRepository;
    private final UserSkillTreeProgressRepository userSkillTreeProgressRepository;
    private final SkillTreeQuestionService skillTreeQuestionService;
    private final UserKnRepository userKnRepository;
    private final UserStreakRepository userStreakRepository;
    private final UserProfileRepository userProfileRepository;
    private final QuestionIndexRepository questionIndexRepository;
    private final UserQuestionAttemptRepository userQuestionAttemptRepository;
    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;

    /** Lấy số node đã unlock của một tree */
    @Transactional(readOnly = true)
    public int getUnlockedCount(String email, int treeId) {
        User user = getUser(email);
        List<SkillNode> nodes = skillNodeRepository.findBySkillTree_IdOrderByOrderIndex(treeId);
        if (nodes.isEmpty()) return 1;

        Map<Integer, UserNodeProgress.NodeProgressStatus> statusMap = userNodeProgressRepository
                .findByUser(user)
                .stream()
                .filter(p -> p.getNode() != null)
                .collect(Collectors.toMap(
                        p -> p.getNode().getId(),
                        UserNodeProgress::getStatus,
                        (a, b) -> a
                ));

        int completedCount = 0;
        for (SkillNode node : nodes) {
            if (statusMap.getOrDefault(node.getId(), UserNodeProgress.NodeProgressStatus.not_started)
                    == UserNodeProgress.NodeProgressStatus.completed) {
                completedCount++;
            } else {
                break; // dừng ở node đầu tiên chưa completed
            }
        }
        // unlockedCount = completedCount + 1 (node tiếp theo đang active), tối đa = nodes.size()
        return Math.min(completedCount + 1, nodes.size());
    }

    /** Đánh dấu node đã hoàn thành, cập nhật tree progress, invalidate Redis cache */
    @Transactional
    public CompleteNodeResult completeNode(String email, int nodeId, int correctCount) {
        User user = getUser(email);
        SkillNode node = skillNodeRepository.findById(nodeId)
                .orElseThrow(() -> new IllegalArgumentException("Node not found: " + nodeId));

        // Upsert UserNodeProgress
        UserNodeProgress progress = userNodeProgressRepository
                .findByUserAndNodeId(user, nodeId)
                .orElseGet(() -> {
                    UserNodeProgress p = new UserNodeProgress();
                    p.setUser(user);
                    p.setNode(node);
                    p.setScore(0);
                    p.setAttemptCount(0);
                    return p;
                });

        progress.setStatus(UserNodeProgress.NodeProgressStatus.completed);
        progress.setAttemptCount((progress.getAttemptCount() == null ? 0 : progress.getAttemptCount()) + 1);
        userNodeProgressRepository.save(progress);

        // Cộng KN: +20 cho REVIEW, +10 cho các node khác (kể cả học lại)
        int knReward = (node.getNodeType() == SkillNode.NodeType.REVIEW) ? 20 : 10;
        addKn(user, knReward);

        // Cộng XP: mỗi câu đúng = +10 XP, lưu vào user_profile.total_xp
        if (correctCount > 0) {
            addXp(user, correctCount * 10);
        }

        // Cập nhật streak: ghi nhận ngày hôm nay user có học
        recordStreak(user);

        // Cập nhật UserSkillTreeProgress
        int treeId = node.getSkillTree().getId();
        updateTreeProgress(user, treeId);

        // Invalidate Redis cache để lần sau load lại progress mới nhất
        Integer levelId = node.getSkillTree().getLevel() != null ? node.getSkillTree().getLevel().getId() : null;
        if (levelId != null) {
            skillTreeQuestionService.invalidateLevelCache(user.getId(), levelId);
        }

        return new CompleteNodeResult(getUnlockedCount(email, treeId), knReward, checkAndAwardBadges(user));
    }

    /** Cập nhật Tree Progress */
    private void updateTreeProgress(User user, int treeId) {
        SkillTree tree = skillTreeRepository.findById(treeId)
                .orElseThrow(() -> new IllegalArgumentException("Tree not found: " + treeId));

        List<SkillNode> nodes = skillNodeRepository.findBySkillTree_IdOrderByOrderIndex(treeId);
        Map<Integer, UserNodeProgress.NodeProgressStatus> statusMap = userNodeProgressRepository
                .findByUser(user)
                .stream()
                .filter(p -> p.getNode() != null)
                .collect(Collectors.toMap(
                        p -> p.getNode().getId(),
                        UserNodeProgress::getStatus,
                        (a, b) -> a
                ));

        boolean allDone = !nodes.isEmpty() && nodes.stream().allMatch(n ->
                statusMap.getOrDefault(n.getId(), UserNodeProgress.NodeProgressStatus.not_started)
                        == UserNodeProgress.NodeProgressStatus.completed);

        UserSkillTreeProgress treeProgress = userSkillTreeProgressRepository
                .findByUserAndSkillTreeId(user, treeId)
                .orElseGet(() -> {
                    UserSkillTreeProgress tp = new UserSkillTreeProgress();
                    tp.setUser(user);
                    tp.setSkillTree(tree);
                    tp.setScore(0);
                    return tp;
                });

        treeProgress.setStatus(allDone
                ? UserSkillTreeProgress.ProgressStatus.done
                : UserSkillTreeProgress.ProgressStatus.in_progress);
        userSkillTreeProgressRepository.save(treeProgress);
    }

    /** Lấy ra user */
    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("User not found"));
    }

    /**
     * Ghi lại kết quả từng câu hỏi vào user_question_attempt,
     * sau đó hoàn thành node (cộng KN, XP, streak).
     */
    @Transactional
    public CompleteNodeResult submitAttempts(String email, SubmitAttemptsRequest request) {
        User user = getUser(email);

        int correctCount = 0;

        if (request.getAttempts() != null) {
            for (SubmitAttemptsRequest.AttemptItem item : request.getAttempts()) {
                // Tìm QuestionIndex theo mongoQuestionId (bỏ qua nếu không tìm thấy)
                QuestionIndex qi = questionIndexRepository
                        .findByMongoQuestionId(item.getMongoQuestionId())
                        .orElse(null);

                UserQuestionAttempt attempt = new UserQuestionAttempt();
                attempt.setUser(user);
                attempt.setQuestion(qi); // null-safe: nếu không tìm thấy thì vẫn lưu
                attempt.setUserAnswer(item.getUserAnswer());
                attempt.setIsCorrect(item.isCorrect());
                attempt.setScore(item.isCorrect() ? 10 : 0);
                userQuestionAttemptRepository.save(attempt);

                if (item.isCorrect()) correctCount++;
            }
        }

        return completeNode(email, request.getNodeId(), correctCount);
    }

    /** Cộng KN cho user */
    private void addKn(User user, int amount) {
        UserKn userKn = userKnRepository.findByUser(user).orElseGet(() -> {
            UserKn kn = new UserKn();
            kn.setUser(user);
            kn.setTotalKn(0);
            return kn;
        });
        userKn.setTotalKn(userKn.getTotalKn() + amount);
        userKnRepository.save(userKn);
    }

    /** Cộng XP cho user (lưu vào user_profile.total_xp) */
    private void addXp(User user, int amount) {
        userProfileRepository.findByUser(user).ifPresent(profile -> {
            int current = profile.getTotalXp() == null ? 0 : profile.getTotalXp();
            profile.setTotalXp(current + amount);
            userProfileRepository.save(profile);
        });
    }

    /**
     * Kiểm tra và trao badge cho user nếu đủ KN.
     * Trả về danh sách badge mới được trao (name + iconUrl).
     */
    private List<BadgeInfo> checkAndAwardBadges(User user) {
        int totalKn = userKnRepository.findByUser(user)
                .map(UserKn::getTotalKn)
                .orElse(0);

        List<Badge> eligibleBadges = badgeRepository.findAll().stream()
                .filter(b -> b.getRequiredKn() != null && totalKn >= b.getRequiredKn())
                .toList();

        List<BadgeInfo> newBadges = new java.util.ArrayList<>();
        for (Badge badge : eligibleBadges) {
            if (!userBadgeRepository.existsByUserAndBadgeId(user, badge.getId())) {
                UserBadge ub = new UserBadge();
                ub.setUser(user);
                ub.setBadge(badge);
                userBadgeRepository.save(ub);
                newBadges.add(new BadgeInfo(badge.getBadgeName(), badge.getIconUrl()));
            }
        }
        return newBadges;
    }

    /**
     * Ghi nhận ngày hôm nay user có học (dùng để tính streak).
     * Nếu đã có bản ghi cho ngày hôm nay thì bỏ qua.
     * Cập nhật streak_count trong user_profile.
     */
    private void recordStreak(User user) {
        LocalDate today = LocalDate.now();
        if (userStreakRepository.findByUserAndDate(user, today).isPresent()) {
            return; // đã ghi nhận hôm nay rồi
        }

        // Tạo bản ghi streak cho hôm nay
        UserStreak streak = new UserStreak();
        streak.setUser(user);
        streak.setDate(today);
        streak.setEarnedXp(0);
        userStreakRepository.save(streak);

        // Tính lại streak_count liên tiếp và cập nhật vào user_profile
        int streakCount = 1;
        LocalDate checkDate = today.minusDays(1);
        while (userStreakRepository.findByUserAndDate(user, checkDate).isPresent()) {
            streakCount++;
            checkDate = checkDate.minusDays(1);
        }

        final int finalStreakCount = streakCount;
        userProfileRepository.findByUser(user).ifPresent(profile -> {
            profile.setStreakCount(finalStreakCount);
            userProfileRepository.save(profile);
        });
    }
}
