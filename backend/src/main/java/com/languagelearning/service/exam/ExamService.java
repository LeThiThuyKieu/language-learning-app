package com.languagelearning.service.exam;

import com.languagelearning.document.ExamQuestion;
import com.languagelearning.dto.exam.*;
import com.languagelearning.entity.ExamPaper;
import com.languagelearning.entity.ExamPart;
import com.languagelearning.entity.ExamQuestionIndex;
import com.languagelearning.entity.ExamTest;
import com.languagelearning.repository.mongo.ExamQuestionRepository;
import com.languagelearning.repository.mysql.ExamPaperRepository;
import com.languagelearning.repository.mysql.ExamPartRepository;
import com.languagelearning.repository.mysql.ExamTestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExamService {

    private final ExamTestRepository examTestRepository;
    private final ExamPaperRepository examPaperRepository;
    private final ExamPartRepository examPartRepository;
    private final ExamQuestionRepository examQuestionRepository;

    // 1. Danh sách bài thi theo level
    public List<ExamTestDto> getTestsByLevel(String levelStr) {
        ExamTest.CefrLevel level;
        try {
            level = ExamTest.CefrLevel.valueOf(levelStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid CEFR level: " + levelStr);
        }
        return examTestRepository.findActiveByCefrLevel(level)
                .stream()
                .sorted(Comparator.comparingInt(ExamTest::getTestNumber))
                .map(this::toTestDto)
                .collect(Collectors.toList());
    }

    public List<ExamTestDto> getAllTests() {
        return examTestRepository.findAllActive()
                .stream()
                .sorted(Comparator.comparing((ExamTest t) -> t.getCefrLevel().name())
                        .thenComparingInt(ExamTest::getTestNumber))
                .map(this::toTestDto)
                .collect(Collectors.toList());
    }

    // 2. Nội dung một paper (Listening / R&W / Speaking)
    public ExamPaperDto getPaper(Integer testId, String paperTypeStr) {
        ExamPaper.PaperType paperType;
        try {
            paperType = ExamPaper.PaperType.valueOf(paperTypeStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid paper type: " + paperTypeStr);
        }

        ExamPaper paper = examPaperRepository.findByTestIdAndType(testId, paperType)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Paper not found for testId=" + testId + ", type=" + paperTypeStr));

        // Fetch parts + questions bằng query riêng để tránh MultipleBagFetchException
        List<ExamPart> parts = examPartRepository.findByPaperIdWithQuestions(paper.getId());

        // Batch-fetch tất cả Mongo docs trong 1 lần query
        List<String> allMongoIds = parts.stream()
                .flatMap(pt -> pt.getQuestions().stream())
                .map(ExamQuestionIndex::getMongoDocId)
                .collect(Collectors.toList());

        Map<String, ExamQuestion> mongoMap = examQuestionRepository
                .findAllById(allMongoIds)
                .stream()
                .collect(Collectors.toMap(ExamQuestion::getId, q -> q));

        List<ExamPartDto> partDtos = parts.stream()
                .map(pt -> toPartDto(pt, mongoMap))
                .collect(Collectors.toList());

        ExamPaperDto dto = new ExamPaperDto();
        dto.setPaperId(paper.getId());
        dto.setPaperType(paper.getPaperType().name());
        dto.setDurationMinutes(paper.getDurationMinutes());
        dto.setAudioUrl(paper.getAudioUrl());
        dto.setParts(partDtos);
        return dto;
    }

    // Mappers
    private ExamTestDto toTestDto(ExamTest test) {
        List<ExamPaperSummaryDto> papers = test.getPapers().stream()
                .sorted(Comparator.comparingInt(ExamPaper::getOrderIndex))
                .map(this::toPaperSummaryDto)
                .collect(Collectors.toList());

        ExamTestDto dto = new ExamTestDto();
        dto.setId(test.getId());
        dto.setCefrLevel(test.getCefrLevel().name());
        dto.setTestNumber(test.getTestNumber());
        dto.setTitle(test.getTitle());
        dto.setDescription(test.getDescription());
        dto.setPapers(papers);
        return dto;
    }

    private ExamPaperSummaryDto toPaperSummaryDto(ExamPaper paper) {
        String label = switch (paper.getPaperType()) {
            case LISTENING -> "Listening";
            case READING_WRITING -> "Reading and Writing";
            case SPEAKING -> "Speaking";
        };

        ExamPaperSummaryDto dto = new ExamPaperSummaryDto();
        dto.setPaperType(paper.getPaperType().name());
        dto.setLabel(label);
        dto.setDurationMinutes(paper.getDurationMinutes());
        dto.setDurationLabel(formatDuration(paper.getDurationMinutes()));
        return dto;
    }

    private ExamPartDto toPartDto(ExamPart part, Map<String, ExamQuestion> mongoMap) {
        List<ExamQuestionDto> questions = part.getQuestions().stream()
                .sorted(Comparator.comparingInt(ExamQuestionIndex::getOrderIndex))
                .map(idx -> toQuestionDto(idx, mongoMap.get(idx.getMongoDocId())))
                .collect(Collectors.toList());

        ExamPartDto dto = new ExamPartDto();
        dto.setPartNumber(part.getPartNumber());
        dto.setQuestions(questions);
        return dto;
    }

    private ExamQuestionDto toQuestionDto(ExamQuestionIndex index, ExamQuestion mongo) {
        ExamQuestionDto dto = new ExamQuestionDto();

        // Từ MySQL
        dto.setId(index.getId());
        dto.setMongoDocId(index.getMongoDocId());
        dto.setQuestionType(index.getQuestionType().name());
        dto.setQuestionNumberStart(index.getQuestionNumberStart());
        dto.setQuestionNumberEnd(index.getQuestionNumberEnd());
        dto.setCorrectAnswer(index.getCorrectAnswer());

        if (mongo == null) return dto;

        // Từ MongoDB — override với giá trị từ Mongo nếu có
        dto.setInstruction(mongo.getInstruction());
        dto.setQuestionNumber(mongo.getQuestionNumber());

        if (mongo.getQuestionNumberStart() != null)
            dto.setQuestionNumberStart(mongo.getQuestionNumberStart());
        if (mongo.getQuestionNumberEnd() != null)
            dto.setQuestionNumberEnd(mongo.getQuestionNumberEnd());

        dto.setText(mongo.getText());
        dto.setOptions(mongo.getOptions());
        dto.setPassageImageUrl(mongo.getPassageImageUrl());
        dto.setPassageText(mongo.getPassageText());
        dto.setBlanksOptions(mongo.getBlanksOptions());

        dto.setFormTitle(mongo.getFormTitle());
        dto.setFormContent(mongo.getFormContent());

        dto.setInstructionDetail(mongo.getInstructionDetail());
        dto.setLeftItems(mongo.getLeftItems());
        dto.setRightItems(mongo.getRightItems());

        dto.setSentence(mongo.getSentence());

        dto.setWriteType(mongo.getWriteType());
        dto.setMinWords(mongo.getMinWords());
        dto.setMaxWords(mongo.getMaxWords());
        dto.setPromptText(mongo.getPromptText());
        dto.setBulletPoints(mongo.getBulletPoints());
        dto.setStoryImages(mongo.getStoryImages());
        dto.setSourceTexts(mongo.getSourceTexts());

        dto.setPartTitle(mongo.getPartTitle());
        dto.setPrompt(mongo.getPrompt());
        dto.setPrepTimeSec(mongo.getPrepTimeSec());
        dto.setSpeakTimeSec(mongo.getSpeakTimeSec());
        dto.setImageUrl(mongo.getImageUrl());
        dto.setSpeakingParts(mongo.getSpeakingParts());

        return dto;
    }

    private String formatDuration(int minutes) {
        if (minutes < 60) return minutes + " phút";
        int h = minutes / 60;
        int m = minutes % 60;
        if (m == 0) return h + " giờ";
        return h + " giờ " + m + " phút";
    }
}
