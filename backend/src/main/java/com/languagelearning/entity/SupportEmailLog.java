package com.languagelearning.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "support_email_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SupportEmailLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id")
    private SupportTicket ticket;

    @Column(name = "to_email", length = 100)
    private String toEmail;

    @Column(name = "subject", length = 255)
    private String subject;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private SendStatus status;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    public enum SendStatus {
        SUCCESS, FAILED
    }
}
