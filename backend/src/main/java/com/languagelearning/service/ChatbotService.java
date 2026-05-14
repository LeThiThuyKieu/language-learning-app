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

    /**
     * Match keyword trong message của user.
     * Ưu tiên rule có category khớp.
     * Rule có priority cao hơn được kiểm tra trước.
     */
    @Transactional(readOnly = true)
    public ChatbotMatchResponse match(ChatbotMatchRequest request) {
        List<ChatbotRule> rules = request.getCategoryId() != null
                ? chatbotRuleRepository.findActiveByCategoryOrGlobal(request.getCategoryId())
                : chatbotRuleRepository.findByIsActiveTrueOrderByPriorityDesc();

        String normalizedMsg = normalize(request.getMessage());

        for (ChatbotRule rule : rules) {
            String[] keywords = rule.getKeywords().split("\\|");
            boolean matched = Arrays.stream(keywords)
                    .map(String::trim)
                    .filter(k -> !k.isEmpty())
                    .anyMatch(k -> normalizedMsg.contains(normalize(k)));

            if (matched) {
                log.debug("[Chatbot] Matched rule #{} for message: {}", rule.getId(), request.getMessage());
                return ChatbotMatchResponse.builder()
                        .matched(true)
                        .botResponse(rule.getBotResponse())
                        .ruleId(rule.getId())
                        .build();
            }
        }

        log.debug("[Chatbot] No rule matched for message: {}", request.getMessage());
        return ChatbotMatchResponse.builder().matched(false).build();
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
