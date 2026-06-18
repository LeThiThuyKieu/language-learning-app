package com.languagelearning.service;

import com.languagelearning.dto.grammar.GrammarTopicDto;
import com.languagelearning.entity.GrammarTopic;
import com.languagelearning.repository.mysql.GrammarTopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GrammarTopicService {

    private final GrammarTopicRepository grammarTopicRepository;

    /**
     * Lấy tất cả grammar topics sắp xếp theo display_order
     */
    public List<GrammarTopicDto> getAllGrammarTopics() {
        return grammarTopicRepository.findAllByOrderByDisplayOrderAsc()
            .stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    /**
     * Convert entity to DTO
     */
    private GrammarTopicDto toDto(GrammarTopic entity) {
        return new GrammarTopicDto(
            entity.getId(),
            entity.getSlug(),
            entity.getName(),
            entity.getDisplayOrder(),
            entity.getJsonUrl(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }
}
