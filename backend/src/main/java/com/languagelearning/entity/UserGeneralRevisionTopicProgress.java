package com.languagelearning.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Tiến trình ôn tập của user theo từng chủ đề.
 * Theo dõi số task đã hoàn thành, điểm lần gần nhất và điểm cao nhất.
 */
@Entity
@Table(name = "user_general_revision_topic_progress",
    uniqueConstraints = @UniqueConstraint(name = "uk_ugrtp_user_topic", columnNames = {"user_id", "topic_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserGeneralRevisionTopicProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id", nullable = false)
    private GeneralRevisionTopic topic;

    /** Số task đã hoàn thành ít nhất 1 lần (0–4) */
    @Column(name = "completed_tasks", nullable = false)
    private Integer completedTasks = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TopicStatus status = TopicStatus.not_started;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum TopicStatus {
        not_started, in_progress, completed
    }
}
