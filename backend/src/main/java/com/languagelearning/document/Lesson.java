package com.languagelearning.document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
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
    /**
     * Nội dung bài học (markdown/HTML/JSON)
     */
    private String content;

    @Indexed
    private Integer levelId;
    @Indexed
    private Integer skillTreeId;
    @Indexed
    private Integer skillNodeId;

    private List<String> tags;
    /**
     * Phút
     */
    private Integer estimatedDuration;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}


