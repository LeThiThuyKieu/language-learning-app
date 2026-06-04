package com.languagelearning.service.general_revision;

import com.languagelearning.document.GeneralRevisionQuestion;
import com.languagelearning.dto.general_revision.RevisionQuestionDto;
import com.languagelearning.dto.general_revision.RevisionTaskDto;
import com.languagelearning.dto.general_revision.RevisionTopicDto;
import com.languagelearning.entity.GeneralRevisionQuestionIndex;
import com.languagelearning.entity.GeneralRevisionTask;
import com.languagelearning.entity.GeneralRevisionTopic;
import com.languagelearning.repository.mongo.GeneralRevisionQuestionRepository;
import com.languagelearning.repository.mysql.GeneralRevisionQuestionIndexRepository;
import com.languagelearning.repository.mysql.GeneralRevisionTopicRepository;
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

    /** Lấy danh sách tất cả topic đang active kèm tasks */
    public List<RevisionTopicDto> getAllTopics() {
        List<GeneralRevisionTopic> topics = topicRepository.findAllActiveWithTasks();
        return topics.stream().map(this::toDto).collect(Collectors.toList());
    }

    /**
     * Lấy danh sách câu hỏi theo task_id.
     * 1. Query SQL để lấy list mongo_question_id + correct_answer + metadata
     * 2. Query MongoDB để lấy content (image_url, question_text, distractors, v.v.)
     * 3. Merge 2 nguồn dữ liệu
     */
    public List<RevisionQuestionDto> getQuestionsByTask(Integer taskId) {
        // 1. Lấy index từ SQL (có mongo_question_id, topic_id, task_id, correct_answer)
        List<GeneralRevisionQuestionIndex> indexes = 
                questionIndexRepository.findByTaskIdOrderById(taskId);

        if (indexes.isEmpty()) {
            return List.of();
        }

        // 2. Lấy mongo_question_id list
        List<String> mongoIds = indexes.stream()
                .map(GeneralRevisionQuestionIndex::getMongoQuestionId)
                .collect(Collectors.toList());

        // 3. Batch load từ MongoDB
        List<GeneralRevisionQuestion> mongoDocs = questionRepository.findAllById(mongoIds);

        // 4. Tạo map để lookup nhanh
        Map<String, GeneralRevisionQuestion> mongoMap = mongoDocs.stream()
                .collect(Collectors.toMap(GeneralRevisionQuestion::getId, q -> q));

        // 5. Merge và trả về
        return indexes.stream()
                .map(index -> {
                    GeneralRevisionQuestion mongoDoc = mongoMap.get(index.getMongoQuestionId());
                    return toQuestionDto(index, mongoDoc);
                })
                .collect(Collectors.toList());
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

    /**
     * Merge dữ liệu từ SQL Index và MongoDB Document
     */
    private RevisionQuestionDto toQuestionDto(
            GeneralRevisionQuestionIndex index, 
            GeneralRevisionQuestion mongoDoc) {
        
        RevisionQuestionDto dto = new RevisionQuestionDto();
        
        // Từ SQL Index
        dto.setQuestionId(mongoDoc != null ? mongoDoc.getId() : index.getMongoQuestionId());
        dto.setTopicId(index.getTopicId());
        dto.setTaskId(index.getTaskId());
        dto.setQuestionType(index.getQuestionType());
        dto.setCorrectAnswer(index.getCorrectAnswer()); // ← QUAN TRỌNG: từ SQL
        
        // Từ MongoDB (nếu có)
        if (mongoDoc != null) {
            dto.setOrderIndex(mongoDoc.getOrderIndex());
            
            // VOCAB_IMAGE
            dto.setImageUrl(mongoDoc.getImageUrl());
            
            // LISTENING
            dto.setQuestionText(mongoDoc.getQuestionText());
            dto.setDistractors(mongoDoc.getDistractors());
            dto.setExplanation(mongoDoc.getExplanation());
            
            // SPEAKING
            dto.setPromptText(mongoDoc.getPromptText());
            dto.setExpectedKeywords(mongoDoc.getExpectedKeywords());
            
            // MATCHING
            dto.setPairs(mongoDoc.getPairs());
            
            // Metadata
            if (mongoDoc.getMetadata() != null) {
                dto.setAudioUrl(mongoDoc.getMetadata().getAudioUrl());
                dto.setTranscript(mongoDoc.getMetadata().getTranscript());
            }
        }
        
        return dto;
    }
}
