package com.languagelearning.service.general_revision;

import com.languagelearning.dto.general_revision.SubmitRevisionTaskRequest;
import com.languagelearning.dto.general_revision.SubmitRevisionTaskResponse;
import com.languagelearning.entity.*;
import com.languagelearning.repository.mysql.*;
import com.languagelearning.service.leaderboard.LeaderboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * Xử lý khi user hoàn thành 1 task ôn tập tổng hợp:
 * - Lưu user_general_revision_task_attempt
 * - Cập nhật user_general_revision_topic_progress
 * - Cộng KN (+10 mỗi task)
 * - Cộng XP (số câu đúng × 10)
 * - Ghi streak
 * - Cập nhật user_profile.total_xp và streak_count
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GeneralRevisionProgressService {

    private static final int KN_PER_TASK = 10;
    private static final int XP_PER_CORRECT = 10;
    private static final int TOTAL_TASKS_PER_TOPIC = 4;

    private final UserRepository userRepository;
    private final GeneralRevisionTaskRepository taskRepository;
    private final GeneralRevisionTopicRepository topicRepository;
    private final UserGeneralRevisionTaskAttemptRepository taskAttemptRepository;
    private final UserGeneralRevisionTopicProgressRepository topicProgressRepository;
    private final UserKnRepository userKnRepository;
    private final UserStreakRepository userStreakRepository;
    private final UserProfileRepository userProfileRepository;
    private final LeaderboardService leaderboardService;

    @Transactional
    public SubmitRevisionTaskResponse submitTask(String email, SubmitRevisionTaskRequest req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        GeneralRevisionTask task = taskRepository.findById(req.getTaskId())
                .orElseThrow(() -> new IllegalArgumentException("Task not found: " + req.getTaskId()));

        int correctCount = req.getCorrectCount() != null ? req.getCorrectCount() : 0;
        int totalCount   = req.getTotalCount()   != null ? req.getTotalCount()   : 0;
        int score        = totalCount > 0 ? (int) Math.round((correctCount * 100.0) / totalCount) : 0;

        // 1. Lưu lịch sử làm bài
        UserGeneralRevisionTaskAttempt attempt = new UserGeneralRevisionTaskAttempt();
        attempt.setUser(user);
        attempt.setTask(task);
        attempt.setCorrectCount(correctCount);
        attempt.setTotalCount(totalCount);
        attempt.setScore(score);
        taskAttemptRepository.save(attempt);

        // 2. Cập nhật topic progress
        updateTopicProgress(user, req.getTopicId(), task.getId());

        // 3. Ghi streak (tạo bản ghi ngày hôm nay nếu chưa có)
        recordStreak(user);

        // 4. Cộng KN (+10 mỗi task, kể cả làm lại)
        addKn(user, KN_PER_TASK);

        // 5. Cộng XP (số câu đúng × 10)
        int xpEarned = correctCount * XP_PER_CORRECT;
        if (xpEarned > 0) {
            addXp(user, xpEarned);
        }

        // 6. Cập nhật leaderboard realtime
        int totalKn = userKnRepository.findByUser(user).map(UserKn::getTotalKn).orElse(0);
        int totalXp = userProfileRepository.findByUser(user)
                .map(p -> p.getTotalXp() == null ? 0 : p.getTotalXp()).orElse(0);
        try {
            leaderboardService.updateRankRealtime(user.getId(), totalKn, totalXp);
        } catch (Exception e) {
            log.warn("Failed to update leaderboard for user {}: {}", user.getId(), e.getMessage());
        }

        int streakCount = userProfileRepository.findByUser(user)
                .map(p -> p.getStreakCount() == null ? 0 : p.getStreakCount()).orElse(0);

        return new SubmitRevisionTaskResponse(KN_PER_TASK, totalKn, streakCount, score);
    }

    // private helpers
    private void updateTopicProgress(User user, Integer topicId, Integer taskId) {
        if (topicId == null) return;

        GeneralRevisionTopic topic = topicRepository.findById(topicId).orElse(null);
        if (topic == null) return;

        UserGeneralRevisionTopicProgress progress = topicProgressRepository
                .findByUserAndTopicId(user, topicId)
                .orElseGet(() -> {
                    UserGeneralRevisionTopicProgress p = new UserGeneralRevisionTopicProgress();
                    p.setUser(user);
                    p.setTopic(topic);
                    p.setCompletedTasks(0);
                    p.setStatus(UserGeneralRevisionTopicProgress.TopicStatus.not_started);
                    return p;
                });

        // Tăng completed_tasks lên chỉ khi đây là lần đầu làm task này
        // (countByUserAndTaskId đã bao gồm lần vừa save → = 1 thì là lần đầu)
        int prevAttemptCount = taskAttemptRepository.countByUserAndTaskId(user, taskId);
        if (prevAttemptCount == 1) {
            int current = progress.getCompletedTasks() == null ? 0 : progress.getCompletedTasks();
            progress.setCompletedTasks(Math.min(current + 1, TOTAL_TASKS_PER_TOPIC));
        }

        // Cập nhật status
        int completed = progress.getCompletedTasks() == null ? 0 : progress.getCompletedTasks();
        if (completed >= TOTAL_TASKS_PER_TOPIC) {
            progress.setStatus(UserGeneralRevisionTopicProgress.TopicStatus.completed);
        } else if (completed > 0) {
            progress.setStatus(UserGeneralRevisionTopicProgress.TopicStatus.in_progress);
        }

        topicProgressRepository.save(progress);
    }

    private void addKn(User user, int amount) {
        UserKn userKn = userKnRepository.findByUser(user).orElseGet(() -> {
            UserKn kn = new UserKn();
            kn.setUser(user);
            kn.setTotalKn(0);
            return kn;
        });
        userKn.setTotalKn(userKn.getTotalKn() + amount);
        userKnRepository.save(userKn);

        // Cộng vào earned_kn của streak hôm nay
        LocalDate today = LocalDate.now();
        userStreakRepository.findByUserAndDate(user, today).ifPresent(streak -> {
            int cur = streak.getEarnedKn() == null ? 0 : streak.getEarnedKn();
            streak.setEarnedKn(cur + amount);
            userStreakRepository.save(streak);
        });
    }

    private void addXp(User user, int amount) {
        userProfileRepository.findByUser(user).ifPresent(profile -> {
            int current = profile.getTotalXp() == null ? 0 : profile.getTotalXp();
            profile.setTotalXp(current + amount);
            userProfileRepository.save(profile);
        });

        LocalDate today = LocalDate.now();
        userStreakRepository.findByUserAndDate(user, today).ifPresent(streak -> {
            int current = streak.getEarnedXp() == null ? 0 : streak.getEarnedXp();
            streak.setEarnedXp(current + amount);
            userStreakRepository.save(streak);
        });
    }

    private void recordStreak(User user) {
        LocalDate today = LocalDate.now();
        if (userStreakRepository.findByUserAndDate(user, today).isPresent()) {
            return; // đã ghi nhận hôm nay rồi
        }

        UserStreak streak = new UserStreak();
        streak.setUser(user);
        streak.setDate(today);
        streak.setEarnedXp(0);
        streak.setEarnedKn(0);
        userStreakRepository.save(streak);

        // Tính streak_count liên tiếp
        int streakCount = 1;
        LocalDate checkDate = today.minusDays(1);
        while (userStreakRepository.findByUserAndDate(user, checkDate).isPresent()) {
            streakCount++;
            checkDate = checkDate.minusDays(1);
        }

        final int finalStreak = streakCount;
        userProfileRepository.findByUser(user).ifPresent(profile -> {
            profile.setStreakCount(finalStreak);
            userProfileRepository.save(profile);
        });
    }
}
