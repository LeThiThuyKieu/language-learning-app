package com.languagelearning.controller.admin;

import com.languagelearning.dto.ApiResponse;
import com.languagelearning.dto.faq.FaqDto;
import com.languagelearning.service.FaqService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/faq")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class FaqManagementController {

    private final FaqService faqService;

    /** Admin xem toàn bộ FAQ (kể cả INACTIVE). */
    @GetMapping
    public ResponseEntity<ApiResponse<List<FaqDto>>> getAllFaqs() {
        List<FaqDto> data = faqService.getAllFaqs();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách FAQ thành công", data));
    }
}
