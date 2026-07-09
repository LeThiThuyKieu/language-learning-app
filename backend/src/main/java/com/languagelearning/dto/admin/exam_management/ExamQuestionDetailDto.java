package com.languagelearning.dto.admin.exam_management;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * DTO đầy đủ của 1 câu hỏi exam, kết hợp dữ liệu từ MySQL (index) và MongoDB (nội dung).
 * Chỉ dùng cho Listening và Reading & Writing.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamQuestionDetailDto {

    // ── MySQL fields ──────────────────────────────────────────────────────
    private Long id;                    // ExamQuestionIndex.id
    private String mongoDocId;          // khớp với _id trong MongoDB
    private String questionType;        // MULTIPLE_CHOICE | FILL_IN_FORM | MATCHING | FILL_IN_TEXT | SHORT_WRITE
    private Integer questionNumberStart;
    private Integer questionNumberEnd;
    private String correctAnswer;       // plain string hoặc JSON
    private Integer orderIndex;
    private Integer partId;
    private Integer paperId;
    private String paperType;           // LISTENING | READING_WRITING
    private LocalDateTime createdAt;

    // ── MongoDB fields ────────────────────────────────────────────────────
    private String section;             // LISTENING | READING_WRITING
    private String instruction;
    private String text;                // câu hỏi (MULTIPLE_CHOICE)
    private List<Map<String, Object>> options;      // [{id, text, image_url}]
    private String passageImageUrl;
    private String passageText;

    // FILL_IN_FORM
    private String formTitle;
    private String formContent;
    private List<Map<String, Object>> blanksOptions; // [{number, options:[]}]

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
