package com.languagelearning.entity;

/**
 * Loại câu hỏi trong bảng MySQL {@code questions.question_type}.
 * Không có REVIEW — node REVIEW lấy câu ngẫu nhiên theo level + loại.
 */
public enum QuestionType {
    VOCAB,
    LISTENING,
    SPEAKING,
    MATCHING
}
