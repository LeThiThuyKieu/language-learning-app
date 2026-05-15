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
 * Rule chatbot: mỗi rule gồm một hoặc nhiều keyword (phân cách bởi |)
 * và một câu trả lời tự động tương ứng.
 *
 * Khi user gửi tin nhắn, hệ thống dò tìm keyword trong message.
 * Nếu khớp → trả về botResponse ngay lập tức (không tạo ticket).
 * Nếu không khớp → chuyển sang admin hỗ trợ realtime.
 */
@Entity
@Table(name = "chatbot_rule")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class ChatbotRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /** Tên rule để dễ nhận biết và quản lý trong admin UI */
    @Column(name = "rule_name", nullable = false, length = 100)
    private String ruleName;

    /**
     * Từ khóa kích hoạt rule, phân cách bởi dấu |
     * Ví dụ: "quên mật khẩu|đổi mật khẩu|reset password"
     */
    @Column(name = "keywords", nullable = false, columnDefinition = "TEXT")
    private String keywords;

    /** Câu trả lời tự động khi khớp keyword */
    @Column(name = "bot_response", nullable = false, columnDefinition = "TEXT")
    private String botResponse;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private SupportCategory category;

    /** Độ ưu tiên — rule có priority cao hơn được kiểm tra trước */
    @Column(name = "priority", nullable = false)
    private Integer priority = 0;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
