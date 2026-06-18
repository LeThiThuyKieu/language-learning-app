package com.languagelearning.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "grammar_topics")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GrammarTopic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Unique slug (ví dụ: present-simple)
    @Column(nullable = false, unique = true, length = 100)
    private String slug;

    // Tên chuyên đề (ví dụ: Thì hiện tại đơn)
    @Column(nullable = false, length = 255)
    private String name;

    // Thứ tự hiển thị
    @Column(nullable = false, name = "display_order")
    private Integer displayOrder;

    // URL tương đối của file JSON (ví dụ: /grammar/present-simple.json)
    @Column(nullable = false, length = 255, name = "json_url")
    private String jsonUrl;

    // Timestamp tạo
    @Column(nullable = false, name = "created_at", columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt = LocalDateTime.now();

    // Timestamp cập nhật
    @Column(nullable = false, name = "updated_at", columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
