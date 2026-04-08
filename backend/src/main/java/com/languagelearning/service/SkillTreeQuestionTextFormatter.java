package com.languagelearning.service;

import com.languagelearning.dto.learning.EnrichedQuestionDto;
import com.languagelearning.dto.learning.NodeQuestionsDto;
import com.languagelearning.dto.learning.SkillTreeQuestionsResponse;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

/**
 * Xuất nội dung giống script Node {@code formatTree} (file .txt).
 */
public final class SkillTreeQuestionTextFormatter {

    private SkillTreeQuestionTextFormatter() {
    }

    public static String formatTree(SkillTreeQuestionsResponse tree) {
        StringBuilder content = new StringBuilder();
        content.append("TREE ").append(tree.getTreeId()).append("\n");
        content.append("====================================\n\n");

        for (NodeQuestionsDto node : tree.getNodes()) {
            content.append("NODE ").append(node.getNodeType()).append("\n\n");
            boolean isReview = "REVIEW".equalsIgnoreCase(node.getNodeType());
            int index = 1;
            for (EnrichedQuestionDto q : node.getQuestions()) {
                String qt = q.getQuestionType() != null ? q.getQuestionType() : "";
                if ("VOCAB".equals(qt)) {
                    appendVocab(content, q, index);
                } else if ("LISTENING".equals(qt)) {
                    appendListening(content, q, index);
                } else if ("MATCHING".equals(qt)) {
                    appendMatching(content, q, index, isReview);
                } else if ("SPEAKING".equals(qt)) {
                    appendSpeaking(content, q, index);
                } else {
                    appendGeneric(content, q, index);
                }
                index++;
            }
            content.append("\n\n");
        }
        return content.toString();
    }

    private static void appendVocab(StringBuilder content, EnrichedQuestionDto q, int index) {
        List<String> opts = q.getOptions() != null ? new ArrayList<>(q.getOptions()) : new ArrayList<>();
        if (q.getCorrectAnswer() != null && !opts.contains(q.getCorrectAnswer())) {
            opts.add(q.getCorrectAnswer());
        }
        List<String> unique = new ArrayList<>();
        for (String o : opts) {
            if (o != null && !unique.contains(o)) {
                unique.add(o);
            }
        }
        Collections.shuffle(unique);
        List<String> options = unique.size() > 4 ? unique.subList(0, 4) : unique;
        String[] letters = {"A", "B", "C", "D"};
        content.append("Q").append(index).append(": ").append(nullToEmpty(q.getQuestionText())).append("\n");
        for (int i = 0; i < options.size() && i < 4; i++) {
            content.append(letters[i]).append(". ").append(options.get(i)).append("\n");
        }
        int correctIdx = options.indexOf(q.getCorrectAnswer());
        String letter = correctIdx >= 0 ? letters[correctIdx] : "?";
        content.append("Answer: ").append(letter).append("\n\n");
    }

    private static void appendListening(StringBuilder content, EnrichedQuestionDto q, int index) {
        String text = nullToEmpty(q.getQuestionText()).replace("\\n", "\n");
        content.append("Q").append(index).append(": ").append(text).append("\n");
        content.append("Answer: ").append(nullToEmpty(q.getCorrectAnswer())).append("\n\n");
    }

    private static void appendMatching(StringBuilder content, EnrichedQuestionDto q, int index, boolean isReview) {
        if (isReview) {
            content.append("Q").append(index).append(": ").append(nullToEmpty(q.getQuestionText())).append("\n");
            content.append("Answer: ").append(nullToEmpty(q.getCorrectAnswer())).append("\n\n");
        } else {
            content.append(index).append(". ").append(nullToEmpty(q.getQuestionText()))
                    .append(" -> ").append(nullToEmpty(q.getCorrectAnswer())).append("\n");
        }
    }

    private static void appendSpeaking(StringBuilder content, EnrichedQuestionDto q, int index) {
        content.append("Q").append(index).append(": [Speaking] ")
                .append(nullToEmpty(q.getQuestionText()).isEmpty() ? "Describe the image" : q.getQuestionText())
                .append("\n");
        content.append(nullToEmpty(q.getCorrectAnswer())).append("\n\n");
    }

    private static void appendGeneric(StringBuilder content, EnrichedQuestionDto q, int index) {
        content.append("Q").append(index).append(": ").append(nullToEmpty(q.getQuestionText())).append("\n");
        content.append("Answer: ").append(nullToEmpty(q.getCorrectAnswer())).append("\n\n");
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }
}
