package com.languagelearning.dto.admin.exam_progress;

import lombok.Builder;
import lombok.Data;

/**
 * Thống kê tổng hợp toàn hệ thống — dùng cho 4 stat cards.
 */
@Data
@Builder
public class ExamProgressStatsDto {
    /** Tổng số user đã thi ít nhất 1 lần */
    private Long totalUsers;

    /** Tổng lượt thi toàn hệ thống */
    private Long totalAttempts;

    /**
     * TB tỉ lệ đúng câu có đáp án chuẩn (Listening + R&W objective gộp), %.
     * = AVG(correct_count / total_count * 100) với total_count > 0
     */
    private Double avgObjectiveAccuracy;

    /**
     * TB điểm AI (Writing + Speaking gộp), %.
     * = AVG của tất cả writing_score và speaking_score không null
     */
    private Double avgAiScore;
}
