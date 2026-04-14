package com.languagelearning.dto.learning;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

// Thông tin đầy đủ của 1 question

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
    private List<String> options;
    /** Chuỗi đáp án (MySQL correct_answer) */
    private String correctAnswer;
    private String questionType;
    private String audioUrl;
    private String phonetic;
}
