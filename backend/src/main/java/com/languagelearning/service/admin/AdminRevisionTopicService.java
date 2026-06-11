package com.languagelearning.service.admin;

import com.languagelearning.dto.admin.revision.AdminTaskDetailDto;
import com.languagelearning.dto.admin.revision.AdminTopicDetailDto;
import com.languagelearning.dto.admin.revision.AdminTopicListItemDto;
import com.languagelearning.entity.GeneralRevisionTask;
import com.languagelearning.entity.GeneralRevisionTopic;
import com.languagelearning.repository.mysql.GeneralRevisionQuestionIndexRepository;
import com.languagelearning.repository.mysql.GeneralRevisionTaskRepository;
import com.languagelearning.repository.mysql.GeneralRevisionTopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminRevisionTopicService {

    private final GeneralRevisionTopicRepository topicRepository;
    private final GeneralRevisionTaskRepository taskRepository;
    private final GeneralRevisionQuestionIndexRepository questionIndexRepository;

    /**
     * Danh sách tất cả topic (kể cả inactive) kèm số task và số câu hỏi.
     * Dùng cho trang TopicManagement.
     */
    @Transactional(readOnly = true)
    public List<AdminTopicListItemDto> getAllTopics() {
        List<GeneralRevisionTopic> topics = topicRepository.findAllWithTasks();

        return topics.stream().map(topic -> {
            int taskCount = topic.getTasks() == null ? 0 : topic.getTasks().size();

            // Đếm tổng câu hỏi của topic từ question index
            long questionCount = questionIndexRepository.countByTopicId(topic.getId());

            return AdminTopicListItemDto.builder()
                    .id(topic.getId())
                    .title(topic.getTitle())
                    .description(topic.getDescription())
                    .orderIndex(topic.getOrderIndex())
                    .isActive(topic.getIsActive())
                    .taskCount(taskCount)
                    .questionCount(questionCount)
                    .build();
        }).collect(Collectors.toList());
    }

    /**
     * Chi tiết 1 topic: thông tin topic + danh sách task kèm số câu hỏi mỗi task.
     * Dùng cho trang TopicDetail.
     */
    @Transactional(readOnly = true)
    public AdminTopicDetailDto getTopicDetail(Integer topicId) {
        GeneralRevisionTopic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy topic: " + topicId));

        // Lấy tasks sắp xếp theo taskIndex
        List<GeneralRevisionTask> tasks = taskRepository.findByTopicIdOrderByTaskIndexAsc(topicId);

        // Đếm câu hỏi theo từng task của topic này
        Map<Integer, Long> questionCountByTask = taskRepository
                .countQuestionsByTopicGroupByTask(topicId)
                .stream()
                .collect(Collectors.toMap(
                        row -> (Integer) row[0],
                        row -> (Long) row[1]
                ));

        long totalQuestions = questionCountByTask.values().stream().mapToLong(Long::longValue).sum();

        List<AdminTaskDetailDto> taskDtos = tasks.stream().map(task ->
                AdminTaskDetailDto.builder()
                        .id(task.getId())
                        .taskIndex(task.getTaskIndex())
                        .taskLabel(task.getTaskLabel())
                        .questionType(task.getQuestionType())
                        .description(task.getDescription())
                        .questionCount(questionCountByTask.getOrDefault(task.getId(), 0L))
                        .build()
        ).collect(Collectors.toList());

        return AdminTopicDetailDto.builder()
                .id(topic.getId())
                .title(topic.getTitle())
                .description(topic.getDescription())
                .orderIndex(topic.getOrderIndex())
                .isActive(topic.getIsActive())
                .totalQuestions(totalQuestions)
                .tasks(taskDtos)
                .build();
    }
}
