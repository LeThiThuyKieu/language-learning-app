package com.languagelearning.service;

import com.languagelearning.document.GeneralRevisionQuestion;
import com.languagelearning.dto.general_revision.RevisionQuestionDto;
import com.languagelearning.dto.general_revision.RevisionTaskDto;
import com.languagelearning.dto.general_revision.RevisionTopicDto;
import com.languagelearning.entity.GeneralRevisionTask;
import com.languagelearning.entity.GeneralRevisionTopic;
import com.languagelearning.repository.mongo.GeneralRevisionQuestionRepository;
import com.languagelearning.repository.mysql.GeneralRevisionTopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GeneralRevisionService {

    private final GeneralRevisionTopicRepository topicRepository;
    private final GeneralRevisionQuestionRepository questionRepository;

    /** Lấy danh sách tất cả topic đang active kèm tasks */
    public List<RevisionTopicDto> getAllTopics() {
        List<GeneralRevisionTopic> topics = topicRepository.findAllActiveWithTasks();
        return topics.stream().map(this::toDto).collect(Collectors.toList());
    }

    /** Lấy danh sách câu hỏi theo task_id từ MongoDB */
    public List<RevisionQuestionDto> getQuestionsByTask(Integer taskId) {
        List<GeneralRevisionQuestion> docs =
                questionRepository.findByTaskIdOrderByOrderIndexAsc(taskId);
        return docs.stream().map(this::toQuestionDto).collect(Collectors.toList());
    }

    // Mappers

    private RevisionTopicDto toDto(GeneralRevisionTopic topic) {
        List<RevisionTaskDto> taskDtos = topic.getTasks().stream()
                .map(this::toTaskDto)
                .collect(Collectors.toList());
        RevisionTopicDto dto = new RevisionTopicDto();
        dto.setTopicId(topic.getId());
        dto.setTitle(topic.getTitle());
        dto.setDescription(topic.getDescription());
        dto.setOrderIndex(topic.getOrderIndex());
        dto.setTasks(taskDtos);
        dto.setCompletedTasks(0);
        return dto;
    }

    private RevisionTaskDto toTaskDto(GeneralRevisionTask task) {
        RevisionTaskDto dto = new RevisionTaskDto();
        dto.setTaskId(task.getId());
        dto.setTaskIndex(task.getTaskIndex());
        dto.setTaskLabel(task.getTaskLabel());
        dto.setQuestionType(task.getQuestionType());
        dto.setDescription(task.getDescription());
        dto.setAttemptCount(0);
        dto.setCompleted(false);
        return dto;
    }

    private RevisionQuestionDto toQuestionDto(GeneralRevisionQuestion q) {
        RevisionQuestionDto dto = new RevisionQuestionDto();
        dto.setQuestionId(q.getId());
        dto.setTopicId(q.getTopicId());
        dto.setTaskId(q.getTaskId());
        dto.setQuestionType(q.getQuestionType());
        dto.setOrderIndex(q.getOrderIndex());
        // VOCAB_IMAGE
        dto.setImageUrl(q.getImageUrl());
        dto.setCorrectAnswer(q.getCorrectAnswer());
        // LISTENING
        dto.setQuestionText(q.getQuestionText());
        dto.setDistractors(q.getDistractors());
        dto.setExplanation(q.getExplanation());
        // SPEAKING
        dto.setPromptText(q.getPromptText());
        dto.setExpectedKeywords(q.getExpectedKeywords());
        // MATCHING
        dto.setPairs(q.getPairs());
        // Metadata
        if (q.getMetadata() != null) {
            dto.setAudioUrl(q.getMetadata().getAudioUrl());
            dto.setTranscript(q.getMetadata().getTranscript());
        }
        return dto;
    }
}
