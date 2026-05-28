package com.languagelearning.dto.admin.badge_management;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BadgeDto {
    private Integer id;
    private String badgeName;
    private String description;
    private Integer requiredKn;
    private String iconUrl;
    private String status;
    private long recipientCount;
}