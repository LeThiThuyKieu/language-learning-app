package com.languagelearning.dto.placement;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** Nộp một level: các mảng câu trả lời (có thể rỗng nếu chưa làm phần đó). */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlacementSubmitRequest {

    private Integer testId;
    private Integer level;

    private List<VocabAnswer> vocabAnswers;
    private List<MatchingAnswer> matchingAnswers;
    private List<ListeningAnswer> listeningAnswers;
    private List<SpeakingAnswer> speakingAnswers;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VocabAnswer {
        private Long questionId;
        /** Chỉ số đáp án chọn (0..n) */
        private Integer selectedOptionIndex;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MatchingAnswer {
        private String leftCardId;
        private String rightCardId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ListeningAnswer {
        private Long questionId;
        private List<String> gapAnswers;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SpeakingAnswer {
        private Long questionId;
        /** 0-based; có thể bỏ nếu gửi đúng thứ tự như GET /speaking. */
        private Integer lineIndex;
        private String typedText;
    }
}
