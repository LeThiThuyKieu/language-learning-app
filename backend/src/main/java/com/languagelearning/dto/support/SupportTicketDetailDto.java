package com.languagelearning.dto.support;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupportTicketDetailDto {
    private Integer id;
    private Integer userId;
    private String requesterName;
    private String requesterEmail;
    private Integer categoryId;
    private String categoryName;
    private String categoryDisplayName;
    private String status;
    private String source;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
    private List<SupportMessageDto> messages;
}
