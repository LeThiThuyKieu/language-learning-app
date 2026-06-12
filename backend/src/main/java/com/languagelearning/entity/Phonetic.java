package com.languagelearning.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "phonetics")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Phonetic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Ký hiệu IPA
    @Column(nullable = false, length = 10)
    private String symbol;

    // VOWEL = Nguyên âm, CONSONANT = Phụ âm
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PhoneticType type;

    // Từ ví dụ minh hoạ âm này
    @Column(name = "example_word", nullable = false, length = 50)
    private String exampleWord;

    // URL audio phát âm
    @Column(name = "audio_url", length = 255)
    private String audioUrl;

    // Thứ tự hiển thị trong nhóm
    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    public enum PhoneticType {
        VOWEL, CONSONANT
    }
}
