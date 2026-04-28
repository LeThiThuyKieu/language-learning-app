package com.languagelearning.repository.mysql;

import com.languagelearning.entity.SupportMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SupportMessageRepository extends JpaRepository<SupportMessage, Integer> {
    List<SupportMessage> findByTicketIdOrderByCreatedAtAsc(Integer ticketId);

    Optional<SupportMessage> findTopByTicketIdOrderByCreatedAtDesc(Integer ticketId);

    // Lấy tin nhắn đầu tiên của user (không phải admin) trong ticket
    Optional<SupportMessage> findTopByTicketIdAndSenderTypeOrderByCreatedAtAsc(Integer ticketId, SupportMessage.SenderType senderType);
}
