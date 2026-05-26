package com.languagelearning.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_node_progress")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class UserNodeProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "node_id")
    private SkillNode node;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NodeProgressStatus status = NodeProgressStatus.not_started;

    /**
     * XP user kiếm được ở lần attempt đầu tiên (số câu đúng × 10).
     * Các lần sau chỉ tăng attempt_count, không cập nhật earned_xp.
     */
    @Column(name = "earned_xp", nullable = false)
    private Integer earnedXp = 0;

    /**
     * XP tối đa có thể đạt được khi làm node này (tổng số câu × 10).
     */
    @Column(name = "max_xp", nullable = false)
    private Integer maxXp = 0;

    @Column(name = "attempt_count")
    private Integer attemptCount = 0;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum NodeProgressStatus {
        not_started, in_progress, completed
    }
}


