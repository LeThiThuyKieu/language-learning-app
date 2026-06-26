package com.languagelearning.dto.exam;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** Full paper data — dùng khi user vào làm bài */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamPaperDto {
    private Integer paperId;
    private String paperType;
    private Integer durationMinutes;
    private String audioUrl;          // Listening only — null nếu chưa có file
    private List<ExamPartDto> parts;
}
