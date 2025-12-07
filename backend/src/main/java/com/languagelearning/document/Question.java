package com.languagelearning.document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
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
    private String questionType; // MULTIPLE_CHOICE, FILL_BLANK, TRUE_FALSE, etc.
    private List<String> options;
    private List<String> correctAnswers;
    private String explanation;
    private Integer difficulty; // 1-5
    private Integer skillNodeId;
    private Integer lessonId;
    private Integer points;
}

