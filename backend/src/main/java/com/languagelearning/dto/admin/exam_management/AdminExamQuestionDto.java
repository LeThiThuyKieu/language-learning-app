package com.languagelearning.dto.admin.exam_management;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminExamQuestionDto {
    private Long id;
    private String mongoDocId;
    private String questionType;
    private Integer questionNumberStart;
    private Integer questionNumberEnd;
    private String correctAnswer;
    private Integer orderIndex;
    private LocalDateTime createdAt;
}
