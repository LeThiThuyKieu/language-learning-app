package com.languagelearning.document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "lessons")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Lesson {
    @Id
    private String id;
    
    private String title;
    private String description;
    private Integer levelId;
    private Integer skillTreeId;
    private Integer skillNodeId;
    private String content;
    private List<String> tags;
    private Integer estimatedDuration; // minutes
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

