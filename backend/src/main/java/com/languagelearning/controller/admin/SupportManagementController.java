package com.languagelearning.controller.admin;

import com.languagelearning.dto.ApiResponse;
import com.languagelearning.dto.support.*;
import com.languagelearning.service.SupportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/support-management")
@RequiredArgsConstructor
public class SupportManagementController {
    private final SupportService supportService;

    // Lấy danh sách ticket cho admin với filter và phân trang.
    @GetMapping("/tickets")
    public ResponseEntity<ApiResponse<Page<SupportTicketListItemDto>>> getTickets(
            Authentication authentication,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String source,
            @RequestParam(defaultValue = "desc") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        String email = authentication.getName();
        Page<SupportTicketListItemDto> data = supportService.getAdminTickets(email, status, categoryId, keyword, source, sort, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách ticket thành công", data));
    }

    // Lấy chi tiết ticket cho admin (chỉ đọc, không đổi status).
    @GetMapping("/tickets/{ticketId}")
    public ResponseEntity<ApiResponse<SupportTicketDetailDto>> getTicketDetail(
            Authentication authentication,
            @PathVariable Integer ticketId
    ) {
        String email = authentication.getName();
        SupportTicketDetailDto data = supportService.getAdminTicketDetail(email, ticketId);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết ticket thành công", data));
    }

    // Admin mở xem ticket → tự động chuyển OPEN sang IN_PROGRESS.
    @PostMapping("/tickets/{ticketId}/view")
    public ResponseEntity<ApiResponse<SupportTicketDetailDto>> viewTicket(
            Authentication authentication,
            @PathVariable Integer ticketId
    ) {
        String email = authentication.getName();
        SupportTicketDetailDto data = supportService.viewTicketAsAdmin(email, ticketId);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết ticket thành công", data));
    }

    // Admin phản hồi ticket và có thể cập nhật trạng thái ticket trong cùng request.
    @PostMapping("/tickets/{ticketId}/reply")
    public ResponseEntity<ApiResponse<SupportTicketDetailDto>> replyTicket(
            Authentication authentication,
            @PathVariable Integer ticketId,
            @Valid @RequestBody SupportReplyRequest request
    ) {
        String email = authentication.getName();
        SupportTicketDetailDto data = supportService.replyTicketAsAdmin(email, ticketId, request);
        return ResponseEntity.ok(ApiResponse.success("Gửi phản hồi hỗ trợ thành công", data));
    }

    // Admin cập nhật trạng thái ticket mà không gửi nội dung phản hồi.
    @PatchMapping("/tickets/{ticketId}/status")
    public ResponseEntity<ApiResponse<SupportTicketDetailDto>> updateStatus(
            Authentication authentication,
            @PathVariable Integer ticketId,
            @Valid @RequestBody SupportUpdateStatusRequest request
    ) {
        String email = authentication.getName();
        SupportTicketDetailDto data = supportService.updateTicketStatusAsAdmin(email, ticketId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái ticket thành công", data));
    }
}
