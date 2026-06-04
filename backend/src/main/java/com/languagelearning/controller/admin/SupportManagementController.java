package com.languagelearning.controller.admin;

import com.languagelearning.dto.ApiResponse;
import com.languagelearning.dto.support.*;
import com.languagelearning.service.support.SupportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/admin/support-management")
@RequiredArgsConstructor
public class SupportManagementController {

    private final SupportService supportService;

    /**
     * Lấy danh sách ticket với filter và phân trang.
     * Hỗ trợ filter theo: status, categoryId, keyword (tên/email), source (CHAT/EMAIL).
     */
    @GetMapping("/tickets")
    public ResponseEntity<ApiResponse<Page<SupportTicketListItemDto>>> getTickets(
            Authentication authentication,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String source,       // CHAT hoặc EMAIL
            @RequestParam(defaultValue = "desc") String sort,    // desc = mới nhất trước
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        String email = authentication.getName();
        Page<SupportTicketListItemDto> data = supportService.getAdminTickets(email, status, categoryId, keyword, source, sort, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách ticket thành công", data));
    }

    /**
     * Lấy chi tiết ticket cho admin (chỉ đọc, không thay đổi status).
     * Dùng để poll tin nhắn mới trong chat panel.
     */
    @GetMapping("/tickets/{ticketId}")
    public ResponseEntity<ApiResponse<SupportTicketDetailDto>> getTicketDetail(
            Authentication authentication,
            @PathVariable Integer ticketId
    ) {
        String email = authentication.getName();
        SupportTicketDetailDto data = supportService.getAdminTicketDetail(email, ticketId);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết ticket thành công", data));
    }

    /**
     * Lấy lịch sử gửi email phản hồi của ticket (support_email_log).
     */
    @GetMapping("/tickets/{ticketId}/email-logs")
    public ResponseEntity<ApiResponse<List<SupportEmailLogDto>>> getTicketEmailLogs(
            Authentication authentication,
            @PathVariable Integer ticketId
    ) {
        String email = authentication.getName();
        List<SupportEmailLogDto> data = supportService.getTicketEmailLogs(email, ticketId);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử email thành công", data));
    }

    /**
     * Admin mở xem ticket lần đầu → tự động chuyển OPEN sang IN_PROGRESS.
     * Trả về full conversation kèm toàn bộ messages.
     */
    @PostMapping("/tickets/{ticketId}/view")
    public ResponseEntity<ApiResponse<SupportTicketDetailDto>> viewTicket(
            Authentication authentication,
            @PathVariable Integer ticketId
    ) {
        String email = authentication.getName();
        SupportTicketDetailDto data = supportService.viewTicketAsAdmin(email, ticketId);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết ticket thành công", data));
    }

    /**
     * Admin gửi phản hồi vào ticket.
     * Có thể kèm status mới trong request body để cập nhật trạng thái cùng lúc.
     * Nếu ticket là CHAT, không gửi email thông báo.
     */
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

    /**
     * Admin cập nhật trạng thái ticket mà không gửi tin nhắn phản hồi.
     * Dùng cho nút "Hoàn tất" (chuyển sang RESOLVED) hoặc "Đóng" (CLOSED).
     */
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
