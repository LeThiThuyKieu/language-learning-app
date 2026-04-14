package com.languagelearning.dto.placement;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** Một câu trắc nghiệm , ko gửi đáp án */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlacementVocabItemDto {
    private Long questionId;
    private String mongoQuestionId;
    private String questionText;
    private List<String> options;
}
