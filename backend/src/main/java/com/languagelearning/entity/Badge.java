package com.languagelearning.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "badges")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Badge {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "badge_name")
    private String badgeName;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "required_xp")
    private Integer requiredXp;
    
    @Column(name = "icon_url", columnDefinition = "TEXT")
    private String iconUrl;
}

