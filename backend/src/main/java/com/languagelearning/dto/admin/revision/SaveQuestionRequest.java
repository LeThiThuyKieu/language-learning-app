package com.languagelearning.dto.admin.revision;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * Request body để tạo mới hoặc cập nhật 1 câu hỏi.
 * Dùng cho cả CREATE (POST) và UPDATE (PUT).
 */
@Data
public class SaveQuestionRequest {

    @NotBlank(message = "question_type is required")
    private String questionType;   // VOCAB_IMAGE | LISTENING | MATCHING | WRITING

    @NotNull(message = "orderIndex is required")
    private Integer orderIndex;

    // VOCAB_IMAGE / LISTENING
    private String imageUrl;

    // MATCHING / WRITING questionText
    private String questionText;

    // LISTENING (fill-in-the-blank sentence)
    private String sentence;

    // LISTENING / VOCAB_IMAGE
    private String audioUrl;       // metadata.audio_url

    // MATCHING
    private List<Map<String, String>> pairs;

    // WRITING
    private List<Map<String, Object>> categories;
    private List<Map<String, String>> images;

    private String correctAnswer;
}
