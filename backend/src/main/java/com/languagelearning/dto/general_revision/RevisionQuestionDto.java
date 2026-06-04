package com.languagelearning.dto.general_revision;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * DTO trả về câu hỏi ôn tập.
 * Dùng chung cho VOCAB_IMAGE | LISTENING | SPEAKING | MATCHING.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RevisionQuestionDto {
    private String questionId;   // MongoDB _id
    private Integer topicId;
    private Integer taskId;
    private String questionType;
    private Integer orderIndex;

    // VOCAB_IMAGE
    private String imageUrl;
    private String correctAnswer;

    // MATCHING
    private List<Map<String, String>> pairs;

    // WRITING — categories và images từ MongoDB
    private List<Map<String, Object>> categories;
    private List<Map<String, String>> images;

    // Shared
    private String audioUrl;     // metadata.audio_url
}
