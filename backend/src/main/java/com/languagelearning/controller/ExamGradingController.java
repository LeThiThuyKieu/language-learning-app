package com.languagelearning.controller;

import com.languagelearning.dto.exam.GradeResponse;
import com.languagelearning.dto.exam.SpeakingGradeRequest;
import com.languagelearning.dto.exam.WritingGradeRequest;
import com.languagelearning.service.exam.LlmGradingService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller xử lý chấm bài Writing và Speaking bằng LLM (OpenAI GPT).
 *
 * POST /api/exam/grade/writing  → chấm SHORT_WRITE
 * POST /api/exam/grade/speaking → chấm SPEAKING_TASK (dựa trên transcript)
 * GET  /api/exam/grade/status   → kiểm tra config (public, không cần auth)
 */
@RestController
@RequestMapping("/api/exam/grade")
@RequiredArgsConstructor
public class ExamGradingController {

    private final LlmGradingService llmGradingService;

    @Value("${openai.api-key:}")
    private String apiKey;

    @Value("${openai.model:gpt-4o-mini}")
    private String model;

    /**
     * Kiểm tra nhanh xem OpenAI API key có được cấu hình không.
     * Public endpoint — dùng để debug.
     */
    @GetMapping("/status")
    public Map<String, Object> status() {
        boolean configured = apiKey != null && !apiKey.isBlank();
        String keyPreview = configured
            ? apiKey.substring(0, Math.min(12, apiKey.length())) + "..."
            : "(chưa cấu hình)";
        return Map.of(
            "apiKeyConfigured", configured,
            "apiKeyPreview", keyPreview,
            "model", model
        );
    }

    /**
     * Chấm bài Writing (SHORT_WRITE).
     */
    @PostMapping(value = "/writing",
                 consumes = MediaType.APPLICATION_JSON_VALUE,
                 produces = MediaType.APPLICATION_JSON_VALUE)
    public GradeResponse gradeWriting(@RequestBody WritingGradeRequest request) {
        return llmGradingService.gradeWriting(request);
    }

    /**
     * Chấm Speaking dựa trên transcript từ Web Speech API.
     */
    @PostMapping(value = "/speaking",
                 consumes = MediaType.APPLICATION_JSON_VALUE,
                 produces = MediaType.APPLICATION_JSON_VALUE)
    public GradeResponse gradeSpeaking(@RequestBody SpeakingGradeRequest request) {
        return llmGradingService.gradeSpeaking(request);
    }
}
