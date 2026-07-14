package com.languagelearning.controller.admin;

import com.languagelearning.dto.ApiResponse;
import com.languagelearning.dto.admin.exam_management.ExamQuestionDetailDto;
import com.languagelearning.dto.admin.exam_management.ExamQuestionSaveRequest;
import com.languagelearning.service.admin.AdminExamQuestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/exam-questions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminExamQuestionController {

    private final AdminExamQuestionService questionService;

    /**
     * GET /api/admin/exam-questions/{id}
     * Chi tiết 1 câu hỏi (MySQL + MongoDB).
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ExamQuestionDetailDto>> getDetail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("OK", questionService.getDetail(id)));
    }

    /**
     * GET /api/admin/exam-questions/by-part/{partId}
     * Danh sách câu hỏi theo part.
     */
    @GetMapping("/by-part/{partId}")
    public ResponseEntity<ApiResponse<List<ExamQuestionDetailDto>>> getByPart(@PathVariable Integer partId) {
        return ResponseEntity.ok(ApiResponse.success("OK", questionService.getQuestionsByPart(partId)));
    }

    /**
     * POST /api/admin/exam-questions
     * Tạo câu hỏi mới (chỉ LISTENING hoặc READING_WRITING).
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ExamQuestionDetailDto>> create(
            @Valid @RequestBody ExamQuestionSaveRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Tạo câu hỏi thành công", questionService.createQuestion(request)));
    }

    /**
     * PUT /api/admin/exam-questions/{id}
     * Cập nhật câu hỏi.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ExamQuestionDetailDto>> update(
            @PathVariable Long id,
            @Valid @RequestBody ExamQuestionSaveRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật câu hỏi thành công", questionService.updateQuestion(id, request)));
    }

    /**
     * DELETE /api/admin/exam-questions/{id}
     * Xóa câu hỏi (xóa cả MongoDB document và MySQL index).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        questionService.deleteQuestion(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa câu hỏi", null));
    }
}
