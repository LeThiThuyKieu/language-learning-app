package com.languagelearning.controller;

import com.languagelearning.dto.ApiResponse;
import com.languagelearning.dto.support.SupportCreateTicketRequest;
import com.languagelearning.dto.support.SupportTicketDetailDto;
import com.languagelearning.service.SupportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final SupportService supportService;

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> healthCheck() {
        Map<String, Object> data = new HashMap<>();
        data.put("status", "UP");
        data.put("timestamp", LocalDateTime.now());
        data.put("service", "Language Learning App API");
        data.put("version", "1.0.0");
        
        return ResponseEntity.ok(ApiResponse.success("API is running", data));
    }

    // Endpoint công khai cho guest gửi ticket hỗ trợ (không cần đăng nhập).
    @PostMapping("/support/tickets")
    public ResponseEntity<ApiResponse<SupportTicketDetailDto>> createGuestTicket(
            @Valid @RequestBody SupportCreateTicketRequest request
    ) {
        SupportTicketDetailDto data = supportService.createTicketForGuest(request);
        return ResponseEntity.ok(ApiResponse.success("Gửi yêu cầu hỗ trợ thành công", data));
    }
}

