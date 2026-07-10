package com.languagelearning.service.admin;

import com.languagelearning.document.ExamQuestion;
import com.languagelearning.dto.admin.exam_management.ExamQuestionDetailDto;
import com.languagelearning.dto.admin.exam_management.ExamQuestionSaveRequest;
import com.languagelearning.entity.ExamPart;
import com.languagelearning.entity.ExamQuestionIndex;
import com.languagelearning.repository.mongo.ExamQuestionRepository;
import com.languagelearning.repository.mysql.ExamPartRepository;
import com.languagelearning.repository.mysql.ExamQuestionIndexRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AdminExamQuestionService {

    private final ExamQuestionIndexRepository questionIndexRepository;
    private final ExamQuestionRepository examQuestionRepository;
    private final ExamPartRepository examPartRepository;

    // ── GET detail ─────────────────────────────────────────────────────────

    /**
     * Lấy chi tiết 1 câu hỏi (kết hợp MySQL + MongoDB).
     * Chỉ cho LISTENING và READING_WRITING.
     */
    @Transactional(readOnly = true)
    public ExamQuestionDetailDto getDetail(Long questionIndexId) {
        ExamQuestionIndex index = questionIndexRepository.findById(questionIndexId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Câu hỏi không tồn tại"));

        ExamQuestion mongoDoc = examQuestionRepository.findById(index.getMongoDocId())
                .orElse(null);

        return toDto(index, mongoDoc);
    }

    // ── CREATE ─────────────────────────────────────────────────────────────

    @Transactional
    public ExamQuestionDetailDto createQuestion(ExamQuestionSaveRequest req) {
        validateSection(req.getSection());

        ExamPart part = examPartRepository.findById(req.getPartId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Part không tồn tại: " + req.getPartId()));

        // 1. Tạo MongoDB document
        ExamQuestion mongoDoc = buildMongoDoc(req, null);
        mongoDoc = examQuestionRepository.save(mongoDoc);

        // 2. Tạo MySQL index
        ExamQuestionIndex index = new ExamQuestionIndex();
        index.setPart(part);
        index.setMongoDocId(mongoDoc.getId());
        index.setCreatedAt(LocalDateTime.now());
        populateIndex(index, req);
        index = questionIndexRepository.save(index);

        return toDto(index, mongoDoc);
    }

    // ── UPDATE ─────────────────────────────────────────────────────────────

    @Transactional
    public ExamQuestionDetailDto updateQuestion(Long questionIndexId, ExamQuestionSaveRequest req) {
        validateSection(req.getSection());

        ExamQuestionIndex index = questionIndexRepository.findById(questionIndexId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Câu hỏi không tồn tại"));

        // Cập nhật part nếu thay đổi
        if (!index.getPart().getId().equals(req.getPartId())) {
            ExamPart part = examPartRepository.findById(req.getPartId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Part không tồn tại: " + req.getPartId()));
            index.setPart(part);
        }

        // Cập nhật MongoDB
        Optional<ExamQuestion> mongoOpt = examQuestionRepository.findById(index.getMongoDocId());
        ExamQuestion mongoDoc = mongoOpt.orElse(new ExamQuestion());
        mongoDoc = buildMongoDoc(req, mongoDoc);
        if (mongoDoc.getId() == null) {
            mongoDoc = examQuestionRepository.save(mongoDoc);
            index.setMongoDocId(mongoDoc.getId());
        } else {
            examQuestionRepository.save(mongoDoc);
        }

        // Cập nhật MySQL
        populateIndex(index, req);
        index = questionIndexRepository.save(index);

        return toDto(index, mongoDoc);
    }

    // ── DELETE ─────────────────────────────────────────────────────────────

    @Transactional
    public void deleteQuestion(Long questionIndexId) {
        ExamQuestionIndex index = questionIndexRepository.findById(questionIndexId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Câu hỏi không tồn tại"));

        // Xóa MongoDB document
        if (index.getMongoDocId() != null) {
            examQuestionRepository.deleteById(index.getMongoDocId());
        }

        // Xóa MySQL index
        questionIndexRepository.delete(index);
    }

    // ── GET list by part ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ExamQuestionDetailDto> getQuestionsByPart(Integer partId) {
        ExamPart part = examPartRepository.findById(partId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Part không tồn tại"));

        return part.getQuestions().stream()
                .sorted((a, b) -> Integer.compare(a.getOrderIndex(), b.getOrderIndex()))
                .map(index -> {
                    ExamQuestion mongoDoc = examQuestionRepository.findById(index.getMongoDocId()).orElse(null);
                    return toDto(index, mongoDoc);
                })
                .toList();
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private void validateSection(String section) {
        if (!"LISTENING".equals(section) && !"READING_WRITING".equals(section) && !"SPEAKING".equals(section)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Section phải là LISTENING, READING_WRITING hoặc SPEAKING, không hỗ trợ: " + section);
        }
    }

    private void populateIndex(ExamQuestionIndex index, ExamQuestionSaveRequest req) {
        try {
            index.setQuestionType(ExamQuestionIndex.QuestionType.valueOf(req.getQuestionType()));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "questionType không hợp lệ: " + req.getQuestionType());
        }
        index.setQuestionNumberStart(req.getQuestionNumberStart());
        index.setQuestionNumberEnd(req.getQuestionNumberEnd());
        index.setCorrectAnswer(req.getCorrectAnswer());
        index.setOrderIndex(req.getOrderIndex() != null ? req.getOrderIndex() : 0);
    }

    private ExamQuestion buildMongoDoc(ExamQuestionSaveRequest req, ExamQuestion existing) {
        ExamQuestion doc = existing != null ? existing : new ExamQuestion();

        doc.setSection(req.getSection());
        doc.setQuestionType(req.getQuestionType());
        doc.setInstruction(req.getInstruction());
        doc.setText(req.getText());
        doc.setOptions(req.getOptions());
        doc.setPassageImageUrl(req.getPassageImageUrl());
        doc.setPassageText(req.getPassageText());

        // FILL_IN_FORM
        doc.setFormTitle(req.getFormTitle());
        doc.setFormContent(req.getFormContent());
        doc.setBlanksOptions(req.getBlanksOptions());

        // Số câu
        doc.setQuestionNumber(req.getQuestionNumberStart());
        doc.setQuestionNumberStart(req.getQuestionNumberStart());
        doc.setQuestionNumberEnd(req.getQuestionNumberEnd());

        // MATCHING
        doc.setInstructionDetail(req.getInstructionDetail());
        doc.setLeftItems(req.getLeftItems());
        doc.setRightItems(req.getRightItems());

        // FILL_IN_TEXT
        doc.setSentence(req.getSentence());

        // SHORT_WRITE
        doc.setWriteType(req.getWriteType());
        doc.setMinWords(req.getMinWords());
        doc.setMaxWords(req.getMaxWords());
        doc.setPromptText(req.getPromptText());
        doc.setBulletPoints(req.getBulletPoints());
        doc.setStoryImages(req.getStoryImages());

        // SPEAKING_TASK
        doc.setPartTitle(req.getPartTitle());
        doc.setPrompt(req.getPrompt());
        doc.setPrepTimeSec(req.getPrepTimeSec());
        doc.setSpeakTimeSec(req.getSpeakTimeSec());
        doc.setImageUrl(req.getImageUrl());
        doc.setSpeakingParts(req.getSpeakingParts());

        return doc;
    }

    private ExamQuestionDetailDto toDto(ExamQuestionIndex index, ExamQuestion doc) {
        ExamQuestionDetailDto dto = new ExamQuestionDetailDto();

        // MySQL
        dto.setId(index.getId());
        dto.setMongoDocId(index.getMongoDocId());
        dto.setQuestionType(index.getQuestionType() != null ? index.getQuestionType().name() : null);
        dto.setQuestionNumberStart(index.getQuestionNumberStart());
        dto.setQuestionNumberEnd(index.getQuestionNumberEnd());
        dto.setCorrectAnswer(index.getCorrectAnswer());
        dto.setOrderIndex(index.getOrderIndex());
        dto.setCreatedAt(index.getCreatedAt());

        if (index.getPart() != null) {
            dto.setPartId(index.getPart().getId());
            if (index.getPart().getPaper() != null) {
                dto.setPaperId(index.getPart().getPaper().getId());
                dto.setPaperType(index.getPart().getPaper().getPaperType().name());
            }
        }

        // MongoDB
        if (doc != null) {
            dto.setSection(doc.getSection());
            dto.setInstruction(doc.getInstruction());
            dto.setText(doc.getText());
            dto.setOptions(doc.getOptions());
            dto.setPassageImageUrl(doc.getPassageImageUrl());
            dto.setPassageText(doc.getPassageText());
            dto.setFormTitle(doc.getFormTitle());
            dto.setFormContent(doc.getFormContent());
            dto.setBlanksOptions(doc.getBlanksOptions());
            dto.setInstructionDetail(doc.getInstructionDetail());
            dto.setLeftItems(doc.getLeftItems());
            dto.setRightItems(doc.getRightItems());
            dto.setSentence(doc.getSentence());
            dto.setWriteType(doc.getWriteType());
            dto.setMinWords(doc.getMinWords());
            dto.setMaxWords(doc.getMaxWords());
            dto.setPromptText(doc.getPromptText());
            dto.setBulletPoints(doc.getBulletPoints());
            dto.setStoryImages(doc.getStoryImages());
            // SPEAKING_TASK
            dto.setPartTitle(doc.getPartTitle());
            dto.setPrompt(doc.getPrompt());
            dto.setPrepTimeSec(doc.getPrepTimeSec());
            dto.setSpeakTimeSec(doc.getSpeakTimeSec());
            dto.setImageUrl(doc.getImageUrl());
            dto.setSpeakingParts(doc.getSpeakingParts());
        }

        return dto;
    }
}
