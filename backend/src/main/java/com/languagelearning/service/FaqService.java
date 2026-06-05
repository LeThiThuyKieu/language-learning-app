package com.languagelearning.service;

import com.languagelearning.dto.faq.FaqDto;
import com.languagelearning.dto.faq.FaqRequest;
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
                .map(this::toDto)
                .toList();
    }

    /** Lấy tất cả FAQ (kể cả INACTIVE) dùng cho trang admin xem. */
    @Transactional(readOnly = true)
    public List<FaqDto> getAllFaqs() {
        return faqRepository.findAll(org.springframework.data.domain.Sort.by("displayOrder"))
                .stream()
                .map(this::toDto)
                .toList();
    }

    private FaqDto toDto(Faq faq) {
        String updatedAt = faq.getUpdatedAt() != null
                ? faq.getUpdatedAt().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                : "";
        return FaqDto.builder()
                .id(faq.getId())
                .question(faq.getQuestion())
                .answer(splitAnswer(faq.getAnswer()))
                .displayOrder(faq.getDisplayOrder())
                .status(faq.getStatus().name())
                .updatedAt(updatedAt)
                .build();
    }

    /** Tạo FAQ mới. */
    @Transactional
    public FaqDto createFaq(FaqRequest request) {
        Faq faq = new Faq();
        faq.setQuestion(request.getQuestion().trim());
        faq.setAnswer(request.getAnswer().trim());
        faq.setDisplayOrder(request.getDisplayOrder());
        faq.setStatus(parseStatus(request.getStatus()));
        return toDto(faqRepository.save(faq));
    }

    /** Cập nhật FAQ theo id. */
    @Transactional
    public FaqDto updateFaq(Integer id, FaqRequest request) {
        Faq faq = faqRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy FAQ: " + id));
        faq.setQuestion(request.getQuestion().trim());
        faq.setAnswer(request.getAnswer().trim());
        faq.setDisplayOrder(request.getDisplayOrder());
        faq.setStatus(parseStatus(request.getStatus()));
        return toDto(faqRepository.save(faq));
    }

    /** Xóa FAQ theo id. */
    @Transactional
    public void deleteFaq(Integer id) {
        Faq faq = faqRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy FAQ: " + id));
        faqRepository.delete(faq);
    }

    private Faq.FaqStatus parseStatus(String status) {
        try {
            return Faq.FaqStatus.valueOf(status.trim().toUpperCase());
        } catch (Exception e) {
            return Faq.FaqStatus.ACTIVE;
        }
    }
    private List<String> splitAnswer(String raw) {
        if (raw == null || raw.isBlank()) return List.of();
        return Arrays.stream(raw.split("\n"))
                .map(String::trim)
                .filter(line -> !line.isEmpty())
                .toList();
    }
}
