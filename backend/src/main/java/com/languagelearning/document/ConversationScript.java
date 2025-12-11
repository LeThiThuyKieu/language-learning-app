package com.languagelearning.document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "conversation_scripts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConversationScript {
    @Id
    private String id;
    
    private String title;
    private String audioUrl;
    private List<DialogueLine> dialogue;
    private String transcript;
    private String translation;

    @Indexed
    private Integer skillNodeId;
    @Indexed
    private Integer skillTreeId;
    @Indexed
    private Integer levelId;

    private Integer duration; // seconds
    private Integer difficulty;
    private List<String> vocabulary; // vocab ids
    private List<String> tags;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DialogueLine {
        private String speaker;
        private String text;
        private String translation;
        private Integer timestamp; // seconds
    }
}

