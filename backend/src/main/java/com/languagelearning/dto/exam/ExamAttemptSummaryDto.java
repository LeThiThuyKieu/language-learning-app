package com.languagelearning.dto.exam;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Tóm tắt 1 lần làm bài — dùng trong danh sách lịch sử.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamAttemptSummaryDto {
    private Long          id;
    private Integer       testId;
    private String        testTitle;
    private Integer       writingScore;
    private Integer       speakingScore;
    private Integer       correctCount;
    private Integer       totalCount;
    /** Listening: số câu đúng */
    private Integer       listeningCorrect;
    /** Listening: tổng câu có đáp án */
    private Integer       listeningTotal;
    /** Reading & Writing: số câu đúng */
    private Integer       rwCorrect;
    /** Reading & Writing: tổng câu có đáp án */
    private Integer       rwTotal;
    private LocalDateTime attemptedAt;
}
