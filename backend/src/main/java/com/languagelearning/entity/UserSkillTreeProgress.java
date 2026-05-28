package com.languagelearning.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_skill_tree_progress")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class UserSkillTreeProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "skill_tree_id")
    private SkillTree skillTree;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProgressStatus status = ProgressStatus.locked;

    /**
     * Accuracy của tree = tổng earned_xp / tổng max_xp của 4 node.
     * Ví dụ: 4 câu đúng / 20 câu = 0.2
     * Lưu dạng thập phân 0.0 – 1.0.
     */
    @Column(name = "accuracy", nullable = false)
    private Double accuracy = 0.0;

    /**
     * order_index của tree tại thời điểm user bắt đầu học.
     * Dùng để sort lộ trình đúng thứ tự gốc dù adaptive difficulty có đổi thứ tự sau.
     * NULL = bản ghi cũ (trước khi có cột này), fallback về treeId khi sort.
     */
    @Column(name = "initial_order_index")
    private Integer initialOrderIndex;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum ProgressStatus {
        locked, in_progress, done
    }
}


