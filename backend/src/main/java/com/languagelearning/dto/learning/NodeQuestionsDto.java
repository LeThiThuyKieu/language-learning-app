package com.languagelearning.dto.learning;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NodeQuestionsDto {
    private Integer nodeId;
    private String title;
    private String nodeType;
    private List<EnrichedQuestionDto> questions;
}
