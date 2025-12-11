package com.languagelearning.document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "skill_trees")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SkillTree {
    @Id
    private String id;

    @Indexed
    private Integer skillTreeId; // map MySQL skill_tree.id
    @Indexed
    private Integer levelId;     // map MySQL levels.id

    private String title;
    private String description;
    private Integer orderIndex;

    /**
     * Danh sách node id (MySQL) thuộc tree này
     */
    private List<Integer> nodeIds;

    private List<String> tags;
}

