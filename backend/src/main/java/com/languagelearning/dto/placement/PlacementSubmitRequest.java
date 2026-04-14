package com.languagelearning.dto.placement;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** Nộp sau khi làm xong hết 3 level: các mảng câu trả lời (ko có trường hợp rỗng câu trả lời vì cho lamf hết mới bấm nộp bài theo từng loại bài */
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
        private Integer lineIndex;
        private String typedText;
    }
}
