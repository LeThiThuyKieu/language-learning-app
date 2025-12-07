package com.languagelearning.document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "grammar_notes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GrammarNote {
    @Id
    private String id;
    
    private String title;
    private String content;
    private List<String> examples;
    private List<String> rules;
    private Integer levelId;
    private Integer skillNodeId;
    private List<String> tags;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

