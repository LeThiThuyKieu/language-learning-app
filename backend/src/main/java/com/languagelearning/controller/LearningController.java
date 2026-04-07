package com.languagelearning.controller;

import com.languagelearning.dto.learning.SkillTreeQuestionsResponse;
import com.languagelearning.service.SkillTreeQuestionService;
import com.languagelearning.service.SkillTreeQuestionTextFormatter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/learning")
@RequiredArgsConstructor
public class LearningController {

    private final SkillTreeQuestionService skillTreeQuestionService;

    // Lấy bộ câu hỏi mẫu cho một skill tree (5 node).
    @GetMapping(value = "/trees/{treeId}/questions", produces = MediaType.APPLICATION_JSON_VALUE)
    public SkillTreeQuestionsResponse getTreeQuestions(@PathVariable Integer treeId) {
        return skillTreeQuestionService.getSampleQuestionsForTree(treeId);
    }

    /**
     * Cùng dữ liệu như JSON nhưng xuất plain text (giống file tree_*.txt từ script Node).
     */
    @GetMapping(value = "/trees/{treeId}/questions.txt", produces = "text/plain;charset=UTF-8")
    public String getTreeQuestionsAsText(@PathVariable Integer treeId) {
        SkillTreeQuestionsResponse body = skillTreeQuestionService.getSampleQuestionsForTree(treeId);
        return SkillTreeQuestionTextFormatter.formatTree(body);
    }

    /**
     * Lấy bộ câu hỏi mẫu cho tất cả skill tree thuộc một level.
     */
    @GetMapping(value = "/levels/{levelId}/questions", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<SkillTreeQuestionsResponse> getLevelQuestions(@PathVariable Integer levelId) {
        return skillTreeQuestionService.getSampleQuestionsByLevel(levelId);
    }
}
