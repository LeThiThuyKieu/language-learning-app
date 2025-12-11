package com.languagelearning.document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "review_sets")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewSet {
    @Id
    private String id;

    @Indexed
    private Integer skillTreeId;
    private List<Integer> nodeIds;

    /**
     * Danh sách questionId dùng cho review node (10 câu random)
     */
    private List<String> questionIds;

    /**
     * Quy tắc chọn (vd: "random-10-of-40")
     */
    private String selectionRule;
    private List<String> tags;
}

