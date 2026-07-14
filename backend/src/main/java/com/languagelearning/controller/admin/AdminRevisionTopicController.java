package com.languagelearning.controller.admin;

import com.languagelearning.dto.ApiResponse;
import com.languagelearning.dto.admin.revision.*;
import com.languagelearning.entity.GeneralRevisionTopic;
import com.languagelearning.repository.mysql.GeneralRevisionTopicRepository;
import com.languagelearning.service.QuestionMediaUploadService;
import com.languagelearning.service.admin.AdminRevisionTopicService;
import com.languagelearning.service.admin.QuestionImportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin/revision/topics")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminRevisionTopicController {

    private final AdminRevisionTopicService adminRevisionTopicService;
    private final QuestionMediaUploadService questionMediaUploadService;
    private final GeneralRevisionTopicRepository generalRevisionTopicRepository;
    private final QuestionImportService questionImportService;

    // ══════════════════════════ TOPIC ═══════════════════════════════════════

    /** GET /api/admin/revision/topics — danh sách tất cả topic */
    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminTopicListItemDto>>> getAllTopics() {
        return ResponseEntity.ok(
                ApiResponse.success("Lấy danh sách topic thành công",
                        adminRevisionTopicService.getAllTopics()));
    }

    /** GET /api/admin/revision/topics/{id} — chi tiết topic + tasks */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminTopicDetailDto>> getTopicDetail(@PathVariable Integer id) {
        return ResponseEntity.ok(
                ApiResponse.success("Lấy chi tiết topic thành công",
                        adminRevisionTopicService.getTopicDetail(id)));
    }

    /** POST /api/admin/revision/topics — tạo topic mới */
    @PostMapping
    public ResponseEntity<ApiResponse<AdminTopicListItemDto>> createTopic(
            @Valid @RequestBody SaveTopicRequest req) {
        AdminTopicListItemDto created = adminRevisionTopicService.createTopic(req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo topic thành công", created));
    }

    /** PUT /api/admin/revision/topics/{id} — cập nhật topic */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminTopicListItemDto>> updateTopic(
            @PathVariable Integer id,
            @Valid @RequestBody SaveTopicRequest req) {
        AdminTopicListItemDto updated = adminRevisionTopicService.updateTopic(id, req);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật topic thành công", updated));
    }

    /** DELETE /api/admin/revision/topics/{id} — xóa topic */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTopic(@PathVariable Integer id) {
        adminRevisionTopicService.deleteTopic(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa topic thành công", null));
    }

    /** PUT /api/admin/revision/topics/reorder — lưu thứ tự topics */
    @PutMapping("/reorder")
    public ResponseEntity<ApiResponse<Void>> reorderTopics(
            @RequestBody List<ReorderItemRequest> items) {
        adminRevisionTopicService.reorderTopics(items);
        return ResponseEntity.ok(ApiResponse.success("Đã lưu thứ tự topic", null));
    }

    // ══════════════════════════ TASK ════════════════════════════════════════

    /** GET /api/admin/revision/topics/{topicId}/tasks — danh sách tasks */
    @GetMapping("/{topicId}/tasks")
    public ResponseEntity<ApiResponse<List<AdminTaskDetailDto>>> getTasksByTopic(
            @PathVariable Integer topicId) {
        return ResponseEntity.ok(
                ApiResponse.success("Lấy danh sách task thành công",
                        adminRevisionTopicService.getTasksByTopic(topicId)));
    }

    /** GET /api/admin/revision/topics/{topicId}/tasks/{taskId} — chi tiết task */
    @GetMapping("/{topicId}/tasks/{taskId}")
    public ResponseEntity<ApiResponse<AdminTaskDetailDto>> getTaskDetail(
            @PathVariable Integer topicId,
            @PathVariable Integer taskId) {
        return ResponseEntity.ok(
                ApiResponse.success("Lấy chi tiết task thành công",
                        adminRevisionTopicService.getTaskDetail(topicId, taskId)));
    }

    /** POST /api/admin/revision/topics/{topicId}/tasks — tạo task mới */
    @PostMapping("/{topicId}/tasks")
    public ResponseEntity<ApiResponse<AdminTaskDetailDto>> createTask(
            @PathVariable Integer topicId,
            @Valid @RequestBody SaveTaskRequest req) {
        AdminTaskDetailDto created = adminRevisionTopicService.createTask(topicId, req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo task thành công", created));
    }

    /** PUT /api/admin/revision/topics/{topicId}/tasks/{taskId} — cập nhật task */
    @PutMapping("/{topicId}/tasks/{taskId}")
    public ResponseEntity<ApiResponse<AdminTaskDetailDto>> updateTask(
            @PathVariable Integer topicId,
            @PathVariable Integer taskId,
            @Valid @RequestBody SaveTaskRequest req) {
        AdminTaskDetailDto updated = adminRevisionTopicService.updateTask(topicId, taskId, req);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật task thành công", updated));
    }

    /** DELETE /api/admin/revision/topics/{topicId}/tasks/{taskId} — xóa task */
    @DeleteMapping("/{topicId}/tasks/{taskId}")
    public ResponseEntity<ApiResponse<Void>> deleteTask(
            @PathVariable Integer topicId,
            @PathVariable Integer taskId) {
        adminRevisionTopicService.deleteTask(topicId, taskId);
        return ResponseEntity.ok(ApiResponse.success("Xóa task thành công", null));
    }

    /** PUT /api/admin/revision/topics/{topicId}/tasks/reorder — lưu thứ tự tasks */
    @PutMapping("/{topicId}/tasks/reorder")
    public ResponseEntity<ApiResponse<Void>> reorderTasks(
            @PathVariable Integer topicId,
            @RequestBody List<ReorderItemRequest> items) {
        adminRevisionTopicService.reorderTasks(topicId, items);
        return ResponseEntity.ok(ApiResponse.success("Đã lưu thứ tự task", null));
    }

    // ══════════════════════════ QUESTION ════════════════════════════════════

    /** GET /api/admin/revision/topics/{topicId}/tasks/{taskId}/questions */
    @GetMapping("/{topicId}/tasks/{taskId}/questions")
    public ResponseEntity<ApiResponse<List<AdminQuestionDto>>> getQuestions(
            @PathVariable Integer topicId,
            @PathVariable Integer taskId) {
        return ResponseEntity.ok(
                ApiResponse.success("Lấy danh sách câu hỏi thành công",
                        adminRevisionTopicService.getQuestionsByTask(topicId, taskId)));
    }

    /** GET /api/admin/revision/topics/{topicId}/tasks/{taskId}/questions/{mongoId} */
    @GetMapping("/{topicId}/tasks/{taskId}/questions/{mongoId}")
    public ResponseEntity<ApiResponse<AdminQuestionDto>> getQuestion(
            @PathVariable Integer topicId,
            @PathVariable Integer taskId,
            @PathVariable String mongoId) {
        return ResponseEntity.ok(
                ApiResponse.success("Lấy chi tiết câu hỏi thành công",
                        adminRevisionTopicService.getQuestion(topicId, taskId, mongoId)));
    }

    /** POST /api/admin/revision/topics/{topicId}/tasks/{taskId}/questions */
    @PostMapping("/{topicId}/tasks/{taskId}/questions")
    public ResponseEntity<ApiResponse<AdminQuestionDto>> createQuestion(
            @PathVariable Integer topicId,
            @PathVariable Integer taskId,
            @Valid @RequestBody SaveQuestionRequest req) {
        AdminQuestionDto created = adminRevisionTopicService.createQuestion(topicId, taskId, req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo câu hỏi thành công", created));
    }

    /** PUT /api/admin/revision/topics/{topicId}/tasks/{taskId}/questions/{mongoId} */
    @PutMapping("/{topicId}/tasks/{taskId}/questions/{mongoId}")
    public ResponseEntity<ApiResponse<AdminQuestionDto>> updateQuestion(
            @PathVariable Integer topicId,
            @PathVariable Integer taskId,
            @PathVariable String mongoId,
            @Valid @RequestBody SaveQuestionRequest req) {
        AdminQuestionDto updated = adminRevisionTopicService.updateQuestion(topicId, taskId, mongoId, req);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật câu hỏi thành công", updated));
    }

    /** DELETE /api/admin/revision/topics/{topicId}/tasks/{taskId}/questions/{mongoId} */
    @DeleteMapping("/{topicId}/tasks/{taskId}/questions/{mongoId}")
    public ResponseEntity<ApiResponse<Void>> deleteQuestion(
            @PathVariable Integer topicId,
            @PathVariable Integer taskId,
            @PathVariable String mongoId) {
        adminRevisionTopicService.deleteQuestion(topicId, taskId, mongoId);
        return ResponseEntity.ok(ApiResponse.success("Xóa câu hỏi thành công", null));
    }

    /** PUT /api/admin/revision/topics/{topicId}/tasks/{taskId}/questions/reorder — lưu thứ tự questions */
    @PutMapping("/{topicId}/tasks/{taskId}/questions/reorder")
    public ResponseEntity<ApiResponse<Void>> reorderQuestions(
            @PathVariable Integer topicId,
            @PathVariable Integer taskId,
            @RequestBody List<ReorderMongoItemRequest> items) {
        adminRevisionTopicService.reorderQuestions(topicId, taskId, items);
        return ResponseEntity.ok(ApiResponse.success("Đã lưu thứ tự câu hỏi", null));
    }

    // ══════════════════════════ IMPORT ══════════════════════════════════════

    /**
     * POST /api/admin/revision/topics/{topicId}/tasks/{taskId}/questions/import
     * Import câu hỏi từ file Excel (.xlsx) vào task cụ thể.
     * Chỉ import sheet khớp với questionType của task.
     */
    @PostMapping("/{topicId}/tasks/{taskId}/questions/import")
    public ResponseEntity<ApiResponse<ImportResultDto>> importQuestions(
            @PathVariable Integer topicId,
            @PathVariable Integer taskId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "mode", required = false) String mode) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("File không được để trống"));
        }
        String filename = file.getOriginalFilename();
        if (filename == null || (!filename.toLowerCase().endsWith(".xlsx") && !filename.toLowerCase().endsWith(".xls"))) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Chỉ hỗ trợ file Excel (.xlsx hoặc .xls)"));
        }
        ImportResultDto result = questionImportService.importQuestions(topicId, taskId, file, mode);
        String msg = "Import hoàn tất: " + result.getImported() + " câu hỏi"
                + (result.getErrors().isEmpty() ? "" : " (" + result.getErrors().size() + " lỗi)");
        return ResponseEntity.ok(ApiResponse.success(msg, result));
    }

    // ══════════════════════════ MEDIA UPLOAD ════════════════════════════════

    /**
     * POST /api/admin/revision/topics/{topicId}/upload/image
     * Upload ảnh câu hỏi lên Cloudinary → img_file/question/{topicTitle}
     */
    @PostMapping("/{topicId}/upload/image")
    public ResponseEntity<ApiResponse<String>> uploadQuestionImage(
            @PathVariable Integer topicId,
            @RequestParam("file") MultipartFile file) {
        GeneralRevisionTopic topic = generalRevisionTopicRepository.findById(topicId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy topic: " + topicId));
        String url = questionMediaUploadService.uploadQuestionImage(file, topic.getTitle());
        return ResponseEntity.ok(ApiResponse.success("Upload ảnh thành công", url));
    }

    /**
     * POST /api/admin/revision/topics/{topicId}/upload/audio
     * Upload audio câu hỏi lên Cloudinary → audio_file/general_revision/{topicTitle}
     */
    @PostMapping("/{topicId}/upload/audio")
    public ResponseEntity<ApiResponse<String>> uploadQuestionAudio(
            @PathVariable Integer topicId,
            @RequestParam("file") MultipartFile file) {
        GeneralRevisionTopic topic = generalRevisionTopicRepository.findById(topicId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy topic: " + topicId));
        String url = questionMediaUploadService.uploadQuestionAudio(file, topic.getTitle());
        return ResponseEntity.ok(ApiResponse.success("Upload audio thành công", url));
    }
}
