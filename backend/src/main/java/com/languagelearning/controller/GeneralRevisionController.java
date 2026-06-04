package com.languagelearning.controller;

import com.languagelearning.dto.general_revision.RevisionQuestionDto;
import com.languagelearning.dto.general_revision.RevisionTopicDto;
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

    /**
     * GET /api/general-revision/topics
     * Danh sách 10 topic kèm tasks.
     */
    @GetMapping(value = "/topics", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<RevisionTopicDto> getTopics(Authentication authentication) {
        requireAuth(authentication);
        return generalRevisionService.getAllTopics();
    }

    /**
     * GET /api/general-revision/tasks/{taskId}/questions
     * Lấy câu hỏi của một task từ MongoDB.
     */
    @GetMapping(value = "/tasks/{taskId}/questions", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<RevisionQuestionDto> getTaskQuestions(
            @PathVariable Integer taskId,
            Authentication authentication) {
        requireAuth(authentication);
        return generalRevisionService.getQuestionsByTask(taskId);
    }

    private void requireAuth(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
    }
}
