package com.languagelearning.controller.admin;

import com.languagelearning.dto.ApiResponse;
import com.languagelearning.dto.admin.general_revision.GeneralRevisionProgressDetailDto;
import com.languagelearning.dto.admin.general_revision.GeneralRevisionProgressSummaryDto;
import com.languagelearning.service.admin.GeneralRevisionProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/general-revision-progress")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class GeneralRevisionProgressController {

    private final GeneralRevisionProgressService generalRevisionProgressService;

    /** Danh sách tóm tắt tiến trình ôn tập của tất cả user */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<GeneralRevisionProgressSummaryDto>>> getSummaryList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search
    ) {
        return ResponseEntity.ok(ApiResponse.success("OK",
                generalRevisionProgressService.getSummaryList(page, size, search)));
    }

    /** Chi tiết tiến trình ôn tập của một user */
    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<GeneralRevisionProgressDetailDto>> getDetail(
            @PathVariable Integer userId
    ) {
        return ResponseEntity.ok(ApiResponse.success("OK",
                generalRevisionProgressService.getDetail(userId)));
    }
}
