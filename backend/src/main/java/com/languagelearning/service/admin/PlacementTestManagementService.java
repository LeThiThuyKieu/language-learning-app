package com.languagelearning.service.admin;

import com.languagelearning.dto.admin.placement_test_management.PlacementTestDto;
import com.languagelearning.dto.admin.placement_test_management.PlacementTestStatsDto;
import com.languagelearning.entity.PlacementTest;
import com.languagelearning.entity.UserProfile;
import com.languagelearning.repository.mysql.PlacementTestRepository;
import com.languagelearning.repository.mysql.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
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

    /**
     * Lấy danh sách placement tests có phân trang, sắp xếp theo ngày tạo mới nhất.
     */
    @Transactional(readOnly = true)
    public Page<PlacementTestDto> getTests(int page, int size) {
        Page<PlacementTest> tests = placementTestRepository.findAll(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        return tests.map(this::toDto);
    }

    /**
     * Thống kê tổng quan: tổng tests, đã hoàn thành, đang làm, điểm trung bình.
     */
    @Transactional(readOnly = true)
    public PlacementTestStatsDto getStats() {
        List<PlacementTest> all = placementTestRepository.findAll();
        long total = all.size();
        long completed = all.stream().filter(t -> "COMPLETED".equals(t.getStatus())).count();
        long inProgress = all.stream().filter(t -> "IN_PROGRESS".equals(t.getStatus())).count();
        
        double averageScore = all.stream()
                .filter(t -> t.getTotalScore() != null)
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
     * Chuyển đổi entity sang DTO.
     */
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
            detectedLevelName = test.getDetectedLevel().getLevelName();
        }

        // completedAt: nếu status là COMPLETED thì lấy updatedAt
        LocalDateTime completedAt = null;
        if ("COMPLETED".equals(test.getStatus()) && test.getUpdatedAt() != null) {
            completedAt = test.getUpdatedAt();
        }

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
                .build();
    }
}
