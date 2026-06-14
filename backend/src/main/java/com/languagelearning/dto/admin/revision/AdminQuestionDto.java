package com.languagelearning.dto.admin.revision;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * DTO trả về 1 câu hỏi trong admin revision management.
 * Gộp dữ liệu từ MySQL (general_revision_questions) + MongoDB (general_revision_questions collection).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminQuestionDto {

    private Long indexId;          // MySQL PK
    private String mongoId;        // mongo_question_id
    private Integer topicId;
    private Integer taskId;
    private String questionType;
    private String correctAnswer;

    private Integer orderIndex;

    // VOCAB_IMAGE / LISTENING
    private String imageUrl;

    // MATCHING / WRITING
    private String questionText;

    // LISTENING
    private String sentence;
    private String audioUrl;

    // MATCHING
    private List<Map<String, String>> pairs;

    // WRITING
    private List<Map<String, Object>> categories;
    private List<Map<String, String>> images;
}
