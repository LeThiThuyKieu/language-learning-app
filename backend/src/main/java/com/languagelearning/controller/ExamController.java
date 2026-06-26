package com.languagelearning.controller;

import com.languagelearning.dto.exam.ExamPaperDto;
import com.languagelearning.dto.exam.ExamTestDto;
import com.languagelearning.service.exam.ExamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exam")
@RequiredArgsConstructor
public class ExamController {

    private final ExamService examService;

    /**
     * GET /api/exam/tests?level=A2
     * Lấy danh sách bài thi của một CEFR level.
     * Nếu không truyền level → trả toàn bộ.
     */
    @GetMapping(value = "/tests", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<ExamTestDto> getTests(
            @RequestParam(required = false) String level,
            Authentication authentication) {
        if (level != null && !level.isBlank()) {
            return examService.getTestsByLevel(level);
        }
        return examService.getAllTests();
    }

    /**
     * GET /api/exam/tests/{testId}/papers/{paperType}
     * Lấy nội dung đầy đủ của 1 paper để user làm bài.
     * paperType: LISTENING | READING_WRITING | SPEAKING
     */
    @GetMapping(value = "/tests/{testId}/papers/{paperType}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ExamPaperDto getPaper(
            @PathVariable Integer testId,
            @PathVariable String paperType,
            Authentication authentication) {
        return examService.getPaper(testId, paperType);
    }
}
