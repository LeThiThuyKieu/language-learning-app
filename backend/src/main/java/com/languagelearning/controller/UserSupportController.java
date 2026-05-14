package com.languagelearning.controller;

import com.languagelearning.dto.ApiResponse;
import com.languagelearning.dto.support.SupportCreateTicketRequest;
import com.languagelearning.dto.support.SupportReplyRequest;
import com.languagelearning.dto.support.SupportTicketDetailDto;
import com.languagelearning.dto.support.SupportTicketListItemDto;
import com.languagelearning.service.SupportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users/support")
@RequiredArgsConstructor
public class UserSupportController {

    private final SupportService supportService;

    /**
     * Lấy danh sách ticket còn mở (OPEN/IN_PROGRESS/RESOLVED) của user theo category.
     * Dùng cho chatbox để gợi ý tiếp tục ticket cũ thay vì tạo mới.
     */
    @GetMapping("/tickets/active")
    public ResponseEntity<ApiResponse<List<SupportTicketListItemDto>>> getActiveByCategory(
            Authentication authentication,
            @RequestParam Integer categoryId
    ) {
        String email = authentication.getName(); // lấy email từ JWT token
        List<SupportTicketListItemDto> data = supportService.getActiveTicketsByCategory(email, categoryId);
        return ResponseEntity.ok(ApiResponse.success("Lấy ticket đang mở thành công", data));
    }


//     Tạo ticket hỗ trợ mới kèm tin nhắn đầu tiên từ user.

    @PostMapping("/tickets")
    public ResponseEntity<ApiResponse<SupportTicketDetailDto>> createTicket(
            Authentication authentication,
            @Valid @RequestBody SupportCreateTicketRequest request
    ) {
        String email = authentication.getName();
        SupportTicketDetailDto data = supportService.createTicketForUser(email, request);
        return ResponseEntity.ok(ApiResponse.success("Tạo ticket hỗ trợ thành công", data));
    }

     // Lấy danh sách tất cả ticket hỗ trợ của user hiện tại, sắp xếp mới nhất trước.

    @GetMapping("/tickets")
    public ResponseEntity<ApiResponse<List<SupportTicketListItemDto>>> getMyTickets(Authentication authentication) {
        String email = authentication.getName();
        List<SupportTicketListItemDto> data = supportService.getMyTickets(email);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách ticket thành công", data));
    }

    /**
     * Lấy chi tiết một ticket của user hiện tại kèm toàn bộ hội thoại.
     * Dùng để khôi phục chat sau khi reload trang.
     */
    @GetMapping("/tickets/{ticketId}")
    public ResponseEntity<ApiResponse<SupportTicketDetailDto>> getMyTicketDetail(
            Authentication authentication,
            @PathVariable Integer ticketId
    ) {
        String email = authentication.getName();
        SupportTicketDetailDto data = supportService.getMyTicketDetail(email, ticketId);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết ticket thành công", data));
    }

    /**
     * User gửi thêm tin nhắn vào ticket đang mở (follow-up message).
     * Nếu ticket đang RESOLVED, tự động chuyển lại OPEN.
     */
    @PostMapping("/tickets/{ticketId}/messages")
    public ResponseEntity<ApiResponse<SupportTicketDetailDto>> sendMessage(
            Authentication authentication,
            @PathVariable Integer ticketId,
            @Valid @RequestBody SupportReplyRequest request
    ) {
        String email = authentication.getName();
        SupportTicketDetailDto data = supportService.sendUserMessage(email, ticketId, request);
        return ResponseEntity.ok(ApiResponse.success("Gửi tin nhắn thành công", data));
    }
}
