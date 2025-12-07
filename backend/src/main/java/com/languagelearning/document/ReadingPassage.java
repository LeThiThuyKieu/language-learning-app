package com.languagelearning.document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "reading_passages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReadingPassage {
    @Id
    private String id;
    
    private String title;
    private String passageText;
    private List<Question> questions;
    private Integer skillNodeId;
    private Integer levelId;
    private Integer estimatedTime; // minutes
    private Integer difficulty;
    private List<String> vocabulary;
}

