package com.languagelearning.document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "explanation_notes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExplanationNote {
    @Id
    private String id;

    @Indexed
    private String questionId;
    @Indexed
    private String exerciseId;

    private String explanationText;
    private String videoUrl;
    private String imageUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}


