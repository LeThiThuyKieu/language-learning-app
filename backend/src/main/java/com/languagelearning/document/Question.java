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
 * Khớp schema Mongo dùng bởi Node ({@code question_text}, {@code distractors}, {@code metadata.audio_url}, …).
 * Hỗ trợ 4 type: VOCAB, LISTENING, SPEAKING, MATCHING
 * 
 * - VOCAB: question_text + distractors + correct_answers
 * - LISTENING: question_text (có .......) + audioUrl + blankCount
 * - SPEAKING: question_text (prompt) + sampleAnswer + keywords + audioUrl
 * - MATCHING: leftItems + rightItems + correctPairs (map)
 */
@Document(collection = "questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Question {
    @Id
    private String id;

    @Field("question_text")
    private String questionText;
    /**
     * VOCAB, LISTENING, SPEAKING, MATCHING
     */
    @Field("question_type")
    private String questionType;
    
    // ========== VOCAB / Trắc nghiệm ==========
    /**
     * Trong DB Node/Mongoose thường là {@code distractors}; giữ tên field Java {@code options}.
     */
    @Field("distractors")
    private List<String> options;

    /** Một số document dùng key {@code options} thay cho {@code distractors}. */
    @Field("options")
    private List<String> optionsAlt;

    @Field("correct_answers")
    private List<String> correctAnswers;
    
    // ========== LISTENING ==========
    /** Số khoảng trống .......... cần điền cho LISTENING */
    private Integer blankCount;
    
    // ========== SPEAKING ==========
    /** Sample answer / sample response cho SPEAKING */
    private String sampleAnswer;
    /** Keywords cần nói cho SPEAKING */
    private List<String> keywords;
    
    // ========== MATCHING ==========
    /** Left items (column 1) cho MATCHING */
    private List<String> leftItems;
    /** Right items (column 2) cho MATCHING */
    private List<String> rightItems;
    /** Map: leftItemId -> rightItemId cho MATCHING */
    private Map<String, String> correctPairs;
    
    // ========== Chung ==========
    private String explanation;
    private Integer points;

    @Indexed
    private Integer levelId;
    @Indexed
    private Integer skillTreeId;
    @Indexed
    private Integer skillNodeId;

    /**
     * Optional: BEGINNER / INTERMEDIATE / ADVANCED (dùng cho placement test group)
     */
    private String placementGroup;

    private List<String> tags;

    @Field("metadata")
    private Metadata metadata;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Metadata {
        @Field("audio_url")
        private String audioUrl;
        private String phonetic;
    }
}


