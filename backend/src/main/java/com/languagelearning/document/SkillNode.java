package com.languagelearning.document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "skill_nodes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SkillNode {
    @Id
    private String id;

    @Indexed
    private Integer skillNodeId;
    @Indexed
    private Integer skillTreeId;
    @Indexed
    private Integer levelId;

    private String nodeType; // VOCAB, LISTENING, SPEAKING, MATCHING, REVIEW
    private String title;
    private String description;
    private Integer orderIndex;

    /**
     * Danh sách questionId của node
     */
    private List<String> questionIds;

    /**
     * Tài nguyên kèm theo (lessonId, vocab ids, media ids, exercise ids...)
     */
    private List<String> lessonIds;
    private List<String> vocabularyIds;
    private List<String> mediaIds;
    private List<String> exerciseIds; // listening/speaking/matching/... id

    private List<String> tags;
}

