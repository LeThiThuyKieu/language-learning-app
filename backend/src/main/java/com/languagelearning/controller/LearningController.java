package com.languagelearning.controller;

import com.languagelearning.dto.learning.SkipTestSubmitRequest;
import com.languagelearning.dto.learning.SkillTreeQuestionsResponse;
import com.languagelearning.entity.User;
import com.languagelearning.repository.mysql.UserRepository;
import com.languagelearning.service.learn.SkillTreeQuestionService;
import com.languagelearning.service.learn.SkillTreeQuestionTextFormatter;
import com.languagelearning.service.learn.SkipTestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/learning")
@RequiredArgsConstructor
public class LearningController {

    private final SkillTreeQuestionService skillTreeQuestionService;
    private final UserRepository userRepository;
    private final SkipTestService skipTestService;

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

    /**
     * Lấy bộ câu hỏi ngẫu nhiên cho bài test học vượt level.
     * Cấu trúc giống REVIEW node: 4 VOCAB + 4 MATCHING + 1 LISTENING + 1 SPEAKING.
     * Mỗi lần gọi là random mới (không cache).
     *
     * @param levelId       Level đích muốn vượt lên (dùng để lưu attempt)
     * @param sourceLevelIds Danh sách level lấy câu hỏi (mặc định = [levelId - 1]).
     *                       Ví dụ: vượt lên Level 3 từ Level 1 → sourceLevelIds = [1, 2]
     */
    @GetMapping(value = "/levels/{levelId}/skip-test", produces = MediaType.APPLICATION_JSON_VALUE)
    public SkillTreeQuestionsResponse getSkipTestQuestions(
            @PathVariable Integer levelId,
            @RequestParam(required = false) List<Integer> sourceLevelIds,
            Authentication authentication
    ) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        // Nếu không truyền sourceLevelIds → mặc định lấy câu từ level liền trước
        List<Integer> sources = (sourceLevelIds != null && !sourceLevelIds.isEmpty())
                ? sourceLevelIds
                : List.of(Math.max(1, levelId - 1));
        return skillTreeQuestionService.buildRandomSkipTestForLevels(sources);
    }

    /**
     * Lưu kết quả bài test học vượt level vào DB (user_skip_test_attempt).
     * Gọi sau khi user hoàn thành tất cả câu hỏi.
     */
    @PostMapping(value = "/levels/{levelId}/skip-test/submit", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> submitSkipTest(
            @PathVariable Integer levelId,
            @RequestBody SkipTestSubmitRequest request,
            Authentication authentication
    ) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        skipTestService.saveAttempt(authentication.getName(), levelId, request);
        return ResponseEntity.ok(Map.of(
                "saved", true,
                "passed", request.isPassed(),
                "accuracy", request.getAccuracy()
        ));
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