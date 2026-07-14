package com.languagelearning.dto.exam;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response trả về sau khi LLM chấm bài Writing hoặc Speaking.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GradeResponse {

    /**
     * % tương đồng / điểm chất lượng: 0–100.
     * Writing: điểm tổng hợp từ LLM (nội dung, ngữ pháp, từ vựng, cấu trúc, task completion).
     * Speaking: điểm tổng hợp (fluency, relevance, vocabulary, grammar).
     */
    private int score;

    /**
     * Nhận xét ngắn gọn từ LLM (2–4 câu tiếng Việt).
     */
    private String feedback;

    /**
     * Điểm breakdown (JSON string hoặc null).
     * Ví dụ: {"content":85,"grammar":70,"vocabulary":80,"structure":75}
     */
    private String breakdown;

    /**
     * Câu trả lời mẫu / gợi ý cải thiện (nullable).
     * Với Writing: LLM có thể đưa ra 1-2 câu gợi ý cải thiện.
     * Với Speaking: null (không có đáp án chuẩn).
     */
    private String suggestion;

    /**
     * Số từ trong bài làm (Writing only, null với Speaking).
     */
    private Integer wordCount;
}
