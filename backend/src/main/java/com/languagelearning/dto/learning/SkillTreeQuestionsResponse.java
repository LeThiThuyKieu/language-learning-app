package com.languagelearning.dto.learning;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

// Thông tin của 1 skill tree

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SkillTreeQuestionsResponse {
    private Integer treeId;
    private Integer levelId;
    private List<NodeQuestionsDto> nodes;
}
