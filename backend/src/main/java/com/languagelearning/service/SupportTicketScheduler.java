package com.languagelearning.service;

import com.languagelearning.entity.SupportTicket;
import com.languagelearning.repository.mysql.SupportTicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Tự động đóng ticket RESOLVED sau 3 ngày không có phản hồi từ user.
 * Chạy mỗi giờ một lần.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SupportTicketScheduler {

    private static final int AUTO_CLOSE_DAYS = 3;

    private final SupportTicketRepository supportTicketRepository;

    @Scheduled(cron = "0 0 2 * * *") // 2:00 AM mỗi ngày
    @Transactional
    public void autoCloseResolvedTickets() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(AUTO_CLOSE_DAYS);

        // Auto-close cả RESOLVED và IN_PROGRESS quá 3 ngày không có hoạt động
        List<SupportTicket> toClose = supportTicketRepository
                .findByStatusInAndUpdatedAtBefore(
                        List.of(SupportTicket.SupportStatus.RESOLVED, SupportTicket.SupportStatus.IN_PROGRESS),
                        cutoff
                );

        if (toClose.isEmpty()) return;

        toClose.forEach(ticket -> ticket.setStatus(SupportTicket.SupportStatus.CLOSED));
        supportTicketRepository.saveAll(toClose);

        log.info("Auto-closed {} ticket(s) (RESOLVED/IN_PROGRESS) quá {} ngày không hoạt động",
                toClose.size(), AUTO_CLOSE_DAYS);
    }
}
