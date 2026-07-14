package com.languagelearning.controller;

import com.languagelearning.dto.exam.GradeResponse;
import com.languagelearning.dto.exam.SpeakingGradeRequest;
import com.languagelearning.dto.exam.WritingGradeRequest;
import com.languagelearning.service.exam.LlmGradingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

/**
 * Controller xử lý chấm bài Writing và Speaking bằng LLM (OpenAI GPT).
 *
 * POST /api/exam/grade/writing  → chấm SHORT_WRITE
 * POST /api/exam/grade/speaking → chấm SPEAKING_TASK (dựa trên transcript)
 */
@RestController
@RequestMapping("/api/exam/grade")
@RequiredArgsConstructor
public class ExamGradingController {

    private final LlmGradingService llmGradingService;

    /**
     * Chấm bài Writing (SHORT_WRITE).
     * Frontend gửi: mongoDocId, writeType, promptText, bulletPoints, minWords, maxWords,
     *               userAnswer, correctAnswer (nullable).
     */
    @PostMapping(value = "/writing",
                 consumes = MediaType.APPLICATION_JSON_VALUE,
                 produces = MediaType.APPLICATION_JSON_VALUE)
    public GradeResponse gradeWriting(@RequestBody WritingGradeRequest request) {
        return llmGradingService.gradeWriting(request);
    }

    /**
     * Chấm Speaking dựa trên transcript từ Web Speech API.
     * Frontend gửi: mongoDocId, partNumber, phaseNumber, questionText, transcript, partContext.
     */
    @PostMapping(value = "/speaking",
                 consumes = MediaType.APPLICATION_JSON_VALUE,
                 produces = MediaType.APPLICATION_JSON_VALUE)
    public GradeResponse gradeSpeaking(@RequestBody SpeakingGradeRequest request) {
        return llmGradingService.gradeSpeaking(request);
    }
}
