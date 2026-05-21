package com.languagelearning.dto.feedback;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request gửi lên khi user đánh giá độ khó của một skill tree.
 * rating: 1 (Rất dễ) → 5 (Rất khó)
 */
@Data
@NoArgsConstructor
public class FeedbackRequest {
    private Integer treeId;
    /** 1 = Rất dễ, 2 = Dễ, 3 = Bình thường, 4 = Khó, 5 = Rất khó */
    private Integer rating;
}
