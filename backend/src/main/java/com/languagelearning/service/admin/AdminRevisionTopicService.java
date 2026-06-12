package com.languagelearning.service.admin;

import com.languagelearning.document.GeneralRevisionQuestion;
import com.languagelearning.dto.admin.revision.*;
import com.languagelearning.entity.GeneralRevisionQuestionIndex;
import com.languagelearning.entity.GeneralRevisionTask;
import com.languagelearning.entity.GeneralRevisionTopic;
import com.languagelearning.repository.mongo.GeneralRevisionQuestionRepository;
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
    private final GeneralRevisionQuestionRepository mongoQuestionRepository;

    // ── TOPIC ─────────────────────────────────────────────────────────────────

    /**
     * Danh sách tất cả topic (kể cả inactive) kèm số task và số câu hỏi.
     */
    @Transactional(readOnly = true)
    public List<AdminTopicListItemDto> getAllTopics() {
        List<GeneralRevisionTopic> topics = topicRepository.findAllWithTasks();
        return topics.stream().map(topic -> {
            int taskCount = topic.getTasks() == null ? 0 : topic.getTasks().size();
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
     * Chi tiết 1 topic: thông tin + danh sách task kèm số câu hỏi mỗi task.
     */
    @Transactional(readOnly = true)
    public AdminTopicDetailDto getTopicDetail(Integer topicId) {
        GeneralRevisionTopic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy topic: " + topicId));

        List<GeneralRevisionTask> tasks = taskRepository.findByTopicIdOrderByTaskIndexAsc(topicId);

        Map<Integer, Long> questionCountByTask = taskRepository
                .countQuestionsByTopicGroupByTask(topicId)
                .stream()
                .collect(Collectors.toMap(row -> (Integer) row[0], row -> (Long) row[1]));

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

    /** Tạo topic mới. */
    @Transactional
    public AdminTopicListItemDto createTopic(SaveTopicRequest req) {
        GeneralRevisionTopic topic = new GeneralRevisionTopic();
        topic.setTitle(req.getTitle());
        topic.setDescription(req.getDescription());
        topic.setOrderIndex(req.getOrderIndex() != null ? req.getOrderIndex() : 0);
        topic.setIsActive(req.getIsActive() != null ? req.getIsActive() : true);
        topicRepository.save(topic);

        return AdminTopicListItemDto.builder()
                .id(topic.getId())
                .title(topic.getTitle())
                .description(topic.getDescription())
                .orderIndex(topic.getOrderIndex())
                .isActive(topic.getIsActive())
                .taskCount(0)
                .questionCount(0L)
                .build();
    }

    /** Cập nhật topic. */
    @Transactional
    public AdminTopicListItemDto updateTopic(Integer topicId, SaveTopicRequest req) {
        GeneralRevisionTopic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy topic: " + topicId));

        if (req.getTitle() != null) topic.setTitle(req.getTitle());
        if (req.getDescription() != null) topic.setDescription(req.getDescription());
        if (req.getOrderIndex() != null) topic.setOrderIndex(req.getOrderIndex());
        if (req.getIsActive() != null) topic.setIsActive(req.getIsActive());
        topicRepository.save(topic);

        int taskCount = topic.getTasks() == null ? 0 : topic.getTasks().size();
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
    }

    /** Xóa topic (cascade xóa tasks + question indexes). */
    @Transactional
    public void deleteTopic(Integer topicId) {
        GeneralRevisionTopic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy topic: " + topicId));

        // Xóa question index (MySQL) cho topic này — MongoDB docs giữ lại (orphan)
        List<GeneralRevisionQuestionIndex> indexes = questionIndexRepository.findByTopicIdOrderById(topicId);
        questionIndexRepository.deleteAll(indexes);

        topicRepository.delete(topic);
    }

    /** Reorder topics: nhận danh sách {id, orderIndex} và lưu hàng loạt. */
    @Transactional
    public void reorderTopics(List<ReorderItemRequest> items) {
        for (ReorderItemRequest item : items) {
            topicRepository.findById(item.getId()).ifPresent(t -> {
                t.setOrderIndex(item.getOrderIndex());
                topicRepository.save(t);
            });
        }
    }

    /** Reorder tasks trong 1 topic: nhận danh sách {id, orderIndex}. */
    @Transactional
    public void reorderTasks(Integer topicId, List<ReorderItemRequest> items) {
        for (ReorderItemRequest item : items) {
            taskRepository.findById(item.getId()).ifPresent(t -> {
                if (t.getTopic().getId().equals(topicId)) {
                    t.setTaskIndex(item.getOrderIndex());
                    taskRepository.save(t);
                }
            });
        }
    }

    /** Reorder questions trong 1 task: cập nhật orderIndex trong MongoDB doc. */
    @Transactional
    public void reorderQuestions(Integer topicId, Integer taskId, List<ReorderMongoItemRequest> items) {
        for (ReorderMongoItemRequest item : items) {
            mongoQuestionRepository.findById(item.getMongoId()).ifPresent(doc -> {
                doc.setOrderIndex(item.getOrderIndex());
                mongoQuestionRepository.save(doc);
            });
        }
    }

    // ── TASK ──────────────────────────────────────────────────────────────────

    /** Danh sách task của 1 topic (kèm số câu hỏi). */
    @Transactional(readOnly = true)
    public List<AdminTaskDetailDto> getTasksByTopic(Integer topicId) {
        if (!topicRepository.existsById(topicId)) {
            throw new IllegalArgumentException("Không tìm thấy topic: " + topicId);
        }
        List<GeneralRevisionTask> tasks = taskRepository.findByTopicIdOrderByTaskIndexAsc(topicId);
        Map<Integer, Long> qCount = taskRepository.countQuestionsByTopicGroupByTask(topicId)
                .stream()
                .collect(Collectors.toMap(r -> (Integer) r[0], r -> (Long) r[1]));

        return tasks.stream().map(t -> AdminTaskDetailDto.builder()
                .id(t.getId())
                .taskIndex(t.getTaskIndex())
                .taskLabel(t.getTaskLabel())
                .questionType(t.getQuestionType())
                .description(t.getDescription())
                .questionCount(qCount.getOrDefault(t.getId(), 0L))
                .build()
        ).collect(Collectors.toList());
    }

    /** Chi tiết 1 task. */
    @Transactional(readOnly = true)
    public AdminTaskDetailDto getTaskDetail(Integer topicId, Integer taskId) {
        GeneralRevisionTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy task: " + taskId));
        if (!task.getTopic().getId().equals(topicId)) {
            throw new IllegalArgumentException("Task không thuộc topic: " + topicId);
        }
        long qCount = questionIndexRepository.countByTaskId(taskId);
        return AdminTaskDetailDto.builder()
                .id(task.getId())
                .taskIndex(task.getTaskIndex())
                .taskLabel(task.getTaskLabel())
                .questionType(task.getQuestionType())
                .description(task.getDescription())
                .questionCount(qCount)
                .build();
    }

    /** Tạo task mới trong topic. */
    @Transactional
    public AdminTaskDetailDto createTask(Integer topicId, SaveTaskRequest req) {
        GeneralRevisionTopic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy topic: " + topicId));

        // taskIndex tự động nếu không truyền
        int nextIndex = req.getTaskIndex() != null ? req.getTaskIndex()
                : taskRepository.findByTopicIdOrderByTaskIndexAsc(topicId).size() + 1;

        GeneralRevisionTask task = new GeneralRevisionTask();
        task.setTopic(topic);
        task.setTaskIndex(nextIndex);
        task.setTaskLabel(req.getTaskLabel());
        task.setQuestionType(req.getQuestionType());
        task.setDescription(req.getDescription());
        taskRepository.save(task);

        return AdminTaskDetailDto.builder()
                .id(task.getId())
                .taskIndex(task.getTaskIndex())
                .taskLabel(task.getTaskLabel())
                .questionType(task.getQuestionType())
                .description(task.getDescription())
                .questionCount(0L)
                .build();
    }

    /** Cập nhật task. */
    @Transactional
    public AdminTaskDetailDto updateTask(Integer topicId, Integer taskId, SaveTaskRequest req) {
        GeneralRevisionTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy task: " + taskId));
        if (!task.getTopic().getId().equals(topicId)) {
            throw new IllegalArgumentException("Task không thuộc topic: " + topicId);
        }

        if (req.getTaskLabel() != null) task.setTaskLabel(req.getTaskLabel());
        if (req.getQuestionType() != null) task.setQuestionType(req.getQuestionType());
        if (req.getDescription() != null) task.setDescription(req.getDescription());
        if (req.getTaskIndex() != null) task.setTaskIndex(req.getTaskIndex());
        taskRepository.save(task);

        long qCount = questionIndexRepository.countByTaskId(taskId);
        return AdminTaskDetailDto.builder()
                .id(task.getId())
                .taskIndex(task.getTaskIndex())
                .taskLabel(task.getTaskLabel())
                .questionType(task.getQuestionType())
                .description(task.getDescription())
                .questionCount(qCount)
                .build();
    }

    /** Xóa task (cascade xóa question indexes; MongoDB docs giữ lại). */
    @Transactional
    public void deleteTask(Integer topicId, Integer taskId) {
        GeneralRevisionTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy task: " + taskId));
        if (!task.getTopic().getId().equals(topicId)) {
            throw new IllegalArgumentException("Task không thuộc topic: " + topicId);
        }
        List<GeneralRevisionQuestionIndex> indexes = questionIndexRepository.findByTaskIdOrderById(taskId);
        questionIndexRepository.deleteAll(indexes);
        taskRepository.delete(task);
    }

    // ── QUESTION ──────────────────────────────────────────────────────────────

    /** Danh sách câu hỏi (MySQL + MongoDB) của 1 task. */
    @Transactional(readOnly = true)
    public List<AdminQuestionDto> getQuestionsByTask(Integer topicId, Integer taskId) {
        List<GeneralRevisionQuestionIndex> indexes =
                questionIndexRepository.findByTopicIdAndTaskIdOrderById(topicId, taskId);

        if (indexes.isEmpty()) return List.of();

        List<String> mongoIds = indexes.stream()
                .map(GeneralRevisionQuestionIndex::getMongoQuestionId)
                .collect(Collectors.toList());

        Map<String, GeneralRevisionQuestion> mongoMap = mongoQuestionRepository.findAllById(mongoIds)
                .stream()
                .collect(Collectors.toMap(GeneralRevisionQuestion::getId, q -> q));

        return indexes.stream()
                .map(idx -> toAdminQuestionDto(idx, mongoMap.get(idx.getMongoQuestionId())))
                .collect(Collectors.toList());
    }

    /** Xem chi tiết 1 câu hỏi (theo mongoId). */
    @Transactional(readOnly = true)
    public AdminQuestionDto getQuestion(Integer topicId, Integer taskId, String mongoId) {
        GeneralRevisionQuestionIndex idx = questionIndexRepository.findByMongoQuestionId(mongoId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy câu hỏi: " + mongoId));
        if (!idx.getTopicId().equals(topicId) || !idx.getTaskId().equals(taskId)) {
            throw new IllegalArgumentException("Câu hỏi không thuộc task/topic đã chỉ định");
        }
        GeneralRevisionQuestion mongoDoc = mongoQuestionRepository.findById(mongoId).orElse(null);
        return toAdminQuestionDto(idx, mongoDoc);
    }

    /**
     * Tạo câu hỏi mới: insert vào MongoDB → lấy id → insert vào MySQL index.
     */
    @Transactional
    public AdminQuestionDto createQuestion(Integer topicId, Integer taskId, SaveQuestionRequest req) {
        // 1. Tạo MongoDB document
        GeneralRevisionQuestion mongoDoc = buildMongoDocument(req);
        mongoQuestionRepository.save(mongoDoc);  // MongoDB id được gen

        // 2. Tạo MySQL index
        GeneralRevisionQuestionIndex idx = new GeneralRevisionQuestionIndex();
        idx.setMongoQuestionId(mongoDoc.getId());
        idx.setTopicId(topicId);
        idx.setTaskId(taskId);
        idx.setQuestionType(req.getQuestionType());
        idx.setCorrectAnswer(req.getCorrectAnswer());
        questionIndexRepository.save(idx);

        return toAdminQuestionDto(idx, mongoDoc);
    }

    /**
     * Cập nhật câu hỏi: update MongoDB doc + correct_answer trong MySQL.
     */
    @Transactional
    public AdminQuestionDto updateQuestion(Integer topicId, Integer taskId,
                                           String mongoId, SaveQuestionRequest req) {
        GeneralRevisionQuestionIndex idx = questionIndexRepository.findByMongoQuestionId(mongoId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy câu hỏi: " + mongoId));
        if (!idx.getTopicId().equals(topicId) || !idx.getTaskId().equals(taskId)) {
            throw new IllegalArgumentException("Câu hỏi không thuộc task/topic đã chỉ định");
        }

        // Cập nhật MongoDB
        GeneralRevisionQuestion mongoDoc = mongoQuestionRepository.findById(mongoId)
                .orElseGet(() -> new GeneralRevisionQuestion());
        applyToMongoDocument(mongoDoc, req);
        mongoQuestionRepository.save(mongoDoc);

        // Cập nhật MySQL index
        if (req.getQuestionType() != null) idx.setQuestionType(req.getQuestionType());
        if (req.getCorrectAnswer() != null) idx.setCorrectAnswer(req.getCorrectAnswer());
        questionIndexRepository.save(idx);

        return toAdminQuestionDto(idx, mongoDoc);
    }

    /**
     * Xóa câu hỏi: xóa MongoDB doc + MySQL index.
     */
    @Transactional
    public void deleteQuestion(Integer topicId, Integer taskId, String mongoId) {
        GeneralRevisionQuestionIndex idx = questionIndexRepository.findByMongoQuestionId(mongoId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy câu hỏi: " + mongoId));
        if (!idx.getTopicId().equals(topicId) || !idx.getTaskId().equals(taskId)) {
            throw new IllegalArgumentException("Câu hỏi không thuộc task/topic đã chỉ định");
        }
        mongoQuestionRepository.deleteById(mongoId);
        questionIndexRepository.delete(idx);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private GeneralRevisionQuestion buildMongoDocument(SaveQuestionRequest req) {
        GeneralRevisionQuestion doc = new GeneralRevisionQuestion();
        applyToMongoDocument(doc, req);
        return doc;
    }

    private void applyToMongoDocument(GeneralRevisionQuestion doc, SaveQuestionRequest req) {
        doc.setQuestionType(req.getQuestionType());
        doc.setOrderIndex(req.getOrderIndex());
        doc.setImageUrl(req.getImageUrl());
        doc.setQuestionText(req.getQuestionText());
        doc.setSentence(req.getSentence());
        doc.setPairs(req.getPairs());
        doc.setCategories(req.getCategories());
        doc.setImages(req.getImages());

        if (req.getAudioUrl() != null) {
            GeneralRevisionQuestion.Metadata meta = new GeneralRevisionQuestion.Metadata();
            meta.setAudioUrl(req.getAudioUrl());
            doc.setMetadata(meta);
        } else {
            doc.setMetadata(null);
        }
    }

    private AdminQuestionDto toAdminQuestionDto(GeneralRevisionQuestionIndex idx,
                                                GeneralRevisionQuestion mongoDoc) {
        AdminQuestionDto.AdminQuestionDtoBuilder b = AdminQuestionDto.builder()
                .indexId(idx.getId())
                .mongoId(idx.getMongoQuestionId())
                .topicId(idx.getTopicId())
                .taskId(idx.getTaskId())
                .questionType(idx.getQuestionType())
                .correctAnswer(idx.getCorrectAnswer());

        if (mongoDoc != null) {
            b.orderIndex(mongoDoc.getOrderIndex())
             .imageUrl(mongoDoc.getImageUrl())
             .questionText(mongoDoc.getQuestionText())
             .sentence(mongoDoc.getSentence())
             .pairs(mongoDoc.getPairs())
             .categories(mongoDoc.getCategories())
             .images(mongoDoc.getImages());

            if (mongoDoc.getMetadata() != null) {
                b.audioUrl(mongoDoc.getMetadata().getAudioUrl());
            }
        }
        return b.build();
    }
}
