package com.languagelearning.dto.admin.feedback;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminFeedbackDto {
    private Integer id;
    private Integer userId;
    private String email;
    private String name;
    private Integer treeId;
    private String tree;
    private Integer rating;
    private Double accuracy;
    private LocalDateTime createdAt;
    private String comment;
}
