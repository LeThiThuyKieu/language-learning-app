package com.languagelearning.dto.admin.badge_management;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BadgeStatItemDto {
    private Integer id;
    private String badgeName;
    private Integer requiredKn;
    private long recipientCount;
    private double recipientShare;
}