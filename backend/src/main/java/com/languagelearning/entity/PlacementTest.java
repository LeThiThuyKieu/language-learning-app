package com.languagelearning.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Phiên placement test: lưu bộ câu đã bốc (issued_json) và điểm lũy tiến (scores_json).
 */
@Entity
@Table(name = "placement_test")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class PlacementTest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    /** IN_PROGRESS | STOPPED_LOW_SCORE | COMPLETED */
    @Column(nullable = false, length = 32)
    private String status = "IN_PROGRESS";

    @Column(name = "issued_json", columnDefinition = "LONGTEXT")
    private String issuedJson;

    @Column(name = "scores_json", columnDefinition = "LONGTEXT")
    private String scoresJson;

    /** Trung bình 4 điểm kỹ năng (mỗi kỹ năng làm tròn trên thang 160), ví dụ 94.5 */
    @Column(name = "total_score")
    private Double totalScore;

    @ManyToOne
    @JoinColumn(name = "detected_level_id")
    private Level detectedLevel;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
