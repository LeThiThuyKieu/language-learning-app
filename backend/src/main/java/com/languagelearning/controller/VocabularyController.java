package com.languagelearning.controller;

import com.languagelearning.dto.VocabularyDetailDto;
import com.languagelearning.service.VocabularyLookupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * GET /api/vocabulary/details?words=antibiotic,penicillin,discovered
 *
 * Trả về map: { "antibiotic": { word, meaning, phonetic }, ... }
 * Frontend gửi batch từ, nhận về tất cả trong 1 request.
 */
@RestController
@RequestMapping("/api/vocabulary")
@RequiredArgsConstructor
public class VocabularyController {

    private final VocabularyLookupService vocabularyLookupService;

    @GetMapping("/details")
    public ResponseEntity<Map<String, VocabularyDetailDto>> getDetails(
            @RequestParam("words") String wordsParam) {

        // Parse "word1,word2,word3" → List
        List<String> words = Arrays.stream(wordsParam.split(","))
                .map(String::trim)
                .filter(w -> !w.isBlank())
                .toList();

        if (words.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Map<String, VocabularyDetailDto> result = vocabularyLookupService.lookupWords(words);
        return ResponseEntity.ok(result);
    }
}
