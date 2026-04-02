package com.languagelearning.document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
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

    /**
     * Lưu danh sách questionId để tránh embed quá sâu
     */
    private List<String> questionIds;

    @Indexed
    private Integer skillNodeId;
    @Indexed
    private Integer skillTreeId;
    @Indexed
    private Integer levelId;

    private Integer duration; // seconds
    private List<String> tags;
}


