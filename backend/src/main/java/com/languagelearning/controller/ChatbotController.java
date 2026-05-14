package com.languagelearning.controller;

import com.languagelearning.dto.ApiResponse;
import com.languagelearning.dto.chatbot.*;
import com.languagelearning.service.ChatbotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;

    /**
     * Chatbox gọi để match keyword trước khi tạo ticket.
     * Không cần auth vì user có thể chưa đăng nhập.
     */
    @PostMapping("/public/chatbot/match")
    public ResponseEntity<ApiResponse<ChatbotMatchResponse>> match(
            @Valid @RequestBody ChatbotMatchRequest request
    ) {
        ChatbotMatchResponse result = chatbotService.match(request);
        return ResponseEntity.ok(ApiResponse.success("OK", result));
    }

    @GetMapping("/admin/chatbot/rules")
    public ResponseEntity<ApiResponse<List<ChatbotRuleDto>>> getAllRules() {
        return ResponseEntity.ok(ApiResponse.success("OK", chatbotService.getAllRules()));
    }

    @GetMapping("/admin/chatbot/rules/{id}")
    public ResponseEntity<ApiResponse<ChatbotRuleDto>> getRule(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success("OK", chatbotService.getRule(id)));
    }

    @PostMapping("/admin/chatbot/rules")
    public ResponseEntity<ApiResponse<ChatbotRuleDto>> createRule(
            @Valid @RequestBody ChatbotRuleRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Tạo rule thành công", chatbotService.createRule(request)));
    }

    @PutMapping("/admin/chatbot/rules/{id}")
    public ResponseEntity<ApiResponse<ChatbotRuleDto>> updateRule(
            @PathVariable Integer id,
            @Valid @RequestBody ChatbotRuleRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật rule thành công", chatbotService.updateRule(id, request)));
    }

    @DeleteMapping("/admin/chatbot/rules/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRule(@PathVariable Integer id) {
        chatbotService.deleteRule(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa rule thành công", null));
    }

    @PatchMapping("/admin/chatbot/rules/{id}/toggle")
    public ResponseEntity<ApiResponse<ChatbotRuleDto>> toggleActive(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thành công", chatbotService.toggleActive(id)));
    }
}
