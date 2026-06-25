package com.languagelearning.dto.exam;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * DTO gộp dữ liệu từ MySQL (correct_answer, question_number) và MongoDB (nội dung).
 * Frontend dùng questionType để render đúng component.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamQuestionDto {

    // ── Từ MySQL ─────────────────────────────────────────────
    private Long id;                  // exam_question.id (MySQL PK)
    private String mongoDocId;        // mongo_doc_id (dùng làm key trên UI)
    private String questionType;      // MULTIPLE_CHOICE | FILL_IN_FORM | MATCHING | FILL_IN_TEXT | SHORT_WRITE | SPEAKING_TASK
    private Integer questionNumberStart;
    private Integer questionNumberEnd;
    private String correctAnswer;     // null khi show lại bài chưa nộp hết

    // ── Từ MongoDB (chung) ───────────────────────────────────
    private String instruction;       // hiển thị nếu khác null (câu đầu nhóm)

    // ── MULTIPLE_CHOICE ──────────────────────────────────────
    private Integer questionNumber;
    private String text;
    private List<Map<String, Object>> options;   // [{id, text, image_url}]
    private Map<String, Object> passage;         // {text, style} — R&W only (legacy, kept for fallback)
    private String passageImageUrl;              // R&W only — ảnh notice/passage
    private String passageText;                  // R&W Part 2+ — đoạn văn dài (lưu ở câu đầu part)
    private List<Map<String, Object>> blanksOptions; // FILL_IN_FORM paragraph — [{number, options:[]}]

    // ── FILL_IN_FORM ─────────────────────────────────────────
    private String formTitle;
    private String formContent;      // plain text với ____ marker + \n

    // ── MATCHING ─────────────────────────────────────────────
    private String instructionDetail;
    private List<Map<String, Object>> leftItems;   // [{question_number, label}]
    private List<Map<String, Object>> rightItems;  // [{id, label}]

    // ── FILL_IN_TEXT ─────────────────────────────────────────
    private String sentence;         // câu có ____ marker

    // ── SHORT_WRITE ──────────────────────────────────────────
    private String writeType;        // "EMAIL" | "STORY"
    private Integer minWords;
    private Integer maxWords;
    private String promptText;
    private List<String> bulletPoints;
    private List<Map<String, Object>> storyImages; // [{order, image_url, alt}]

    // ── SPEAKING_TASK ─────────────────────────────────────────
    private String partTitle;
    private String prompt;
    private Integer prepTimeSec;
    private Integer speakTimeSec;
    private String imageUrl;
}
