package com.languagelearning.dto.admin.exam_management;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * Request body để tạo hoặc cập nhật 1 câu hỏi exam (Listening / Reading & Writing).
 */
@Data
public class ExamQuestionSaveRequest {

    // ── MySQL index ───────────────────────────────────────────────────────
    @NotNull
    private Integer partId;

    @NotBlank
    private String questionType;        // MULTIPLE_CHOICE | FILL_IN_FORM | MATCHING | FILL_IN_TEXT | SHORT_WRITE

    @NotNull
    private Integer questionNumberStart;

    @NotNull
    private Integer questionNumberEnd;

    private String correctAnswer;

    private Integer orderIndex;

    // ── MongoDB content ───────────────────────────────────────────────────
    @NotBlank
    private String section;             // LISTENING | READING_WRITING

    private String instruction;
    private String text;
    private List<Map<String, Object>> options;
    private String passageImageUrl;
    private String passageText;

    // FILL_IN_FORM
    private String formTitle;
    private String formContent;
    private List<Map<String, Object>> blanksOptions;

    // MATCHING
    private String instructionDetail;
    private List<Map<String, Object>> leftItems;
    private List<Map<String, Object>> rightItems;

    // FILL_IN_TEXT
    private String sentence;

    // SHORT_WRITE
    private String writeType;
    private Integer minWords;
    private Integer maxWords;
    private String promptText;
    private List<String> bulletPoints;
    private List<Map<String, Object>> storyImages;
}
