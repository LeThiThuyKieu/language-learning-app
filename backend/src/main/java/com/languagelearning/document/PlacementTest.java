package com.languagelearning.document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "placement_tests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlacementTest {
    @Id
    private String id;

    private String title;
    private String description;

    /**
     * Danh sách questionId (15 câu: 5/5/5)
     */
    private List<String> questionIds;

    /**
     * Cấu hình tỉ lệ / số lượng theo nhóm BEGINNER / INTERMEDIATE / ADVANCED
     */
    private List<String> groups;
}

