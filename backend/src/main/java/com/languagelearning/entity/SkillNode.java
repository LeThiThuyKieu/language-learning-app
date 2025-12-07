package com.languagelearning.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "skill_node")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SkillNode {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @ManyToOne
    @JoinColumn(name = "skill_tree_id")
    private SkillTree skillTree;
    
    private String title;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "node_type")
    private NodeType nodeType;
    
    @Column(name = "order_index")
    private Integer orderIndex;
    
    public enum NodeType {
        VOCAB, LISTENING, SPEAKING, MATCHING, REVIEW
    }
}

