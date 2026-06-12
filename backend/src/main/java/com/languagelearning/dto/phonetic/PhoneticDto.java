package com.languagelearning.dto.phonetic;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PhoneticDto {
    private Integer id;
    // Ký hiệu IPA
    private String symbol;
    // "VOWEL" hoặc "CONSONANT"
    private String type;
    private String exampleWord;
    private String audioUrl;
    private Integer displayOrder;
}
