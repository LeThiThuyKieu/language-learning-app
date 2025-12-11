package com.languagelearning.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "skill_tree")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SkillTree {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @ManyToOne
    @JoinColumn(name = "level_id")
    private Level level;
    
    private String title;
    
    @Column(name = "order_index")
    private Integer orderIndex;
    
    @Column(name = "is_locked_by_default")
    private Boolean isLockedByDefault = true;
}


