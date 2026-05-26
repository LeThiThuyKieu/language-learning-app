package com.languagelearning.controller;

import com.languagelearning.dto.support.SupportTicketDetailDto;
import com.languagelearning.service.support.SupportService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

/**
 * Xử lý WebSocket STOMP cho chat hỗ trợ.
 *
 * Flow:
 *  - User gửi tin: POST /api/users/support/tickets/{id}/messages  → service lưu DB
 *    → broadcast tới /topic/support/{ticketId}
 *  - Admin reply: POST /api/admin/support-management/tickets/{id}/reply → service lưu DB
 *    → broadcast tới /topic/support/{ticketId}
 *
 * Các REST endpoint hiện tại vẫn giữ nguyên; chỉ thêm broadcast sau khi lưu.
 */
@Controller
@RequiredArgsConstructor
public class SupportWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final SupportService supportService;

    /**
     * Broadcast cập nhật ticket tới tất cả subscriber của topic.
     * Được gọi từ SupportService sau mỗi thao tác tạo/gửi tin nhắn.
     */
    public void broadcastTicketUpdate(SupportTicketDetailDto ticket) {
        messagingTemplate.convertAndSend(
                "/topic/support/" + ticket.getId(),
                ticket
        );
    }
}
