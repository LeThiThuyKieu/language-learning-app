package com.languagelearning.dto.admin.learn_progress;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class TreeProgressDto {
    private Integer treeId;
    private Integer orderIndex;
    private String status;       // locked | in_progress | done
    private Double accuracy;
    private List<NodeProgressDto> nodes;
}
