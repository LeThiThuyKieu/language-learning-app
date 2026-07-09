package com.languagelearning.service.admin;

import com.languagelearning.dto.admin.exam_management.*;
import com.languagelearning.entity.*;
import com.languagelearning.repository.mysql.*;
import com.languagelearning.service.QuestionMediaUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminExamTestManagementService {

    private final ExamTestRepository examTestRepository;
    private final ExamPaperRepository examPaperRepository;
    private final ExamPartRepository examPartRepository;
    private final ExamQuestionIndexRepository examQuestionIndexRepository;

    /**
     * Lấy danh sách tất cả exam tests (bao gồm inactive) có phân trang.
     */
    @Transactional(readOnly = true)
    public Page<AdminExamTestDto> getTests(int page, int size, String level) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "cefrLevel", "testNumber"));

        Page<ExamTest> tests;
        if (level != null && !level.isBlank()) {
            try {
                ExamTest.CefrLevel cefrLevel = ExamTest.CefrLevel.valueOf(level.toUpperCase());
                tests = examTestRepository.findByCefrLevel(cefrLevel, pageable);
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid CEFR level: " + level);
            }
        } else {
            tests = examTestRepository.findAll(pageable);
        }

        return tests.map(this::toAdminTestDto);
    }

    /**
     * Thống kê tổng quan.
     */
    @Transactional(readOnly = true)
    public ExamTestStatsDto getStats() {
        long total = examTestRepository.count();
        long active = examTestRepository.countByIsActive(true);
        long inactive = total - active;
        long totalQuestions = examQuestionIndexRepository.findMaxQuestionNumberEnd();

        return new ExamTestStatsDto(total, active, inactive, totalQuestions);
    }

    /**
     * Lấy chi tiết 1 test (bao gồm papers, parts, questions metadata).
     */
    @Transactional(readOnly = true)
    public AdminExamTestDto getTestDetail(Integer id) {
        ExamTest test = examTestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exam test not found"));

        return toAdminTestDetailDto(test);
    }

    /**
     * Tạo mới exam test (chỉ tạo test + 3 papers rỗng).
     * Admin cần thêm parts & questions qua MongoDB sau.
     */
    @Transactional
    public AdminExamTestDto createTest(ExamTestCreateRequest request) {
        ExamTest.CefrLevel cefrLevel;
        try {
            cefrLevel = ExamTest.CefrLevel.valueOf(request.getCefrLevel().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid CEFR level: " + request.getCefrLevel());
        }

        // Kiểm tra trùng lặp
        if (examTestRepository.findByCefrLevelAndTestNumber(cefrLevel, request.getTestNumber()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Test đã tồn tại: " + cefrLevel + " Test " + request.getTestNumber());
        }

        ExamTest test = new ExamTest();
        test.setCefrLevel(cefrLevel);
        test.setTestNumber(request.getTestNumber());
        test.setTitle(request.getTitle());
        test.setDescription(request.getDescription());
        test.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        test.setCreatedAt(LocalDateTime.now());

        test = examTestRepository.save(test);

        // Tạo 3 papers rỗng
        int[] durations = getDurationsForLevel(cefrLevel);
        ExamPaper.PaperType[] types = ExamPaper.PaperType.values();

        for (int i = 0; i < types.length; i++) {
            ExamPaper paper = new ExamPaper();
            paper.setExamTest(test);
            paper.setPaperType(types[i]);
            paper.setDurationMinutes(durations[i]);
            paper.setOrderIndex(i + 1);
            examPaperRepository.save(paper);
        }

        return toAdminTestDetailDto(examTestRepository.findById(test.getId()).orElseThrow());
    }

    /**
     * Cập nhật thông tin test.
     */
    @Transactional
    public AdminExamTestDto updateTest(Integer id, ExamTestUpdateRequest request) {
        ExamTest test = examTestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exam test not found"));

        ExamTest.CefrLevel newLevel;
        try {
            newLevel = ExamTest.CefrLevel.valueOf(request.getCefrLevel().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid CEFR level: " + request.getCefrLevel());
        }

        // Kiểm tra trùng lặp khi thay đổi level/testNumber
        if (!test.getCefrLevel().equals(newLevel) || !test.getTestNumber().equals(request.getTestNumber())) {
            if (examTestRepository.findByCefrLevelAndTestNumber(newLevel, request.getTestNumber()).isPresent()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Test đã tồn tại: " + newLevel + " Test " + request.getTestNumber());
            }
        }

        test.setCefrLevel(newLevel);
        test.setTestNumber(request.getTestNumber());
        test.setTitle(request.getTitle());
        test.setDescription(request.getDescription());
        if (request.getIsActive() != null) {
            test.setIsActive(request.getIsActive());
        }

        test = examTestRepository.save(test);
        return toAdminTestDetailDto(test);
    }

    /**
     * Ẩn/hiện exam test (toggle isActive).
     */
    @Transactional
    public AdminExamTestDto toggleTestVisibility(Integer id) {
        ExamTest test = examTestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exam test not found"));

        test.setIsActive(!test.getIsActive());
        test = examTestRepository.save(test);

        return toAdminTestDto(test);
    }

    /**
     * Cập nhật audio URL và duration của 1 paper.
     */
    @Transactional
    public AdminExamPaperDto updatePaper(Integer paperId, ExamPaperUpdateRequest request) {
        ExamPaper paper = examPaperRepository.findById(paperId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paper not found"));

        paper.setDurationMinutes(request.getDurationMinutes());
        paper.setAudioUrl(request.getAudioUrl());

        paper = examPaperRepository.save(paper);
        return toAdminPaperDetailDto(paper);
    }

    /**
     * Tạo part mới trong một paper.
     * POST /api/admin/exam-tests/papers/{paperId}/parts
     */
    @Transactional
    public AdminExamPartDto createPart(Integer paperId, ExamPartCreateRequest request) {
        ExamPaper paper = examPaperRepository.findById(paperId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paper not found"));

        ExamPart part = new ExamPart();
        part.setPaper(paper);
        part.setPartNumber(request.getPartNumber());
        part.setOrderIndex(request.getOrderIndex() != null ? request.getOrderIndex() : 0);

        part = examPartRepository.save(part);
        return toAdminPartDto(part);
    }

    /**
     * Cập nhật thông tin part (partNumber, orderIndex).
     * PUT /api/admin/exam-tests/parts/{partId}
     */
    @Transactional
    public AdminExamPartDto updatePart(Integer partId, ExamPartUpdateRequest request) {
        ExamPart part = examPartRepository.findById(partId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Part not found"));

        part.setPartNumber(request.getPartNumber());
        part.setOrderIndex(request.getOrderIndex() != null ? request.getOrderIndex() : 0);

        part = examPartRepository.save(part);
        return toAdminPartDto(part);
    }

    /**
     * Upload audio cho Listening paper lên Cloudinary.
     * Folder: audio_file/exam/{cefrLevel}/{testTitle}
     * Sau khi upload, lưu URL vào paper.audioUrl.
     */
    @Transactional
    public String uploadPaperAudio(Integer paperId, MultipartFile file, QuestionMediaUploadService mediaUploadService) {
        ExamPaper paper = examPaperRepository.findById(paperId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paper not found"));

        ExamTest test = paper.getExamTest();
        String cefrLevel = test.getCefrLevel().name();          // e.g. "A2"
        String testTitle = "Test " + test.getTestNumber();       // e.g. "Test 1"

        String audioUrl = mediaUploadService.uploadExamAudio(file, cefrLevel, testTitle);

        paper.setAudioUrl(audioUrl);
        examPaperRepository.save(paper);

        return audioUrl;
    } ──────────────────────────────────────────────────────────────

    private AdminExamTestDto toAdminTestDto(ExamTest test) {
        AdminExamTestDto dto = new AdminExamTestDto();
        dto.setId(test.getId());
        dto.setCefrLevel(test.getCefrLevel().name());
        dto.setTestNumber(test.getTestNumber());
        dto.setTitle(test.getTitle());
        dto.setDescription(test.getDescription());
        dto.setIsActive(test.getIsActive());
        dto.setCreatedAt(test.getCreatedAt());

        List<AdminExamPaperDto> papers = test.getPapers().stream()
                .sorted(Comparator.comparingInt(ExamPaper::getOrderIndex))
                .map(this::toAdminPaperDto)
                .collect(Collectors.toList());
        dto.setPapers(papers);

        int totalQuestions = papers.stream()
                .mapToInt(AdminExamPaperDto::getTotalQuestions)
                .sum();
        dto.setTotalQuestions(totalQuestions);

        return dto;
    }

    private AdminExamTestDto toAdminTestDetailDto(ExamTest test) {
        AdminExamTestDto dto = new AdminExamTestDto();
        dto.setId(test.getId());
        dto.setCefrLevel(test.getCefrLevel().name());
        dto.setTestNumber(test.getTestNumber());
        dto.setTitle(test.getTitle());
        dto.setDescription(test.getDescription());
        dto.setIsActive(test.getIsActive());
        dto.setCreatedAt(test.getCreatedAt());

        List<AdminExamPaperDto> papers = test.getPapers().stream()
                .sorted(Comparator.comparingInt(ExamPaper::getOrderIndex))
                .map(this::toAdminPaperDetailDto)
                .collect(Collectors.toList());
        dto.setPapers(papers);

        int totalQuestions = papers.stream()
                .mapToInt(AdminExamPaperDto::getTotalQuestions)
                .sum();
        dto.setTotalQuestions(totalQuestions);

        return dto;
    }

    private AdminExamPaperDto toAdminPaperDto(ExamPaper paper) {
        AdminExamPaperDto dto = new AdminExamPaperDto();
        dto.setId(paper.getId());
        dto.setPaperType(paper.getPaperType().name());
        dto.setDurationMinutes(paper.getDurationMinutes());
        dto.setAudioUrl(paper.getAudioUrl());
        dto.setOrderIndex(paper.getOrderIndex());

        int questionCount = examQuestionIndexRepository.findMaxQuestionNumberEndByPaperId(paper.getId());
        dto.setTotalQuestions(questionCount);

        return dto;
    }

    private AdminExamPaperDto toAdminPaperDetailDto(ExamPaper paper) {
        AdminExamPaperDto dto = new AdminExamPaperDto();
        dto.setId(paper.getId());
        dto.setPaperType(paper.getPaperType().name());
        dto.setDurationMinutes(paper.getDurationMinutes());
        dto.setAudioUrl(paper.getAudioUrl());
        dto.setOrderIndex(paper.getOrderIndex());

        List<AdminExamPartDto> parts = paper.getParts().stream()
                .sorted(Comparator.comparingInt(ExamPart::getOrderIndex))
                .map(this::toAdminPartDto)
                .collect(Collectors.toList());
        dto.setParts(parts);

        int questionCount = examQuestionIndexRepository.findMaxQuestionNumberEndByPaperId(paper.getId());
        dto.setTotalQuestions(questionCount);

        return dto;
    }

    private AdminExamPartDto toAdminPartDto(ExamPart part) {
        AdminExamPartDto dto = new AdminExamPartDto();
        dto.setId(part.getId());
        dto.setPartNumber(part.getPartNumber());
        dto.setOrderIndex(part.getOrderIndex());

        List<AdminExamQuestionDto> questions = part.getQuestions().stream()
                .sorted(Comparator.comparingInt(ExamQuestionIndex::getOrderIndex))
                .map(this::toAdminQuestionDto)
                .collect(Collectors.toList());
        dto.setQuestions(questions);

        return dto;
    }

    private AdminExamQuestionDto toAdminQuestionDto(ExamQuestionIndex q) {
        AdminExamQuestionDto dto = new AdminExamQuestionDto();
        dto.setId(q.getId());
        dto.setMongoDocId(q.getMongoDocId());
        dto.setQuestionType(q.getQuestionType().name());
        dto.setQuestionNumberStart(q.getQuestionNumberStart());
        dto.setQuestionNumberEnd(q.getQuestionNumberEnd());
        dto.setCorrectAnswer(q.getCorrectAnswer());
        dto.setOrderIndex(q.getOrderIndex());
        dto.setCreatedAt(q.getCreatedAt());
        return dto;
    }

    private int[] getDurationsForLevel(ExamTest.CefrLevel level) {
        // [Listening, R&W, Speaking]
        return switch (level) {
            case A2 -> new int[]{30, 60, 10};
            case B1 -> new int[]{36, 90, 12};
            case B2, C1 -> new int[]{40, 90, 15};
            case C2 -> new int[]{40, 90, 16};
        };
    }
}
