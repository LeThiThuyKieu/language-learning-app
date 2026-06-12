package com.languagelearning.dto.admin.revision;

import lombok.Data;

@Data
public class ReorderItemRequest {
    private Integer id;
    private Integer orderIndex;
}
