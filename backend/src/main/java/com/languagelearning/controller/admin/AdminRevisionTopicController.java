package com.languagelearning.controller.admin;

import com.languagelearning.dto.ApiResponse;
import com.languagelearning.dto.admin.revision.AdminTopicDetailDto;
import com.languagelearning.dto.admin.revision.AdminTopicListItemDto;
import com.languagelearning.service.admin.AdminRevisionTopicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/revision/topics")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminRevisionTopicController {

    private final AdminRevisionTopicService adminRevisionTopicService;

    /** Danh sách tất cả topic kèm số task và số câu hỏi. */
    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminTopicListItemDto>>> getAllTopics() {
        return ResponseEntity.ok(
                ApiResponse.success("Lấy danh sách topic thành công",
                        adminRevisionTopicService.getAllTopics()));
    }

    /** Chi tiết 1 topic: thông tin + danh sách task kèm số câu hỏi. */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminTopicDetailDto>> getTopicDetail(@PathVariable Integer id) {
        return ResponseEntity.ok(
                ApiResponse.success("Lấy chi tiết topic thành công",
                        adminRevisionTopicService.getTopicDetail(id)));
    }
}
