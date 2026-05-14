package com.languagelearning.dto.support;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupportCategoryDto {
    private Integer id;
    private String name;
    private String displayName;
    private String colorBg;
    private String colorText;
}
