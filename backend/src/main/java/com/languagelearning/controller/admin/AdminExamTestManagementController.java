package com.languagelearning.controller.admin;

import com.languagelearning.dto.ApiResponse;
import com.languagelearning.dto.admin.exam_management.*;
import com.languagelearning.service.QuestionMediaUploadService;
import com.languagelearning.service.admin.AdminExamTestManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/exam-tests")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminExamTestManagementController {

    private final AdminExamTestManagementService examTestManagementService;
    private final QuestionMediaUploadService mediaUploadService;

    /**
     * Danh sách tất cả exam tests (có phân trang, filter by level).
     * GET /api/admin/exam-tests?page=0&size=10&level=B2
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminExamTestDto>>> getTests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String level
    ) {
        return ResponseEntity.ok(ApiResponse.success("OK", examTestManagementService.getTests(page, size, level)));
    }

    /**
     * Thống kê tổng quan.
     * GET /api/admin/exam-tests/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<ExamTestStatsDto>> getStats() {
        return ResponseEntity.ok(ApiResponse.success("OK", examTestManagementService.getStats()));
    }

    /**
     * Chi tiết 1 exam test.
     * GET /api/admin/exam-tests/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminExamTestDto>> getTestDetail(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success("OK", examTestManagementService.getTestDetail(id)));
    }

    /**
     * Tạo exam test mới.
     * POST /api/admin/exam-tests
     */
    @PostMapping
    public ResponseEntity<ApiResponse<AdminExamTestDto>> createTest(@Valid @RequestBody ExamTestCreateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Tạo exam test thành công", examTestManagementService.createTest(request)));
    }

    /**
     * Cập nhật thông tin exam test.
     * PUT /api/admin/exam-tests/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminExamTestDto>> updateTest(
            @PathVariable Integer id,
            @Valid @RequestBody ExamTestUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật exam test thành công", examTestManagementService.updateTest(id, request)));
    }

    /**
     * Toggle trạng thái active/inactive của exam test.
     * PATCH /api/admin/exam-tests/{id}/toggle-visibility
     */
    @PatchMapping("/{id}/toggle-visibility")
    public ResponseEntity<ApiResponse<AdminExamTestDto>> toggleVisibility(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success("Đã thay đổi trạng thái", examTestManagementService.toggleTestVisibility(id)));
    }

    /**
     * Cập nhật paper (audio URL, duration).
     * PUT /api/admin/exam-tests/papers/{paperId}
     */
    @PutMapping("/papers/{paperId}")
    public ResponseEntity<ApiResponse<AdminExamPaperDto>> updatePaper(
            @PathVariable Integer paperId,
            @Valid @RequestBody ExamPaperUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật paper thành công", examTestManagementService.updatePaper(paperId, request)));
    }

    /**
     * Tạo part mới trong một paper.
     * POST /api/admin/exam-tests/papers/{paperId}/parts
     */
    @PostMapping("/papers/{paperId}/parts")
    public ResponseEntity<ApiResponse<AdminExamPartDto>> createPart(
            @PathVariable Integer paperId,
            @Valid @RequestBody ExamPartCreateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Tạo part thành công", examTestManagementService.createPart(paperId, request)));
    }

    /**
     * Cập nhật thông tin part (partNumber, orderIndex).
     * PUT /api/admin/exam-tests/parts/{partId}
     */
    @PutMapping("/parts/{partId}")
    public ResponseEntity<ApiResponse<AdminExamPartDto>> updatePart(
            @PathVariable Integer partId,
            @Valid @RequestBody ExamPartUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật part thành công", examTestManagementService.updatePart(partId, request)));
    }

    /**
     * Upload audio file cho Listening paper lên Cloudinary.
     * Lưu trong thư mục: audio_file/exam/{cefrLevel}/{testTitle}
     * POST /api/admin/exam-tests/papers/{paperId}/upload-audio
     */
    @PostMapping(value = "/papers/{paperId}/upload-audio", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<String>> uploadPaperAudio(
            @PathVariable Integer paperId,
            @RequestParam("file") MultipartFile file
    ) {
        String audioUrl = examTestManagementService.uploadPaperAudio(paperId, file, mediaUploadService);
        return ResponseEntity.ok(ApiResponse.success("Upload audio thành công", audioUrl));
    }

    /**
     * Upload ảnh câu hỏi lên Cloudinary.
     * Lưu trong thư mục: img_file/exam/{cefrLevel}/{testTitle}
     * Ví dụ: img_file/exam/A2/Test 1
     * POST /api/admin/exam-tests/parts/{partId}/upload-image
     */
    @PostMapping(value = "/parts/{partId}/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<String>> uploadExamImage(
            @PathVariable Integer partId,
            @RequestParam("file") MultipartFile file
    ) {
        String imageUrl = examTestManagementService.uploadExamImage(partId, file, mediaUploadService);
        return ResponseEntity.ok(ApiResponse.success("Upload ảnh thành công", imageUrl));
    }
}
