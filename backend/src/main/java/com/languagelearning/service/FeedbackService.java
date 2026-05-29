package com.languagelearning.service;

import com.languagelearning.dto.feedback.FeedbackRequest;
import com.languagelearning.entity.Feedback;
import com.languagelearning.entity.SkillTree;
import com.languagelearning.entity.User;
import com.languagelearning.exception.BadCredentialsException;
import com.languagelearning.repository.mysql.FeedbackRepository;
import com.languagelearning.repository.mysql.SkillTreeRepository;
import com.languagelearning.repository.mysql.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final UserRepository userRepository;
    private final SkillTreeRepository skillTreeRepository;

    /**
     * Lưu feedback của user cho một skill tree.
     * Mỗi user chỉ được feedback 1 lần cho mỗi tree — bỏ qua nếu đã có.
     */
    @Transactional
    public void submitFeedback(String email, FeedbackRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        SkillTree skillTree = skillTreeRepository.findById(request.getTreeId())
                .orElseThrow(() -> new IllegalArgumentException("SkillTree not found: " + request.getTreeId()));

        if (request.getRating() == null || request.getRating() < 1 || request.getRating() > 5) {
            throw new IllegalArgumentException("Rating phải từ 1 đến 5");
        }

        // Chỉ lưu lần đầu tiên
        if (feedbackRepository.existsByUserAndSkillTreeId(user, request.getTreeId())) {
            return; // đã feedback rồi, bỏ qua
        }

        Feedback feedback = new Feedback();
        feedback.setUser(user);
        feedback.setSkillTree(skillTree);
        feedback.setRating(request.getRating());
        feedbackRepository.save(feedback);
    }

    /**
     * Kiểm tra user đã feedback cho tree này chưa.
     * Dùng để frontend quyết định có hiện modal hay không,
     * và để loadProgressFromDB xác định tree tiếp theo có được unlock không.
     */
    @Transactional(readOnly = true)
    public boolean hasFeedback(String email, Integer treeId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("User not found"));
        return feedbackRepository.existsByUserAndSkillTreeId(user, treeId);
    }
}
