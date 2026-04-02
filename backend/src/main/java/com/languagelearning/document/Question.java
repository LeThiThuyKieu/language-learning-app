package com.languagelearning.document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Question {
    @Id
    private String id;

    private String questionText;
    /**
     * MULTIPLE_CHOICE, FILL_BLANK, TRUE_FALSE, MATCHING, ORDER, SPEAKING, LISTENING
     */
    private String questionType;
    private List<String> options;
    private List<String> correctAnswers;
    private String explanation;

    private Integer points;

    @Indexed
    private Integer levelId;
    @Indexed
    private Integer skillTreeId;
    @Indexed
    private Integer skillNodeId;

    /**
     * Optional: BEGINNER / INTERMEDIATE / ADVANCED (dùng cho placement test group)
     */
    private String placementGroup;

    private List<String> tags;
}


