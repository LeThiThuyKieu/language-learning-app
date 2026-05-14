package com.languagelearning.service;

import com.languagelearning.dto.chatbot.*;
import com.languagelearning.entity.ChatbotRule;
import com.languagelearning.entity.SupportCategory;
import com.languagelearning.repository.mysql.ChatbotRuleRepository;
import com.languagelearning.repository.mysql.SupportCategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatbotService {

    private final ChatbotRuleRepository chatbotRuleRepository;
    private final SupportCategoryRepository supportCategoryRepository;

    private static final String FALLBACK_RESPONSE =
            "Cảm ơn bạn đã liên hệ hỗ trợ. Admin sẽ phản hồi trong thời gian sớm nhất.";

    /**
     * Match keyword theo thứ tự ưu tiên:
     *   1. Rule thuộc category hiện tại (category = categoryId)
     *   2. Rule global (category IS NULL)
     *   3. Rule thuộc các category khác
     *   4. Không match → trả fallback response
     *
     * Trong mỗi bước, rule có priority cao hơn được kiểm tra trước.
     */
    @Transactional(readOnly = true)
    public ChatbotMatchResponse match(ChatbotMatchRequest request) {
        String normalizedMsg = normalize(request.getMessage());
        Integer categoryId   = request.getCategoryId();

        // Bước 1: category hiện tại
        if (categoryId != null) {
            ChatbotMatchResponse r = matchFromList(
                    chatbotRuleRepository.findActiveByCategory(categoryId), normalizedMsg);
            if (r != null) {
                log.debug("[Chatbot] Step1 matched (category={}) for: {}", categoryId, request.getMessage());
                return r;
            }
        }

        // Bước 2: general (category IS NULL)
        {
            ChatbotMatchResponse r = matchFromList(
                    chatbotRuleRepository.findActiveGeneral(), normalizedMsg);
            if (r != null) {
                log.debug("[Chatbot] Step2 matched (general) for: {}", request.getMessage());
                return r;
            }
        }

        //  Bước 3: các category khác 
        if (categoryId != null) {
            ChatbotMatchResponse r = matchFromList(
                    chatbotRuleRepository.findActiveByOtherCategories(categoryId), normalizedMsg);
            if (r != null) {
                log.debug("[Chatbot] Step3 matched (other categories) for: {}", request.getMessage());
                return r;
            }
        } else {
            // Không có categoryId → thử toàn bộ rule có category
            List<ChatbotRule> allWithCat = chatbotRuleRepository
                    .findByIsActiveTrueOrderByPriorityDesc()
                    .stream()
                    .filter(rule -> rule.getCategory() != null)
                    .toList();
            ChatbotMatchResponse r = matchFromList(allWithCat, normalizedMsg);
            if (r != null) {
                log.debug("[Chatbot] Step3 matched (all categories) for: {}", request.getMessage());
                return r;
            }
        }

        // Bước 4: fallback 
        log.debug("[Chatbot] No rule matched, returning fallback for: {}", request.getMessage());
        return ChatbotMatchResponse.builder()
                .matched(true)          // matched=true để lưu vào DB như bot message
                .botResponse(FALLBACK_RESPONSE)
                .ruleId(null)
                .fallback(true)
                .build();
    }

    /** Duyệt danh sách rule, trả về kết quả match đầu tiên hoặc null nếu không có */
    private ChatbotMatchResponse matchFromList(List<ChatbotRule> rules, String normalizedMsg) {
        for (ChatbotRule rule : rules) {
            String[] keywords = rule.getKeywords().split("\\|");
            boolean matched = Arrays.stream(keywords)
                    .map(String::trim)
                    .filter(k -> !k.isEmpty())
                    .anyMatch(k -> normalizedMsg.contains(normalize(k)));
            if (matched) {
                return ChatbotMatchResponse.builder()
                        .matched(true)
                        .botResponse(rule.getBotResponse())
                        .ruleId(rule.getId())
                        .fallback(false)
                        .build();
            }
        }
        return null;
    }

    @Transactional(readOnly = true)
    public List<ChatbotRuleDto> getAllRules() {
        return chatbotRuleRepository.findAll().stream()
                .sorted((a, b) -> b.getPriority().compareTo(a.getPriority()))
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public ChatbotRuleDto getRule(Integer id) {
        return toDto(findById(id));
    }

    @Transactional
    public ChatbotRuleDto createRule(ChatbotRuleRequest request) {
        ChatbotRule rule = new ChatbotRule();
        applyRequest(rule, request);
        return toDto(chatbotRuleRepository.save(rule));
    }

    @Transactional
    public ChatbotRuleDto updateRule(Integer id, ChatbotRuleRequest request) {
        ChatbotRule rule = findById(id);
        applyRequest(rule, request);
        return toDto(chatbotRuleRepository.save(rule));
    }

    @Transactional
    public void deleteRule(Integer id) {
        chatbotRuleRepository.delete(findById(id));
    }

    @Transactional
    public ChatbotRuleDto toggleActive(Integer id) {
        ChatbotRule rule = findById(id);
        rule.setIsActive(!rule.getIsActive());
        return toDto(chatbotRuleRepository.save(rule));
    }

    private ChatbotRule findById(Integer id) {
        return chatbotRuleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chatbot rule: " + id));
    }

    private void applyRequest(ChatbotRule rule, ChatbotRuleRequest request) {
        rule.setRuleName(request.getRuleName().trim());
        rule.setKeywords(request.getKeywords().trim());
        rule.setBotResponse(request.getBotResponse().trim());
        rule.setPriority(request.getPriority());
        rule.setIsActive(request.getIsActive());

        if (request.getCategoryId() != null) {
            SupportCategory cat = supportCategoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy category: " + request.getCategoryId()));
            rule.setCategory(cat);
        } else {
            rule.setCategory(null);
        }
    }

    private ChatbotRuleDto toDto(ChatbotRule rule) {
        return ChatbotRuleDto.builder()
                .id(rule.getId())
                .ruleName(rule.getRuleName())
                .keywords(rule.getKeywords())
                .botResponse(rule.getBotResponse())
                .categoryId(rule.getCategory() != null ? rule.getCategory().getId() : null)
                .categoryDisplayName(rule.getCategory() != null ? rule.getCategory().getDisplayName() : null)
                .priority(rule.getPriority())
                .isActive(rule.getIsActive())
                .createdAt(rule.getCreatedAt())
                .updatedAt(rule.getUpdatedAt())
                .build();
    }

    /**
     * Chuẩn hóa text: lowercase + bỏ dấu tiếng Việt + trim khoảng trắng thừa.
     * Giúp match không phân biệt hoa/thường và có/không dấu.
     */
    private String normalize(String text) {
        if (text == null) return "";
        String lower = text.toLowerCase().trim();
        // Bỏ dấu tiếng Việt
        String nfd = Normalizer.normalize(lower, Normalizer.Form.NFD);
        return nfd.replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                  .replaceAll("đ", "d")
                  .replaceAll("Đ", "d");
    }
}
