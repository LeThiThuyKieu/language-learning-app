package com.languagelearning.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Lưu tổng điểm KN (kinh nghiệm) tích lũy của từng user.
 * +10 KN khi hoàn thành node VOCAB / LISTENING / SPEAKING / MATCHING (kể cả học lại).
 * +20 KN khi hoàn thành node REVIEW (kể cả học lại).
 */
@Entity
@Table(name = "user_kn")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserKn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

    @Column(name = "total_kn", nullable = false)
    private Integer totalKn = 0;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    private void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
