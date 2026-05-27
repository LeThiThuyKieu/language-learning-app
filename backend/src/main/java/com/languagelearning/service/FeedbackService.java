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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.stream.Collectors;
import java.util.Optional;
import com.languagelearning.dto.admin.feedback.AdminFeedbackDto;

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

    /**
     * Admin: search feedbacks with optional filters and paging.
     */
    @Transactional(readOnly = true)
    public Page<AdminFeedbackDto> searchFeedbacks(
            Integer treeId,
            String userEmail,
            Integer minRating,
            Integer maxRating,
            LocalDateTime from,
            LocalDateTime to,
            Pageable pageable
    ) {
        Specification<Feedback> spec = Specification.where(null);

        if (treeId != null) {
            spec = spec.and((root, cq, cb) -> cb.equal(root.get("skillTree").get("id"), treeId));
        }
        if (userEmail != null && !userEmail.isBlank()) {
            spec = spec.and((root, cq, cb) -> cb.like(cb.lower(root.get("user").get("email")), "%" + userEmail.toLowerCase() + "%"));
        }
        if (minRating != null) {
            spec = spec.and((root, cq, cb) -> cb.greaterThanOrEqualTo(root.get("rating"), minRating));
        }
        if (maxRating != null) {
            spec = spec.and((root, cq, cb) -> cb.lessThanOrEqualTo(root.get("rating"), maxRating));
        }
        if (from != null) {
            spec = spec.and((root, cq, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), from));
        }
        if (to != null) {
            spec = spec.and((root, cq, cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), to));
        }

        var page = feedbackRepository.findAll(spec, pageable);

        var dtoPage = new PageImpl<AdminFeedbackDto>(
            page.stream().map(f -> {
                var dto = new AdminFeedbackDto();
                dto.setId(f.getId());
                dto.setUserId(f.getUser() != null ? f.getUser().getId() : null);
                dto.setEmail(f.getUser() != null ? f.getUser().getEmail() : null);
                dto.setTreeId(f.getSkillTree() != null ? f.getSkillTree().getId() : null);
                // SkillTree doesn't store a title; provide a placeholder or null.
                dto.setTree(f.getSkillTree() != null ? ("Tree #" + f.getSkillTree().getId()) : null);
                dto.setRating(f.getRating());
                dto.setCreatedAt(f.getCreatedAt());
                return dto;
            }).collect(Collectors.toList()),
            pageable,
            page.getTotalElements()
        );

        return dtoPage;
    }

    @Transactional(readOnly = true)
    public Optional<Feedback> findById(Integer id) {
        return feedbackRepository.findById(id);
    }

    @Transactional
    public void deleteById(Integer id) {
        feedbackRepository.deleteById(id);
    }
}
