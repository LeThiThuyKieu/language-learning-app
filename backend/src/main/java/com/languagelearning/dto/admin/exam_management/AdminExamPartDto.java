package com.languagelearning.dto.admin.exam_management;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminExamPartDto {
    private Integer id;
    private Integer partNumber;
    private Integer orderIndex;
    private List<AdminExamQuestionDto> questions;
}
