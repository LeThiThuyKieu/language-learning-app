package com.languagelearning.service.adaptive_learn;

import com.languagelearning.entity.Feedback;
import com.languagelearning.entity.Level;
import com.languagelearning.entity.SkillTree;
import com.languagelearning.entity.UserSkillTreeProgress;
import com.languagelearning.repository.mysql.FeedbackRepository;
import com.languagelearning.repository.mysql.LevelRepository;
import com.languagelearning.repository.mysql.SkillTreeRepository;
import com.languagelearning.repository.mysql.UserSkillTreeProgressRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Adaptive Difficulty Service — cập nhật độ khó của từng skill tree
 * dựa trên dữ liệu thực tế (accuracy) và phản hồi chủ quan (feedback rating).
 *
 * Công thức:
 *   difficulty_obs = w1 × mean(1 - accuracy_i) + w2 × mean(F_i / 5)
 *   difficulty_new = α × difficulty_old + (1 - α) × difficulty_obs
 *
 * Trong đó:
 *   w1 = 0.7 (trọng số accuracy — kết quả thực tế)
 *   w2 = 0.3 (trọng số feedback — cảm nhận chủ quan)
 *   α  = 0.7 (hệ số ổn định EMA — tránh biến động đột ngột)
 *   F  = rating feedback (1=Rất dễ → 5=Rất khó), F/5 ∈ [0.2, 1.0]
 *
 * Điều kiện kích hoạt: tree có ≥ 30 mẫu hợp lệ
 * (user đã done tree VÀ đã feedback cho tree đó).
 *
 * Sau khi cập nhật difficulty → sắp xếp lại order_index trong cùng level
 * theo difficulty tăng dần (tree dễ hơn học trước).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdaptiveDifficultyService {

    private static final double W1 = 0.7;   // trọng số accuracy
    private static final double W2 = 0.3;   // trọng số feedback
    private static final double ALPHA = 0.7; // hệ số ổn định EMA
    private static final int MIN_SAMPLES = 30; // ngưỡng mẫu tối thiểu

    private final SkillTreeRepository skillTreeRepository;
    private final LevelRepository levelRepository;
    private final UserSkillTreeProgressRepository userSkillTreeProgressRepository;
    private final FeedbackRepository feedbackRepository;

    /**
     * Cập nhật difficulty cho tất cả tree trong tất cả level.
     * Gọi bởi scheduler hàng ngày lúc 02:00.
     */
    @Transactional
    public void updateAllTreeDifficulties() {
        List<Level> levels = levelRepository.findAll();
        int updatedCount = 0;

        for (Level level : levels) {
            updatedCount += updateDifficultiesForLevel(level.getId());
        }

        log.info("[AdaptiveDifficulty] Updated {} trees across {} levels", updatedCount, levels.size());
    }

    /**
     * Cập nhật difficulty cho tất cả tree trong một level.
     * Trả về số tree đã được cập nhật.
     */
    @Transactional
    public int updateDifficultiesForLevel(Integer levelId) {
        List<SkillTree> trees = skillTreeRepository.findByLevel_IdOrderByOrderIndex(levelId);
        if (trees.isEmpty()) return 0;

        int updatedCount = 0;

        for (SkillTree tree : trees) {
            boolean updated = updateDifficultyForTree(tree);
            if (updated) updatedCount++;
        }

        // Sắp xếp lại order_index trong level theo difficulty tăng dần
        if (updatedCount > 0) {
            reorderTreesByDifficulty(trees);
        }

        return updatedCount;
    }

    /**
     * Tính và cập nhật difficulty cho một tree.
     * Trả về true nếu đã cập nhật (đủ mẫu), false nếu bỏ qua (chưa đủ mẫu).
     */
    private boolean updateDifficultyForTree(SkillTree tree) {
        // Lấy tất cả user đã done tree này
        List<UserSkillTreeProgress> doneList =
                userSkillTreeProgressRepository.findDoneBySkillTreeId(tree.getId());

        // Lấy tất cả feedback của tree này (mỗi user chỉ có 1 dòng)
        List<Feedback> feedbacks = feedbackRepository.findBySkillTreeId(tree.getId());

        // Map userId → feedback rating
        Map<Integer, Integer> feedbackByUserId = feedbacks.stream()
                .collect(Collectors.toMap(
                        f -> f.getUser().getId(),
                        Feedback::getRating,
                        (a, b) -> a
                ));

        // Chỉ lấy các mẫu hợp lệ: user đã done VÀ đã feedback
        List<double[]> validSamples = doneList.stream()
                .filter(p -> feedbackByUserId.containsKey(p.getUser().getId()))
                .map(p -> {
                    double accuracy = p.getAccuracy() != null ? p.getAccuracy() : 0.0;
                    // F/5: rating 1-5 → độ khó chủ quan 0.2-1.0 (tỉ lệ thuận với độ khó)
                    double fNorm = feedbackByUserId.get(p.getUser().getId()) / 5.0;
                    return new double[]{accuracy, fNorm};
                })
                .toList();

        // Kiểm tra ngưỡng mẫu tối thiểu
        if (validSamples.size() < MIN_SAMPLES) {
            log.debug("[AdaptiveDifficulty] Tree {} has only {}/{} samples — skipping",
                    tree.getId(), validSamples.size(), MIN_SAMPLES);
            return false;
        }

        // difficulty_obs = w1 × mean(1 - accuracy) + w2 × mean(F/5)
        double meanDifficultyAccuracy = validSamples.stream()
                .mapToDouble(s -> 1.0 - s[0])
                .average()
                .orElse(0.5);

        // F/5: rating cao → user cảm thấy khó → difficulty cao (tỉ lệ thuận)
        double meanDifficultyFeedback = validSamples.stream()
                .mapToDouble(s -> s[1])
                .average()
                .orElse(0.5);

        // difficulty_obs = w1 × mean(1-p) + w2 × mean(1-F_norm)
        double difficultyObs = W1 * meanDifficultyAccuracy + W2 * meanDifficultyFeedback;

        // difficulty_new = α × difficulty_old + (1-α) × difficulty_obs  (EMA)
        double difficultyOld = tree.getDifficulty() != null ? tree.getDifficulty() : 0.5;
        double difficultyNew = ALPHA * difficultyOld + (1 - ALPHA) * difficultyObs;

        // Làm tròn 4 chữ số thập phân
        difficultyNew = Math.round(difficultyNew * 10000.0) / 10000.0;

        log.info("[AdaptiveDifficulty] Tree {} (level {}): samples={}, obs={:.4f}, old={:.4f} → new={:.4f}",
                tree.getId(), tree.getLevel() != null ? tree.getLevel().getId() : "?",
                validSamples.size(), difficultyObs, difficultyOld, difficultyNew);

        tree.setDifficulty(difficultyNew);
        skillTreeRepository.save(tree);
        return true;
    }

    /**
     * Sắp xếp lại order_index của các tree trong cùng level theo difficulty tăng dần.
     * Tree dễ hơn (difficulty thấp) sẽ có order_index nhỏ hơn → hiển thị trước.
     */
    private void reorderTreesByDifficulty(List<SkillTree> trees) {
        // Sắp xếp theo difficulty tăng dần
        List<SkillTree> sorted = trees.stream()
                .sorted(Comparator.comparingDouble(t -> t.getDifficulty() != null ? t.getDifficulty() : 0.5))
                .toList();

        // Gán lại order_index từ 1 đến n
        for (int i = 0; i < sorted.size(); i++) {
            SkillTree tree = sorted.get(i);
            int newOrderIndex = i + 1;
            if (tree.getOrderIndex() == null || tree.getOrderIndex() != newOrderIndex) {
                tree.setOrderIndex(newOrderIndex);
                skillTreeRepository.save(tree);
            }
        }

        log.info("[AdaptiveDifficulty] Reordered {} trees in level {}",
                sorted.size(),
                sorted.isEmpty() ? "?" : (sorted.get(0).getLevel() != null ? sorted.get(0).getLevel().getId() : "?"));
    }
}
