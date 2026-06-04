package com.languagelearning.service;

import com.languagelearning.dto.faq.FaqDto;
import com.languagelearning.entity.Faq;
import com.languagelearning.repository.mysql.FaqRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FaqService {

    private final FaqRepository faqRepository;

    /**
     * Lấy toàn bộ FAQ đang ACTIVE, sắp xếp theo display_order.
     * Answer lưu nhiều dòng ngăn cách bởi \n → trả về List<String>
     * để frontend render từng bullet point.
     */
    @Transactional(readOnly = true)
    public List<FaqDto> getActiveFaqs() {
        return faqRepository.findByStatusOrderByDisplayOrderAsc(Faq.FaqStatus.ACTIVE)
                .stream()
                .map(faq -> FaqDto.builder()
                        .id(faq.getId())
                        .question(faq.getQuestion())
                        .answer(splitAnswer(faq.getAnswer()))
                        .displayOrder(faq.getDisplayOrder())
                        .build())
                .toList();
    }

    /** Tách answer theo '\n', bỏ dòng trắng */
    private List<String> splitAnswer(String raw) {
        if (raw == null || raw.isBlank()) return List.of();
        return Arrays.stream(raw.split("\n"))
                .map(String::trim)
                .filter(line -> !line.isEmpty())
                .toList();
    }
}
