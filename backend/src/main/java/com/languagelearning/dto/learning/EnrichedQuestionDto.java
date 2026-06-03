package com.languagelearning.dto.learning;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

// Thông tin đầy đủ của 1 question, hỗ trợ 4 type: VOCAB, LISTENING, SPEAKING, MATCHING

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class EnrichedQuestionDto {
    /** Khóa MySQL questions.id */
    private Long id;
    private String mongoQuestionId;
    private String questionText;
    private String questionType;
    
    // ========== VOCAB ==========
    private List<String> options;
    /** Chuỗi đáp án (MySQL correct_answer) */
    private String correctAnswer;
    
    // ========== LISTENING ==========
    private Integer blankCount;
    
    // ========== SPEAKING ==========
    private String sampleAnswer;
    private List<String> keywords;
    
    // ========== MATCHING ==========
    private List<String> leftItems;
    private List<String> rightItems;
    private Map<String, String> correctPairs;
    
    // ========== Chung ==========
    private String audioUrl;
    private String phonetic;
}
