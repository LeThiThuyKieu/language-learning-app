package com.languagelearning.dto.support;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupportTicketListItemDto {
    private Integer id;
    private Integer userId;
    private String requesterName;
    private String requesterEmail;
    private Integer categoryId;
    private String categoryName;
    private String categoryDisplayName;
    private String status;
    private String source;
    private LocalDateTime createdAt;
    private String latestMessage;
}
