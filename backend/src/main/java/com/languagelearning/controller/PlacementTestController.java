package com.languagelearning.controller;

import com.languagelearning.dto.ApiResponse;
import com.languagelearning.dto.placement.*;
import com.languagelearning.service.PlacementTestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * API Placement Test (JWT): bốc câu theo level, nộp chấm điểm, adaptive, xem kết quả.
 */
@RestController
@RequestMapping("/api/placement-test")
@RequiredArgsConstructor
public class PlacementTestController {

    private final PlacementTestService placementTestService;

    /** Mở phiên test, trả testId. */
    @PostMapping("/start")
    public ResponseEntity<ApiResponse<PlacementStartResponse>> start(Authentication authentication) {
        PlacementStartResponse data = placementTestService.startSession(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("OK", data));
    }

    /** 5 câu vocab ngẫu nhiên theo level (1–3). */
    @GetMapping("/vocab")
    public ResponseEntity<ApiResponse<List<PlacementVocabItemDto>>> vocab(
            Authentication authentication,
            @RequestParam Integer testId,
            @RequestParam int level
    ) {
        List<PlacementVocabItemDto> data = placementTestService.getVocab(authentication.getName(), testId, level);
        return ResponseEntity.ok(ApiResponse.success("OK", data));
    }

    /** 5 cặp matching ngẫu nhiên theo level (1-3) đã shuffle hai cột. */
    @GetMapping("/matching")
    public ResponseEntity<ApiResponse<PlacementMatchingResponse>> matching(
            Authentication authentication,
            @RequestParam Integer testId,
            @RequestParam int level
    ) {
        PlacementMatchingResponse data = placementTestService.getMatching(authentication.getName(), testId, level);
        return ResponseEntity.ok(ApiResponse.success("OK", data));
    }

    /** 1 bài listening */
    @GetMapping("/listening")
    public ResponseEntity<ApiResponse<PlacementListeningResponse>> listening(
            Authentication authentication,
            @RequestParam Integer testId,
            @RequestParam int level
    ) {
        PlacementListeningResponse data = placementTestService.getListening(authentication.getName(), testId, level);
        return ResponseEntity.ok(ApiResponse.success("OK", data));
    }

    /** 1 bài speaking theo level. */
    @GetMapping("/speaking")
    public ResponseEntity<ApiResponse<PlacementSpeakingResponse>> speaking(
            Authentication authentication,
            @RequestParam Integer testId,
            @RequestParam int level
    ) {
        PlacementSpeakingResponse data = placementTestService.getSpeaking(authentication.getName(), testId, level);
        return ResponseEntity.ok(ApiResponse.success("OK", data));
    }

    /** Nộp bài test */
    @PostMapping("/submit-section")
    public ResponseEntity<ApiResponse<PlacementSubmitResponse>> submitSection(
            Authentication authentication,
            @RequestBody PlacementSubmitRequest body
    ) {
        PlacementSubmitResponse data = placementTestService.submitSection(authentication.getName(), body);
        return ResponseEntity.ok(ApiResponse.success("OK", data));
    }

    /** Điểm chi tiết + xếp lớp (thang 160). */
    @GetMapping("/result/{testId}")
    public ResponseEntity<ApiResponse<PlacementResultResponse>> result(
            Authentication authentication,
            @PathVariable Integer testId
    ) {
        PlacementResultResponse data = placementTestService.getResult(authentication.getName(), testId);
        return ResponseEntity.ok(ApiResponse.success("OK", data));
    }
}
