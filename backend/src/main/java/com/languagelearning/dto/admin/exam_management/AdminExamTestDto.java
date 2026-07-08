package com.languagelearning.dto.admin.exam_management;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminExamTestDto {
    private Integer id;
    private String cefrLevel;
    private Integer testNumber;
    private String title;
    private String description;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private List<AdminExamPaperDto> papers;

    /** Tổng số câu hỏi trong toàn bộ test */
    private Integer totalQuestions;
}
