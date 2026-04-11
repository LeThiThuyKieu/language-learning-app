package com.languagelearning.controller;

import com.languagelearning.dto.learning.SkillTreeQuestionsResponse;
import com.languagelearning.entity.User;
import com.languagelearning.repository.mysql.UserRepository;
import com.languagelearning.service.SkillTreeQuestionService;
import com.languagelearning.service.SkillTreeQuestionTextFormatter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/learning")
@RequiredArgsConstructor
public class LearningController {

    private final SkillTreeQuestionService skillTreeQuestionService;
    private final UserRepository userRepository;

    // Lấy bộ câu hỏi cho một skill tree (5 node) — cố định theo user (snapshot level).
    @GetMapping(value = "/trees/{treeId}/questions", produces = MediaType.APPLICATION_JSON_VALUE)
    public SkillTreeQuestionsResponse getTreeQuestions(
            @PathVariable Integer treeId,
            Authentication authentication
    ) {
        int userId = resolveUserId(authentication);
        return skillTreeQuestionService.getSampleQuestionsForTreeForUser(userId, treeId);
    }

    /**
     * Cùng dữ liệu như JSON nhưng xuất plain text (giống file tree_*.txt từ script Node).
     */
    @GetMapping(value = "/trees/{treeId}/questions.txt", produces = "text/plain;charset=UTF-8")
    public String getTreeQuestionsAsText(
            @PathVariable Integer treeId,
            Authentication authentication
    ) {
        int userId = resolveUserId(authentication);
        SkillTreeQuestionsResponse body = skillTreeQuestionService.getSampleQuestionsForTreeForUser(userId, treeId);
        return SkillTreeQuestionTextFormatter.formatTree(body);
    }

    /**
     * Lấy bộ câu hỏi cho tất cả skill tree thuộc một level — lần đầu sinh ngẫu nhiên và lưu, các lần sau đọc lại.
     */
    @GetMapping(value = "/levels/{levelId}/questions", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<SkillTreeQuestionsResponse> getLevelQuestions(
            @PathVariable Integer levelId,
            Authentication authentication
    ) {
        int userId = resolveUserId(authentication);
        return skillTreeQuestionService.getOrCreateLevelSnapshot(userId, levelId);
    }

    private int resolveUserId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return userRepository.findByEmail(authentication.getName())
                .map(User::getId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }
}