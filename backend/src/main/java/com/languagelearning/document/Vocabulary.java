package com.languagelearning.document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "vocabularies")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Vocabulary {
    @Id
    private String id;
    
    private String word;
    private String pronunciation;
    private String meaning;
    private String exampleSentence;
    private String exampleTranslation;
    private String partOfSpeech; // noun, verb, adjective, etc.
    private List<String> synonyms;
    private List<String> antonyms;
    private String audioUrl;
    private String imageUrl;

    @Indexed
    private Integer levelId;
    @Indexed
    private Integer skillTreeId;
    @Indexed
    private Integer skillNodeId;

    private List<String> tags;
}


