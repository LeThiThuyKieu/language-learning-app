package com.languagelearning.dto.exam;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamPartDto {
    private Integer partNumber;
    private List<ExamQuestionDto> questions;
}
