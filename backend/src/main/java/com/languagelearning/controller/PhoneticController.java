package com.languagelearning.controller;

import com.languagelearning.dto.phonetic.PhoneticDto;
import com.languagelearning.dto.ApiResponse;
import com.languagelearning.service.PhoneticService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public/phonetics")
@RequiredArgsConstructor
public class PhoneticController {

    private final PhoneticService phoneticService;

    /**
     * GET /api/public/phonetics
     * Trả về 2 nhóm: vowels (nguyên âm) và consonants (phụ âm).
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, List<PhoneticDto>>>> getPhonetics() {
        Map<String, List<PhoneticDto>> data = phoneticService.getPhoneticsByGroup();
        return ResponseEntity.ok(ApiResponse.success("Lấy bảng phát âm thành công", data));
    }
}
