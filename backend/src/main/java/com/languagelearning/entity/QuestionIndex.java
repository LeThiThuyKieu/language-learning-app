package com.languagelearning.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Bảng MySQL {@code questions}: liên kết {@code mongo_question_id} tới collection Mongo {@code questions}.
 */
@Entity
@Table(name = "questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionIndex {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "mongo_question_id", nullable = false, length = 50)
    private String mongoQuestionId;

    @Column(name = "node_id")
    private Integer nodeId;

    @Column(name = "level_id")
    private Integer levelId;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type")
    private QuestionType questionType;

    @Column(name = "correct_answer", columnDefinition = "TEXT")
    private String correctAnswer;
}
