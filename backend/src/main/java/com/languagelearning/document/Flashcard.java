package com.languagelearning.document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "flashcards")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Flashcard {
    @Id
    private String id;
    
    private Integer userId;
    private String vocabularyId;
    private String frontSide;
    private String backSide;
    private Integer difficulty; // 1-5
    private LocalDateTime nextReview;
    private Integer reviewCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

