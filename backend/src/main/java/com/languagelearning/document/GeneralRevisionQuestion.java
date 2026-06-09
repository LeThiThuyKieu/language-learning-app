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
    @Field("question_type")
    private String questionType;

    //  VOCAB_IMAGE
    @Field("image_url")
    private String imageUrl;

    @Indexed
    @Field("order_index")
    private Integer orderIndex;

    // WRITING dạng danh sách định nghĩa (question_text = định nghĩa bên trái)
    @Field("question_text")
    private String questionText;

    // LISTENING
    // (chỉ có image_url + metadata.audio_url, không có question_text)

    // SPEAKING / WRITING
    /**
     * Danh sách nhóm/cột để user điền từ vào.
     * Mỗi phần tử: { label: String, slots: Integer, correct_words: List<String> }
     */
    private List<Map<String, Object>> categories;

    /**
     * Danh sách hình ảnh tham khảo — chỉ có url.
     * [{ url: String }]
     */
    private List<Map<String, String>> images;

    // MATCHING
    /**
     * Danh sách cặp ghép: [{ left: "kettle", right: "boil water" }, …]
     */
    private List<Map<String, String>> pairs;

    // Shared
    private Metadata metadata;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Metadata {
        @Field("audio_url")
        private String audioUrl;
    }
}
