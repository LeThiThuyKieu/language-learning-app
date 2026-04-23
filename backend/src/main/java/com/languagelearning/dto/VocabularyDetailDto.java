package com.languagelearning.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Trả về cho Frontend: từ + nghĩa tiếng Việt + phiên âm IPA.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VocabularyDetailDto {
    private String word;
    private String meaning;
    private String phonetic;
}
