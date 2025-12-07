package com.languagelearning.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "levels")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Level {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "level_name", nullable = false)
    private String levelName;
    
    @Column(name = "cefr_code")
    private String cefrCode;
    
    @Column(name = "min_score_required")
    private Integer minScoreRequired = 0;
}

