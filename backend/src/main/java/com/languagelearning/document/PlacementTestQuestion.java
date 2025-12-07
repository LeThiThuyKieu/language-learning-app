package com.languagelearning.document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "placement_test_questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlacementTestQuestion {
    @Id
    private String id;
    
    private String questionText;
    private String questionType;
    private List<String> options;
    private List<String> correctAnswers;
    private Integer levelId; // target level for this question
    private Integer points;
    private Integer difficulty;
}

