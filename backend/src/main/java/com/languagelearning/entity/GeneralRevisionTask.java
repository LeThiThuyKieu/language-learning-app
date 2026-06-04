package com.languagelearning.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "general_revision_task",
    uniqueConstraints = @UniqueConstraint(name = "uk_grt_topic_task", columnNames = {"topic_id", "task_index"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GeneralRevisionTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id", nullable = false)
    private GeneralRevisionTopic topic;

    @Column(name = "task_index", nullable = false)
    private Integer taskIndex;

    @Column(name = "task_label", nullable = false)
    private String taskLabel;

    @Column(name = "question_type", nullable = false)
    private String questionType;

    @Column
    private String description;
}
