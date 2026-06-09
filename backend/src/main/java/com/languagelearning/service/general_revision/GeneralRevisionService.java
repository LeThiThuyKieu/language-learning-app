package com.languagelearning.service.general_revision;

import com.languagelearning.document.GeneralRevisionQuestion;
import com.languagelearning.dto.general_revision.RevisionQuestionDto;
import com.languagelearning.dto.general_revision.RevisionTaskDto;
import com.languagelearning.dto.general_revision.RevisionTopicDto;
import com.languagelearning.entity.GeneralRevisionQuestionIndex;
import com.languagelearning.entity.GeneralRevisionTask;
import com.languagelearning.entity.GeneralRevisionTopic;
import com.languagelearning.entity.User;
import com.languagelearning.repository.mongo.GeneralRevisionQuestionRepository;
import com.languagelearning.repository.mysql.GeneralRevisionQuestionIndexRepository;
import com.languagelearning.repository.mysql.GeneralRevisionTopicRepository;
import com.languagelearning.repository.mysql.UserGeneralRevisionTaskAttemptRepository;
import com.languagelearning.repository.mysql.UserGeneralRevisionTopicProgressRepository;
import com.languagelearning.repository.mysql.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GeneralRevisionService {

    private final GeneralRevisionTopicRepository topicRepository;
    private final GeneralRevisionQuestionIndexRepository questionIndexRepository;
    private final GeneralRevisionQuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final UserGeneralRevisionTopicProgressRepository topicProgressRepository;
    private final UserGeneralRevisionTaskAttemptRepository taskAttemptRepository;

    /** Lấy tất cả topic kèm user progress */
    public List<RevisionTopicDto> getAllTopicsWithProgress(String email) {
        List<GeneralRevisionTopic> topics = topicRepository.findAllActiveWithTasks();

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return topics.stream().map(t -> toDto(t, null, null)).collect(Collectors.toList());
        }

        Map<Integer, Integer> completedMap = null;
        Map<Integer, Long> attemptCountMap = null;

        try {
            completedMap = topicProgressRepository.findByUser(user)
                    .stream()
                    .collect(Collectors.toMap(
                            p -> p.getTopic().getId(),
                            p -> p.getCompletedTasks() == null ? 0 : p.getCompletedTasks()
                    ));
        } catch (Exception e) {
            // Bảng chưa tạo hoặc lỗi khác — trả về không có progress
        }

        try {
            attemptCountMap = taskAttemptRepository.countAttemptsGroupedByTaskForUser(user);
        } catch (Exception e) {
            // Bảng chưa tạo hoặc lỗi khác — trả về không có progress
        }

        final Map<Integer, Integer> finalCompletedMap = completedMap;
        final Map<Integer, Long> finalAttemptCountMap = attemptCountMap;

        return topics.stream()
                .map(t -> toDto(t, finalCompletedMap, finalAttemptCountMap))
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách câu hỏi theo task_id.
     */
    public List<RevisionQuestionDto> getQuestionsByTask(Integer taskId) {
        List<GeneralRevisionQuestionIndex> indexes =
                questionIndexRepository.findByTaskIdOrderById(taskId);

        if (indexes.isEmpty()) {
            return List.of();
        }

        List<String> mongoIds = indexes.stream()
                .map(GeneralRevisionQuestionIndex::getMongoQuestionId)
                .collect(Collectors.toList());

        List<GeneralRevisionQuestion> mongoDocs = questionRepository.findAllById(mongoIds);

        Map<String, GeneralRevisionQuestion> mongoMap = mongoDocs.stream()
                .collect(Collectors.toMap(GeneralRevisionQuestion::getId, q -> q));

        return indexes.stream()
                .map(index -> {
                    GeneralRevisionQuestion mongoDoc = mongoMap.get(index.getMongoQuestionId());
                    return toQuestionDto(index, mongoDoc);
                })
                .collect(Collectors.toList());
    }

    // Mappers

    private RevisionTopicDto toDto(
            GeneralRevisionTopic topic,
            Map<Integer, Integer> completedMap,
            Map<Integer, Long> attemptCountMap) {

        int completedTasks = completedMap != null
                ? completedMap.getOrDefault(topic.getId(), 0)
                : 0;

        List<RevisionTaskDto> taskDtos = topic.getTasks().stream()
                .map(task -> toTaskDto(task, attemptCountMap))
                .collect(Collectors.toList());

        RevisionTopicDto dto = new RevisionTopicDto();
        dto.setTopicId(topic.getId());
        dto.setTitle(topic.getTitle());
        dto.setDescription(topic.getDescription());
        dto.setOrderIndex(topic.getOrderIndex());
        dto.setTasks(taskDtos);
        dto.setCompletedTasks(completedTasks);
        return dto;
    }

    private RevisionTaskDto toTaskDto(GeneralRevisionTask task, Map<Integer, Long> attemptCountMap) {
        long count = attemptCountMap != null
                ? attemptCountMap.getOrDefault(task.getId(), 0L)
                : 0L;

        RevisionTaskDto dto = new RevisionTaskDto();
        dto.setTaskId(task.getId());
        dto.setTaskIndex(task.getTaskIndex());
        dto.setTaskLabel(task.getTaskLabel());
        dto.setQuestionType(task.getQuestionType());
        dto.setDescription(task.getDescription());
        dto.setAttemptCount((int) count);
        // completed = đã làm ít nhất 1 lần (vẫn cho làm lại)
        dto.setCompleted(count > 0);
        return dto;
    }

    private RevisionQuestionDto toQuestionDto(
            GeneralRevisionQuestionIndex index,
            GeneralRevisionQuestion mongoDoc) {

        RevisionQuestionDto dto = new RevisionQuestionDto();

        dto.setQuestionId(mongoDoc != null ? mongoDoc.getId() : index.getMongoQuestionId());
        dto.setTopicId(index.getTopicId());
        dto.setTaskId(index.getTaskId());
        dto.setQuestionType(index.getQuestionType());
        dto.setCorrectAnswer(index.getCorrectAnswer());

        if (mongoDoc != null) {
            dto.setOrderIndex(mongoDoc.getOrderIndex());
            dto.setImageUrl(mongoDoc.getImageUrl());
            dto.setQuestionText(mongoDoc.getQuestionText());
            dto.setPairs(mongoDoc.getPairs());
            dto.setCategories(mongoDoc.getCategories());
            dto.setImages(mongoDoc.getImages());

            if (mongoDoc.getMetadata() != null) {
                dto.setAudioUrl(mongoDoc.getMetadata().getAudioUrl());
            }
        }

        return dto;
    }
}
