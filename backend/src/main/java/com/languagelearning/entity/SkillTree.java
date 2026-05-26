package com.languagelearning.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

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

    @Column(name = "order_index")
    private Integer orderIndex;

    @Column(name = "is_locked_by_default")
    private Boolean isLockedByDefault = true;

    /**
     * Độ khó của tree, dùng cho adaptive learning.
     * Mặc định 0.5 (Cold Start). Cập nhật hàng tuần khi có dữ liệu mới.
     * Phạm vi: [0.0, 1.0] — 0 = rất dễ, 1 = rất khó.
     */
    @Column(name = "difficulty", nullable = false)
    private Double difficulty = 0.5;

    /**
     * Thời điểm cập nhật difficulty gần nhất.
     * NULL = chưa từng cập nhật.
     * Dùng để kiểm tra có dữ liệu mới kể từ lần cập nhật trước không.
     */
    @Column(name = "difficulty_updated_at")
    private LocalDateTime difficultyUpdatedAt;
}


