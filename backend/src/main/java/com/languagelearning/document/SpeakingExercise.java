package com.languagelearning.document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "speaking_exercises")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SpeakingExercise {
    @Id
    private String id;
    
    private String title;
    private String prompt;
    private String sampleAnswer;
    private String audioUrl; // sample pronunciation
    private List<String> keywords;

    @Indexed
    private Integer skillNodeId;
    @Indexed
    private Integer skillTreeId;
    @Indexed
    private Integer levelId;

    private Integer duration; // seconds
    private List<String> tags;
}


