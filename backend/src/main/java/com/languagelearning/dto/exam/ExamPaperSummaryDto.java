package com.languagelearning.dto.exam;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Tóm tắt 1 paper (Listening / R&W / Speaking) để hiển thị trên card */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamPaperSummaryDto {
    private String paperType;        // "LISTENING" | "READING_WRITING" | "SPEAKING"
    private String label;            // "Listening", "Reading and Writing", "Speaking"
    private Integer durationMinutes;
    private String durationLabel;    // "30 phút", "1 giờ"…
}
