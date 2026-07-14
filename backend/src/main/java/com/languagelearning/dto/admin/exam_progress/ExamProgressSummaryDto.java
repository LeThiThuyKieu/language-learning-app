package com.languagelearning.dto.admin.exam_progress;

import lombok.Builder;
import lombok.Data;

/**
 * Tóm tắt tiến trình thi của 1 user — dùng trong bảng danh sách.
 */
@Data
@Builder
public class ExamProgressSummaryDto {
    private Integer userId;
    private String  email;
    private String  fullName;
    private String  avatarUrl;

    /** Tổng lượt thi của user này */
    private Integer totalAttempts;

    /**
     * TB tỉ lệ đúng phần Listening (câu có đáp án chuẩn), %.
     * = AVG(listening_correct / listening_total * 100) qua các attempt có listening_total > 0.
     */
    private Double avgListeningAccuracy;

    /**
     * TB tỉ lệ đúng phần R&W objective (câu có đáp án chuẩn, không tính SHORT_WRITE), %.
     * = AVG(rw_correct / rw_total * 100) qua các attempt có rw_total > 0.
     */
    private Double avgRwAccuracy;

    /** Trung bình LLM writing_score (0–100). Null nếu user chưa có attempt nào có writing. */
    private Double avgWritingScore;

    /** Trung bình LLM speaking_score (0–100). Null nếu user chưa có attempt nào có speaking. */
    private Double avgSpeakingScore;

    /** Thời gian lần thi gần nhất */
    private String lastAttemptAt;
}
