package com.languagelearning.dto.admin.exam_management;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamTestStatsDto {
    private long totalTests;
    private long activeTests;
    private long inactiveTests;
    private long totalQuestions;
}
