package com.languagelearning.repository.mysql;

import com.languagelearning.entity.SupportTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.List;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, Integer>, JpaSpecificationExecutor<SupportTicket> {
    List<SupportTicket> findByUserIdOrderByCreatedAtDesc(Integer userId);

    // Tìm ticket còn mở (OPEN/IN_PROGRESS/RESOLVED) của user theo category và source
    List<SupportTicket> findByUserIdAndCategoryIdAndSourceAndStatusIn(
            Integer userId,
            Integer categoryId,
            SupportTicket.TicketSource source,
            List<SupportTicket.SupportStatus> statuses
    );

    // Tìm ticket RESOLVED quá X ngày để auto-close
    List<SupportTicket> findByStatusAndUpdatedAtBefore(
            SupportTicket.SupportStatus status,
            LocalDateTime cutoff
    );
}
