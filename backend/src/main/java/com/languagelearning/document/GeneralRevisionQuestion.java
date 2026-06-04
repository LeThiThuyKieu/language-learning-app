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
 * MongoDB document cho collection general_revision_questions.
 * Hỗ trợ các question_type: VOCAB_IMAGE | LISTENING | SPEAKING | MATCHING
 */
@Document(collection = "general_revision_questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GeneralRevisionQuestion {

    @Id
    private String id;

    @Indexed
    @Field("topic_id")
    private Integer topicId;

    @Indexed
    @Field("task_id")
    private Integer taskId;

    @Indexed
    @Field("question_type")
    private String questionType;

    // ── VOCAB_IMAGE ────────────────────────────────────────
    /** URL ảnh (Wikimedia / Cloudinary) */
    @Field("image_url")
    private String imageUrl;

    /** Đáp án đúng (từ cần gõ) */
    @Field("correct_answer")
    private String correctAnswer;

    /** Thứ tự hiển thị trong task */
    @Field("order_index")
    private Integer orderIndex;

    // ── LISTENING ──────────────────────────────────────────
    @Field("question_text")
    private String questionText;

    /** Danh sách 4 lựa chọn */
    @Field("distractors")
    private List<String> distractors;

    private String explanation;

    // ── SPEAKING ───────────────────────────────────────────
    @Field("prompt_text")
    private String promptText;

    @Field("expected_keywords")
    private List<String> expectedKeywords;

    // ── MATCHING ───────────────────────────────────────────
    /**
     * Danh sách cặp ghép: [{ left: "kettle", right: "boil water" }, …]
     */
    private List<Map<String, String>> pairs;

    // ── Shared ─────────────────────────────────────────────
    private Metadata metadata;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Metadata {
        @Field("audio_url")
        private String audioUrl;
        private String transcript;
    }
}
