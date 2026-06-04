package com.languagelearning.dto.faq;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FaqDto {
    private Integer id;
    private String question;
    /** Các dòng answer tách theo '\n' để hiển thị từng bullet */
    private List<String> answer;
    private Integer displayOrder;
}
