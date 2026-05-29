package com.languagelearning.dto.learning;

import lombok.Data;

@Data
public class SkipTestSubmitRequest {
    private int correctCount;
    private int totalCount;
    /** Tỷ lệ đúng 0-100 */
    private int accuracy;
    /** true nếu đạt (accuracy >= 70%) */
    private boolean passed;
}
