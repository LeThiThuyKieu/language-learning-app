package com.languagelearning.controller;

import com.languagelearning.dto.general_revision.RevisionQuestionDto;
import com.languagelearning.dto.general_revision.RevisionTopicDto;
import com.languagelearning.dto.general_revision.SubmitRevisionTaskRequest;
import com.languagelearning.dto.general_revision.SubmitRevisionTaskResponse;
import com.languagelearning.service.general_revision.GeneralRevisionProgressService;
import com.languagelearning.service.general_revision.GeneralRevisionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/general-revision")
@RequiredArgsConstructor
public class GeneralRevisionController {

    private final GeneralRevisionService generalRevisionService;
    private final GeneralRevisionProgressService progressService;

    /**
     * GET /api/general-revision/topics
     * Trả về topics kèm user progress (completed_tasks, task attempt count).
     */
    @GetMapping(value = "/topics", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<RevisionTopicDto> getTopics(Authentication authentication) {
        requireAuth(authentication);
        return generalRevisionService.getAllTopicsWithProgress(authentication.getName());
    }

    /**
     * GET /api/general-revision/tasks/{taskId}/questions
     * Lấy tất cả các câu hỏi của 1 task
     */
    @GetMapping(value = "/tasks/{taskId}/questions", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<RevisionQuestionDto> getTaskQuestions(
            @PathVariable Integer taskId,
            Authentication authentication) {
        requireAuth(authentication);
        return generalRevisionService.getQuestionsByTask(taskId);
    }

    /**
     * POST /api/general-revision/tasks/submit
     * Gọi sau khi user hoàn thành 1 task — cộng KN, XP, streak, lưu lịch sử.
     */
    @PostMapping(value = "/tasks/submit", produces = MediaType.APPLICATION_JSON_VALUE)
    public SubmitRevisionTaskResponse submitTask(
            @RequestBody SubmitRevisionTaskRequest request,
            Authentication authentication) {
        requireAuth(authentication);
        return progressService.submitTask(authentication.getName(), request);
    }

    private void requireAuth(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
    }
}
