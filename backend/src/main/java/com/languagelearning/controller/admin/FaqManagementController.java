package com.languagelearning.controller.admin;

import com.languagelearning.dto.ApiResponse;
import com.languagelearning.dto.faq.FaqDto;
import com.languagelearning.dto.faq.FaqRequest;
import com.languagelearning.service.FaqService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

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
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách FAQ thành công", faqService.getAllFaqs()));
    }

    /** Tạo FAQ mới. */
    @PostMapping
    public ResponseEntity<ApiResponse<FaqDto>> createFaq(@Valid @RequestBody FaqRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Tạo FAQ thành công", faqService.createFaq(request)));
    }

    /** Cập nhật FAQ theo id. */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<FaqDto>> updateFaq(
            @PathVariable Integer id,
            @Valid @RequestBody FaqRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật FAQ thành công", faqService.updateFaq(id, request)));
    }

    /** Xóa FAQ theo id. */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFaq(@PathVariable Integer id) {
        faqService.deleteFaq(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa FAQ thành công", null));
    }
}
