package com.languagelearning.service.admin;

import com.languagelearning.dto.admin.general_revision.*;
import com.languagelearning.entity.*;
import com.languagelearning.repository.mysql.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service("adminGeneralRevisionProgressService")
@RequiredArgsConstructor
public class GeneralRevisionProgressService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserGeneralRevisionTopicProgressRepository topicProgressRepository;
    private final UserGeneralRevisionTaskAttemptRepository taskAttemptRepository;
    private final GeneralRevisionTopicRepository topicRepository;
    private final GeneralRevisionTaskRepository taskRepository;

    /**
     * Danh sách tóm tắt tiến trình ôn tập của tất cả user (có phân trang).
     */
    @Transactional(readOnly = true)
    public Page<GeneralRevisionProgressSummaryDto> getSummaryList(int page, int size, String search) {
        List<User> allUsers = userRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));

        // Lọc theo search (email hoặc tên)
        if (search != null && !search.isBlank()) {
            String q = search.toLowerCase();
            allUsers = allUsers.stream()
                    .filter(u -> u.getEmail().toLowerCase().contains(q) ||
                            userProfileRepository.findByUserId(u.getId())
                                    .map(p -> p.getFullName() != null && p.getFullName().toLowerCase().contains(q))
                                    .orElse(false))
                    .collect(Collectors.toList());
        }

        int total = allUsers.size();
        int from = page * size;
        int to = Math.min(from + size, total);
        List<User> pageUsers = from >= total ? List.of() : allUsers.subList(from, to);

        // Tổng số topic active
        int totalTopics = (int) topicRepository.findAllActiveWithTasks().stream().count();

        List<GeneralRevisionProgressSummaryDto> dtos = pageUsers.stream()
                .map(u -> toSummary(u, totalTopics))
                .collect(Collectors.toList());

        return new PageImpl<>(dtos, PageRequest.of(page, size), total);
    }

    /**
     * Chi tiết tiến trình ôn tập của một user (tất cả topic + task attempts).
     */
    @Transactional(readOnly = true)
    public GeneralRevisionProgressDetailDto getDetail(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        Optional<UserProfile> profileOpt = userProfileRepository.findByUserId(userId);

        // Lấy tất cả topic active kèm tasks
        List<GeneralRevisionTopic> allTopics = topicRepository.findAllActiveWithTasks();
        int totalTopics = allTopics.size();

        // Map topic progress theo topicId
        Map<Integer, UserGeneralRevisionTopicProgress> progressMap =
                topicProgressRepository.findByUser(user).stream()
                        .filter(p -> p.getTopic() != null)
                        .collect(Collectors.toMap(
                                p -> p.getTopic().getId(),
                                p -> p,
                                (a, b) -> a));

        // Map attempt summary theo taskId: [count, maxScore, lastAttemptAt]
        Map<Integer, Object[]> attemptSummaryMap = buildAttemptSummaryMap(user);
        // Map lastScore theo taskId
        Map<Integer, Integer> lastScoreMap = buildLastScoreMap(user);

        int completedTopics = 0;
        long totalAttempts = taskAttemptRepository.countTotalAttemptsByUser(user);

        List<TopicProgressDetailDto> topicDtos = new ArrayList<>();

        for (GeneralRevisionTopic topic : allTopics) {
            UserGeneralRevisionTopicProgress tp = progressMap.get(topic.getId());
            int completedTasks = tp != null ? tp.getCompletedTasks() : 0;
            String status = tp != null ? tp.getStatus().name() : UserGeneralRevisionTopicProgress.TopicStatus.not_started.name();
            LocalDateTime updatedAt = tp != null ? tp.getUpdatedAt() : null;

            if (tp != null && tp.getStatus() == UserGeneralRevisionTopicProgress.TopicStatus.completed) {
                completedTopics++;
            }

            // Build task attempt summaries
            List<TaskAttemptSummaryDto> taskDtos = topic.getTasks().stream()
                    .map(task -> {
                        Object[] summary = attemptSummaryMap.get(task.getId());
                        long attemptCount = summary != null ? (Long) summary[0] : 0L;
                        Integer bestScore = summary != null ? ((Number) summary[1]).intValue() : null;
                        Integer lastScore = lastScoreMap.get(task.getId());
                        LocalDateTime lastAttemptAt = summary != null ? (LocalDateTime) summary[2] : null;

                        return TaskAttemptSummaryDto.builder()
                                .taskId(task.getId())
                                .taskLabel(task.getTaskLabel())
                                .questionType(task.getQuestionType())
                                .attemptCount(attemptCount)
                                .bestScore(bestScore)
                                .lastScore(lastScore)
                                .lastAttemptAt(lastAttemptAt)
                                .build();
                    })
                    .collect(Collectors.toList());

            topicDtos.add(TopicProgressDetailDto.builder()
                    .topicId(topic.getId())
                    .title(topic.getTitle())
                    .description(topic.getDescription())
                    .completedTasks(completedTasks)
                    .status(status)
                    .updatedAt(updatedAt)
                    .tasks(taskDtos)
                    .build());
        }

        // Tính progressLabel
        String progressLabel = buildProgressLabel(completedTopics, totalTopics);

        return GeneralRevisionProgressDetailDto.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(profileOpt.map(UserProfile::getFullName).orElse(null))
                .avatarUrl(profileOpt.map(UserProfile::getAvatarUrl).orElse(null))
                .completedTopics(completedTopics)
                .totalTopics(totalTopics)
                .totalAttempts((int) totalAttempts)
                .progressLabel(progressLabel)
                .topics(topicDtos)
                .build();
    }

    // Private helpers

    private GeneralRevisionProgressSummaryDto toSummary(User user, int totalTopics) {
        Optional<UserProfile> profileOpt = userProfileRepository.findByUserId(user.getId());

        List<UserGeneralRevisionTopicProgress> progresses = topicProgressRepository.findByUser(user);
        int completedTopics = (int) progresses.stream()
                .filter(p -> p.getStatus() == UserGeneralRevisionTopicProgress.TopicStatus.completed)
                .count();

        long totalAttempts = taskAttemptRepository.countTotalAttemptsByUser(user);
        String progressLabel = buildProgressLabel(completedTopics, totalTopics);

        return GeneralRevisionProgressSummaryDto.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(profileOpt.map(UserProfile::getFullName).orElse(null))
                .avatarUrl(profileOpt.map(UserProfile::getAvatarUrl).orElse(null))
                .completedTopics(completedTopics)
                .totalTopics(totalTopics)
                .totalAttempts((int) totalAttempts)
                .progressLabel(progressLabel)
                .build();
    }

    /**
     * Build map taskId → [count, maxScore, lastAttemptAt] từ query tổng hợp.
     */
    private Map<Integer, Object[]> buildAttemptSummaryMap(User user) {
        List<Object[]> rows = taskAttemptRepository.findAttemptSummaryRawByUser(user);
        Map<Integer, Object[]> map = new HashMap<>();
        for (Object[] row : rows) {
            Integer taskId = (Integer) row[0];
            Long count = (Long) row[1];
            Integer maxScore = row[2] != null ? ((Number) row[2]).intValue() : null;
            LocalDateTime lastAt = (LocalDateTime) row[3];
            map.put(taskId, new Object[]{count, maxScore, lastAt});
        }
        return map;
    }

    /**
     * Build map taskId → lastScore từ query lastScore.
     */
    private Map<Integer, Integer> buildLastScoreMap(User user) {
        List<Object[]> rows = taskAttemptRepository.findLastScoreByUserGroupedByTask(user);
        Map<Integer, Integer> map = new HashMap<>();
        for (Object[] row : rows) {
            Integer taskId = (Integer) row[0];
            Integer score = row[1] != null ? ((Number) row[1]).intValue() : null;
            map.put(taskId, score);
        }
        return map;
    }

    private String buildProgressLabel(int completedTopics, int totalTopics) {
        if (totalTopics == 0) return null;
        if (completedTopics == 0) return "Chưa bắt đầu";
        if (completedTopics == totalTopics) return "Hoàn thành " + totalTopics + "/" + totalTopics;
        return "Topic " + completedTopics + "/" + totalTopics;
    }
}
