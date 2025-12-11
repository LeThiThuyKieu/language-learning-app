package com.languagelearning.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_profile")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @OneToOne
    @JoinColumn(name = "user_id", unique = true)
    private User user;
    
    @Column(name = "full_name")
    private String fullName;
    
    @Column(name = "avatar_url", columnDefinition = "TEXT")
    private String avatarUrl;
    
    @Column(name = "target_goal")
    private String targetGoal;
    
    @Column(name = "current_level")
    private Integer currentLevel;
    
    @Column(name = "total_xp")
    private Integer totalXp = 0;
    
    @Column(name = "streak_count")
    private Integer streakCount = 0;
}


