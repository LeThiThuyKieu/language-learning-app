package com.languagelearning.document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Lưu nghĩa + phiên âm của từ vựng vào MongoDB để tránh gọi API ngoài lặp lại.
 * TTL index tự xóa sau 30 ngày nếu không được truy cập.
 */
@Document(collection = "vocabulary_cache")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VocabularyCache {

    @Id
    private String id;

    @Indexed(unique = true)
    private String word;          // từ gốc (lowercase)

    private String meaning;       // nghĩa tiếng Việt
    private String phonetic;      // phiên âm IPA, ví dụ /ˈæntɪbaɪɒtɪk/

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
}
