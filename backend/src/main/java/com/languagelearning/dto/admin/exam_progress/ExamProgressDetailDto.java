package com.languagelearning.dto.admin.exam_progress;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ExamProgressDetailDto {
    private Integer userId;
    private String  email;
    private String  fullName;
    private String  avatarUrl;

    /** Thống kê tổng */
    private Integer totalAttempts;
    /** TB tỉ lệ đúng Listening, % */
    private Double  avgListeningAccuracy;
    /** TB tỉ lệ đúng R&W objective, % */
    private Double  avgRwAccuracy;
    private Double  avgWritingScore;
    private Double  avgSpeakingScore;

    /** Danh sách từng lần thi */
    private List<AttemptSummaryDto> attempts;

    @Data
    @Builder
    public static class AttemptSummaryDto {
        private Long    attemptId;
        private Integer testId;
        private String  testTitle;
        private String  cefrLevel;
        private Integer testNumber;

        /** Số câu đúng / tổng câu */
        private Integer correctCount;
        private Integer totalCount;

        /** Listening */
        private Integer listeningCorrect;
        private Integer listeningTotal;

        /** Reading & Writing */
        private Integer rwCorrect;
        private Integer rwTotal;

        /** LLM scores */
        private Integer writingScore;
        private Integer speakingScore;

        private String  attemptedAt;
    }
}
