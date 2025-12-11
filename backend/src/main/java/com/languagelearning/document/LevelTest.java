package com.languagelearning.document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "level_tests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LevelTest {
    @Id
    private String id;

    @Indexed
    private Integer levelId;

    /**
     * 20 câu: 5 vocab, 5 listening, 5 speaking, 5 matching
     */
    private List<String> questionIds;

    /**
     * Cấu hình trộn, ví dụ: {"VOCAB":5,"LISTENING":5,"SPEAKING":5,"MATCHING":5}
     */
    private String questionMixJson;

    private List<String> tags;
}

