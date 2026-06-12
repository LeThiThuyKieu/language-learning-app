package com.languagelearning.dto.admin.revision;

import lombok.Data;

@Data
public class ReorderMongoItemRequest {
    private String mongoId;
    private Integer orderIndex;
}
