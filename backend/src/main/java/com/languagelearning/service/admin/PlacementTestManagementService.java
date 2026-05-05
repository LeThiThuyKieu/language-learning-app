package com.languagelearning.service.admin;

import com.languagelearning.dto.admin.placement_test_management.PlacementTestDto;
import com.languagelearning.dto.admin.placement_test_management.PlacementTestStatsDto;
import com.languagelearning.dto.admin.placement_test_management.PlacementTestAttemptDto;
import com.languagelearning.entity.PlacementTest;
import com.languagelearning.entity.User;
import com.languagelearning.entity.UserProfile;
import com.languagelearning.repository.mysql.PlacementTestRepository;
import com.languagelearning.repository.mysql.UserProfileRepository;
import com.languagelearning.repository.mysql.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PlacementTestManagementService {

    private final PlacementTestRepository placementTestRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;

    /**
     * Lấy danh sách placement tests — mỗi user chỉ hiển thị lần thi MỚI NHẤT,
     * sắp xếp theo createdAt DESC, có phân trang.
     */
    @Transactional(readOnly = true)
    public Page<PlacementTestDto> getTests(int page, int size) {
        // Lấy bản ghi mới nhất của mỗi user
        List<PlacementTest> latest = placementTestRepository.findLatestPerUser();

        // Phân trang thủ công
        int start = page * size;
        int end   = Math.min(start + size, latest.size());
        List<PlacementTest> pageContent = start < latest.size()
                ? latest.subList(start, end)
                : List.of();

        List<PlacementTestDto> dtos = pageContent.stream()
                .map(this::toDto)
                .toList();

        return new PageImpl<>(dtos, PageRequest.of(page, size), latest.size());
    }

    /**
     * Thống kê tổng quan:
     * - totalTests      : tổng số bản ghi (mọi lần thi)
     * - completedTests  : số bản ghi COMPLETED
     * - inProgressTests : số bản ghi IN_PROGRESS (chưa hoàn thành / bỏ dở)
     * - averageScore    : điểm TB của các bài COMPLETED
     */
    @Transactional(readOnly = true)
    public PlacementTestStatsDto getStats() {
        List<PlacementTest> all = placementTestRepository.findAll();
        long total      = all.size();
        long completed  = all.stream().filter(t -> "COMPLETED".equals(t.getStatus())).count();
        long inProgress = all.stream().filter(t -> "IN_PROGRESS".equals(t.getStatus())).count();

        double averageScore = all.stream()
                .filter(t -> "COMPLETED".equals(t.getStatus()) && t.getTotalScore() != null)
                .mapToDouble(PlacementTest::getTotalScore)
                .average()
                .orElse(0.0);

        return PlacementTestStatsDto.builder()
                .totalTests(total)
                .completedTests(completed)
                .inProgressTests(inProgress)
                .averageScore(averageScore)
                .build();
    }

    /**
     * Lấy chi tiết một placement test theo ID.
     */
    @Transactional(readOnly = true)
    public PlacementTestDto getTestDetail(Integer testId) {
        PlacementTest test = placementTestRepository.findById(testId)
                .orElseThrow(() -> new IllegalArgumentException("Placement test not found: " + testId));
        return toDto(test);
    }

    /**
     * Xóa một placement test theo ID.
     */
    @Transactional
    public void deleteTest(Integer testId) {
        PlacementTest test = placementTestRepository.findById(testId)
                .orElseThrow(() -> new IllegalArgumentException("Placement test not found: " + testId));
        placementTestRepository.delete(test);
    }

    /**
     * Lịch sử tất cả các lần làm bài của một user, mới nhất trước.
     */
    @Transactional(readOnly = true)
    public List<PlacementTestAttemptDto> getUserHistory(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        return placementTestRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(t -> {
                    LocalDateTime completedAt = "COMPLETED".equals(t.getStatus()) ? t.getUpdatedAt() : null;
                    String levelName = null;
                    if (t.getDetectedLevel() != null) {
                        levelName = switch (t.getDetectedLevel().getId()) {
                            case 1 -> "Beginner";
                            case 2 -> "Intermediate";
                            case 3 -> "Advanced";
                            default -> t.getDetectedLevel().getLevelName();
                        };
                    }
                    return PlacementTestAttemptDto.builder()
                            .id(t.getId())
                            .status(t.getStatus())
                            .totalScore(t.getTotalScore())
                            .detectedLevelName(levelName)
                            .createdAt(t.getCreatedAt())
                            .completedAt(completedAt)
                            .build();
                })
                .toList();
    }

    // helpers

    private PlacementTestDto toDto(PlacementTest test) {
        Optional<UserProfile> profileOpt = userProfileRepository.findByUserId(test.getUser().getId());

        String userName = profileOpt.map(UserProfile::getFullName).orElse(null);
        if (userName == null || userName.isBlank()) {
            userName = test.getUser().getEmail().split("@")[0];
        }

        String avatarUrl = profileOpt.map(UserProfile::getAvatarUrl).orElse(null);
        if (avatarUrl == null || avatarUrl.isBlank()) {
            avatarUrl = "https://ui-avatars.com/api/?name=" + userName + "&background=f97316&color=fff";
        }

        String detectedLevelName = null;
        if (test.getDetectedLevel() != null) {
            // Map theo id vì level_name trong DB có thể khác với giá trị frontend dùng để filter
            detectedLevelName = switch (test.getDetectedLevel().getId()) {
                case 1 -> "Beginner";
                case 2 -> "Intermediate";
                case 3 -> "Advanced";
                default -> test.getDetectedLevel().getLevelName();
            };
        }

        // completedAt: chỉ có khi COMPLETED
        LocalDateTime completedAt = "COMPLETED".equals(test.getStatus()) ? test.getUpdatedAt() : null;

        // Tổng số lần user đã làm (cả hoàn thành lẫn bỏ dở)
        long totalAttempts = placementTestRepository.countDistinctByUserId(test.getUser().getId());

        return PlacementTestDto.builder()
                .id(test.getId())
                .userId(test.getUser().getId())
                .userName(userName)
                .userEmail(test.getUser().getEmail())
                .userAvatar(avatarUrl)
                .status(test.getStatus())
                .totalScore(test.getTotalScore())
                .detectedLevelName(detectedLevelName)
                .createdAt(test.getCreatedAt())
                .completedAt(completedAt)
                .totalAttempts(totalAttempts)
                .build();
    }
}
