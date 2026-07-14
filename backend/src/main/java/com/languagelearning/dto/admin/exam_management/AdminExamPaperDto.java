package com.languagelearning.dto.admin.exam_management;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminExamPaperDto {
    private Integer id;
    private String paperType;      // LISTENING | READING_WRITING | SPEAKING
    private Integer durationMinutes;
    private String audioUrl;
    private Integer orderIndex;
    private List<AdminExamPartDto> parts;
    private Integer totalQuestions;
}
