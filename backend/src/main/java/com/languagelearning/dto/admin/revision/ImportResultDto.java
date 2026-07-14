package com.languagelearning.dto.admin.revision;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ImportResultDto {
    private int imported;
    private List<String> errors;
}
