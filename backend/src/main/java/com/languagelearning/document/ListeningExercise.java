package com.languagelearning.document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "listening_exercises")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ListeningExercise {
    @Id
    private String id;
    
    private String title;
    private String audioUrl;
    private String transcript;
    private List<Question> questions;
    private Integer skillNodeId;
    private Integer levelId;
    private Integer duration; // seconds
    private Integer difficulty;
}

