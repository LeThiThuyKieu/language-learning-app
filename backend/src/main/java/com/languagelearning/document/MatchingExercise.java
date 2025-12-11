package com.languagelearning.document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;
import java.util.Map;

@Document(collection = "matching_exercises")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchingExercise {
    @Id
    private String id;
    
    private String title;
    private List<String> leftItems;
    private List<String> rightItems;
    private Map<String, String> correctPairs; // leftItem -> rightItem
    private String explanation;

    @Indexed
    private Integer skillNodeId;
    @Indexed
    private Integer skillTreeId;
    @Indexed
    private Integer levelId;

    private Integer difficulty;
    private List<String> tags;
}


