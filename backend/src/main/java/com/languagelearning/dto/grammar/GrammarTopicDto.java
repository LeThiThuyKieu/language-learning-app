package com.languagelearning.dto.grammar;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GrammarTopicDto {
    private Long id;
    private String slug;
    private String name;
    @JsonProperty("displayOrder")
    private Integer displayOrder;
    @JsonProperty("jsonUrl")
    private String jsonUrl;
    @JsonProperty("createdAt")
    private LocalDateTime createdAt;
    @JsonProperty("updatedAt")
    private LocalDateTime updatedAt;
}
