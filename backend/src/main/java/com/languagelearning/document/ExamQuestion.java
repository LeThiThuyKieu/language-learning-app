package com.languagelearning.document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.List;
import java.util.Map;

/**
 * MongoDB document cho collection exam_questions.
 *
 * question_type:
 *   MULTIPLE_CHOICE  — options[]{id, text, image_url}
 *   FILL_IN_FORM     — form_title, form_content (plain text, ____ = blank marker)
 *   MATCHING         — left_items, right_items
 *   FILL_IN_TEXT     — sentence (có ____ marker)
 *   SHORT_WRITE      — prompt_text, bullet_points, write_type, min_words, max_words, story_images
 *   SPEAKING_TASK    — prompt, prep_time_sec, speak_time_sec, image_url, part_title
 *
 * instruction: lưu ở câu đầu tiên của mỗi nhóm (part), các câu sau để null.
 */
@Document(collection = "exam_questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamQuestion {

    @Id
    private String id; // slug khớp với mongo_doc_id trong MySQL, vd: "a2t1_l_p1_q1"

    @Indexed
    @Field("question_type")
    private String questionType; // MULTIPLE_CHOICE | FILL_IN_FORM | MATCHING | FILL_IN_TEXT | SHORT_WRITE | SPEAKING_TASK

    @Indexed
    private String section; // LISTENING | READING_WRITING | SPEAKING

    /**
     * Instruction hiển thị đầu nhóm câu hỏi. Null = câu này không phải câu đầu nhóm.
     */
    private String instruction;

    // Dùng cho MULTIPLE_CHOICE
    @Field("question_number")
    private Integer questionNumber;

    /** Câu hỏi (text) */
    private String text;

    /** Danh sách lựa chọn: [{ id, text, image_url }] */
    private List<Map<String, Object>> options;

    /** Passage đọc kèm (R&W): { text, style } — style: "notice" | "normal" */
    private Map<String, Object> passage;

    // Dùng cho FILL_IN_FORM
    @Field("question_number_start")
    private Integer questionNumberStart;

    @Field("question_number_end")
    private Integer questionNumberEnd;

    @Field("form_title")
    private String formTitle;

    /**
     * Nội dung form dạng plain text với \n và ____ làm blank marker.
     * Frontend parse ____ thành inline input, đếm số thứ tự từ question_number_start.
     */
    @Field("form_content")
    private String formContent;

    // Dùng cho MATCHING
    @Field("instruction_detail")
    private String instructionDetail; // mô tả chi tiết hơn instruction chính

    @Field("left_items")
    private List<Map<String, Object>> leftItems;  // [{ question_number, label }]

    @Field("right_items")
    private List<Map<String, Object>> rightItems; // [{ id, label }]

    // Dùng cho FILL_IN_TEXT
    /** Câu có ____ đánh dấu chỗ điền */
    private String sentence;

    // Dùng cho SHORT_WRITE
    @Field("write_type")
    private String writeType; // "EMAIL" | "STORY"

    @Field("min_words")
    private Integer minWords;

    @Field("max_words")
    private Integer maxWords;

    @Field("prompt_text")
    private String promptText;

    @Field("bullet_points")
    private List<String> bulletPoints;

    @Field("story_images")
    private List<Map<String, Object>> storyImages; // [{ order, image_url, alt }]

    // Dùng cho SPEAKING_TASK
    @Field("part_title")
    private String partTitle;

    private String prompt;

    @Field("prep_time_sec")
    private Integer prepTimeSec;

    @Field("speak_time_sec")
    private Integer speakTimeSec;

    @Field("image_url")
    private String imageUrl;
}
