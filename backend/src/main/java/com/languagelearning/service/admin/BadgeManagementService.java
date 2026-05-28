package com.languagelearning.service.admin;

import com.languagelearning.dto.admin.badge_management.BadgeDto;
import com.languagelearning.dto.admin.badge_management.BadgeStatItemDto;
import com.languagelearning.dto.admin.badge_management.BadgeStatsDto;
import com.languagelearning.entity.Badge;
import com.languagelearning.entity.UserBadge;
import com.languagelearning.repository.mysql.BadgeRepository;
import com.languagelearning.repository.mysql.UserBadgeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BadgeManagementService {

    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;

    @Transactional(readOnly = true)
    public Page<BadgeDto> getBadges(int page, int size, String keyword) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.max(size, 1);
        String q = keyword == null ? "" : keyword.trim().toLowerCase(Locale.ROOT);

        Map<Integer, Long> recipientCounts = getRecipientCounts();

        List<Badge> filtered = badgeRepository.findAll().stream()
                .filter(badge -> q.isBlank()
                        || containsIgnoreCase(badge.getBadgeName(), q)
                        || containsIgnoreCase(badge.getDescription(), q))
                .sorted(Comparator
                        .comparing((Badge badge) -> badge.getRequiredKn() == null ? 0 : badge.getRequiredKn())
                        .thenComparing(Badge::getId, Comparator.nullsLast(Integer::compareTo)))
                .toList();

        int start = Math.min(safePage * safeSize, filtered.size());
        int end = Math.min(start + safeSize, filtered.size());
        List<BadgeDto> content = filtered.subList(start, end).stream()
                .map(badge -> toDto(badge, recipientCounts.getOrDefault(badge.getId(), 0L)))
                .toList();

        return new PageImpl<>(content, PageRequest.of(safePage, safeSize), filtered.size());
    }

    @Transactional(readOnly = true)
    public BadgeStatsDto getStats() {
        List<Badge> badges = badgeRepository.findAll().stream()
                .sorted(Comparator
                        .comparing((Badge badge) -> badge.getRequiredKn() == null ? 0 : badge.getRequiredKn())
                        .thenComparing(Badge::getId, Comparator.nullsLast(Integer::compareTo)))
                .toList();

        Map<Integer, Long> recipientCounts = getRecipientCounts();
        List<UserBadge> userBadges = userBadgeRepository.findAll();

        long totalAwards = userBadges.size();
        long uniqueEarners = userBadges.stream()
                .map(UserBadge::getUser)
                .filter(Objects::nonNull)
                .map(user -> user.getId())
                .distinct()
                .count();

        double averageRequiredKn = badges.isEmpty()
                ? 0
                : badges.stream().mapToInt(badge -> badge.getRequiredKn() == null ? 0 : badge.getRequiredKn()).average().orElse(0);

        Integer minRequiredKn = badges.stream()
                .map(Badge::getRequiredKn)
                .filter(Objects::nonNull)
                .min(Integer::compareTo)
                .orElse(null);

        Integer maxRequiredKn = badges.stream()
                .map(Badge::getRequiredKn)
                .filter(Objects::nonNull)
                .max(Integer::compareTo)
                .orElse(null);

        Badge topBadge = badges.stream()
                .max(Comparator.comparingLong(badge -> recipientCounts.getOrDefault(badge.getId(), 0L)))
                .orElse(null);

        List<BadgeStatItemDto> usage = badges.stream()
                .map(badge -> {
                    long recipients = recipientCounts.getOrDefault(badge.getId(), 0L);
                    double share = totalAwards == 0 ? 0 : (recipients * 100.0) / totalAwards;
                    return BadgeStatItemDto.builder()
                            .id(badge.getId())
                            .badgeName(badge.getBadgeName())
                            .requiredKn(badge.getRequiredKn())
                            .recipientCount(recipients)
                            .recipientShare(share)
                            .build();
                })
                .toList();

        return BadgeStatsDto.builder()
                .totalBadges(badges.size())
                .totalAwards(totalAwards)
                .uniqueEarners(uniqueEarners)
                .averageRequiredKn(averageRequiredKn)
                .minRequiredKn(minRequiredKn)
                .maxRequiredKn(maxRequiredKn)
                .topBadgeName(topBadge != null ? topBadge.getBadgeName() : null)
                .topBadgeRecipients(topBadge == null ? 0 : recipientCounts.getOrDefault(topBadge.getId(), 0L))
                .badgeUsage(usage)
                .build();
    }

    private BadgeDto toDto(Badge badge, long recipientCount) {
        return BadgeDto.builder()
                .id(badge.getId())
                .badgeName(badge.getBadgeName())
                .description(badge.getDescription())
                .requiredKn(badge.getRequiredKn())
                .iconUrl(badge.getIconUrl())
                .recipientCount(recipientCount)
                .build();
    }

    private Map<Integer, Long> getRecipientCounts() {
        return userBadgeRepository.findAll().stream()
                .filter(userBadge -> userBadge.getBadge() != null && userBadge.getBadge().getId() != null)
                .collect(Collectors.groupingBy(userBadge -> userBadge.getBadge().getId(), Collectors.counting()));
    }

    private boolean containsIgnoreCase(String value, String keyword) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(keyword);
    }
}