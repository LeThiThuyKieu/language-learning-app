package com.languagelearning.document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.List;

/**
 * Khớp schema Mongo dùng bởi Node ({@code question_text}, {@code distractors}, {@code metadata.audio_url}, …).
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
     * MULTIPLE_CHOICE, FILL_BLANK, TRUE_FALSE, MATCHING, ORDER, SPEAKING, LISTENING
     */
    @Field("question_type")
    private String questionType;
    /**
     * Trong DB Node/Mongoose thường là {@code distractors}; giữ tên field Java {@code options} cho phần còn lại của app.
     */
    @Field("distractors")
    private List<String> options;

    /** Một số document dùng key {@code options} thay cho {@code distractors}. */
    @Field("options")
    private List<String> optionsAlt;

    @Field("correct_answers")
    private List<String> correctAnswers;
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


