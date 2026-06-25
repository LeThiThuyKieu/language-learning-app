package com.languagelearning.dto.exam;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** Thông tin tổng quan 1 bài thi (dùng cho trang danh sách) */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamTestDto {
    private Integer id;
    private String cefrLevel;      // "A2", "B1"…
    private Integer testNumber;
    private String title;
    private String description;
    private List<ExamPaperSummaryDto> papers;
}
