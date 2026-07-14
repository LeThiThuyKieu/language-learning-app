package com.languagelearning.controller;

import com.languagelearning.dto.exam.ExamAttemptDetailDto;
import com.languagelearning.dto.exam.ExamAttemptSummaryDto;
import com.languagelearning.dto.exam.SaveExamAttemptRequest;
import com.languagelearning.service.exam.ExamAttemptService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * API lưu & xem lại lịch sử làm bài thi.
 *
 * POST   /api/exam/attempts              → lưu kết quả 1 lần thi
 * GET    /api/exam/attempts              → danh sách tất cả lần thi của user
 * GET    /api/exam/attempts/test/{testId}→ lần thi của user với 1 test
 * GET    /api/exam/attempts/{id}         → chi tiết 1 lần thi (xem lại bài)
 */
@RestController
@RequestMapping("/api/exam/attempts")
@RequiredArgsConstructor
public class ExamAttemptController {

    private final ExamAttemptService examAttemptService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ExamAttemptSummaryDto saveAttempt(
            @RequestBody SaveExamAttemptRequest request,
            Authentication authentication) {
        return examAttemptService.saveAttempt(request, authentication);
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public List<ExamAttemptSummaryDto> getMyAttempts(Authentication authentication) {
        return examAttemptService.getMyAttempts(authentication);
    }

    @GetMapping(value = "/test/{testId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<ExamAttemptSummaryDto> getMyAttemptsForTest(
            @PathVariable Integer testId,
            Authentication authentication) {
        return examAttemptService.getMyAttemptsForTest(testId, authentication);
    }

    @GetMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ExamAttemptDetailDto getAttemptDetail(
            @PathVariable Long id,
            Authentication authentication) {
        return examAttemptService.getAttemptDetail(id, authentication);
    }
}
