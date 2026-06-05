package com.languagelearning.controller.admin;

import com.languagelearning.dto.learning.EnrichedQuestionDto;
import com.languagelearning.entity.Level;
import com.languagelearning.entity.QuestionIndex;
import com.languagelearning.repository.mysql.LevelRepository;
import com.languagelearning.repository.mysql.QuestionIndexRepository;
import com.languagelearning.repository.mongo.QuestionRepository;
import com.languagelearning.service.learn.SkillTreeQuestionService;
import com.languagelearning.service.admin.AdminLearningService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Admin API for Learning questions backed by MySQL + Mongo.
 */
@RestController
@RequestMapping("/api/admin/learning")
@RequiredArgsConstructor
public class AdminLearningController {

    private final QuestionIndexRepository questionIndexRepository;
    private final SkillTreeQuestionService skillTreeQuestionService;
    private final LevelRepository levelRepository;
    private final QuestionRepository questionRepository;
    private final AdminLearningService adminLearningService;

    @GetMapping(value = "/questions", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> listQuestions(
            @RequestParam(required = false) Integer levelId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        var pageResult = adminLearningService.searchQuestions(levelId, type, q, page, size);
        List<QuestionIndex> rows = pageResult.getContent();
        List<EnrichedQuestionDto> enriched = skillTreeQuestionService.enrichQuestionRows(rows);
        Map<Long, EnrichedQuestionDto> byId = new HashMap<>();
        for (EnrichedQuestionDto e : enriched) if (e.getId() != null) byId.put(e.getId(), e);

        List<Map<String, Object>> items = new ArrayList<>();
        for (QuestionIndex r : rows) {
            EnrichedQuestionDto e = byId.get(r.getId());
            String questionText = e != null && e.getQuestionText() != null ? e.getQuestionText() : "";
            String correctAnswer = e != null && e.getCorrectAnswer() != null ? e.getCorrectAnswer() : "";
            String audioUrl = e != null && e.getAudioUrl() != null ? e.getAudioUrl() : "";
            String phonetic = e != null && e.getPhonetic() != null ? e.getPhonetic() : "";

            Map<String, Object> m = new HashMap<>();
            m.put("id", r.getId());
            m.put("mongoQuestionId", r.getMongoQuestionId());
            m.put("nodeId", r.getNodeId());
            m.put("levelId", r.getLevelId());
            m.put("questionType", r.getQuestionType() != null ? r.getQuestionType().name() : null);
            m.put("questionText", questionText);
            m.put("options", e != null ? e.getOptions() : null);
            m.put("correctAnswer", correctAnswer);
            m.put("audioUrl", audioUrl.isBlank() ? null : audioUrl);
            m.put("phonetic", phonetic);
            // SPEAKING extra fields
            m.put("sampleAnswer", e != null ? e.getSampleAnswer() : null);
            m.put("keywords", e != null ? e.getKeywords() : null);
            items.add(m);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("items", items);
        response.put("total", pageResult.getTotalElements());
        response.put("page", page);
        response.put("size", size);
        response.put("totalPages", pageResult.getTotalPages());
        return response;
    }

    @PostMapping(value = "/bulk", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> bulkAction(@RequestBody Map<String, Object> body) {
        String action = (String) body.get("action");
        List<Integer> idsInt = (List<Integer>) body.get("ids");
        Integer targetLevelId = body.get("targetLevelId") == null ? null : (Integer) body.get("targetLevelId");
        List<Long> ids = idsInt == null ? List.of() : idsInt.stream().map(Integer::longValue).collect(Collectors.toList());
        Map<String, Object> result = adminLearningService.bulkAction(action, ids, targetLevelId);
        return ResponseEntity.ok(result);
    }

    @GetMapping(value = "/questions/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> getQuestion(@PathVariable("id") Long id) {
        Optional<QuestionIndex> rowOpt = questionIndexRepository.findById(id);
        if (rowOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
        QuestionIndex row = rowOpt.get();
        List<EnrichedQuestionDto> enriched = skillTreeQuestionService.enrichQuestionRows(List.of(row));
        EnrichedQuestionDto q = enriched.isEmpty() ? null : enriched.get(0);

        Map<String, Object> m = buildQuestionResponse(row, q);
        return ResponseEntity.ok(m);
    }

    private Map<String, Object> buildQuestionResponse(QuestionIndex row, EnrichedQuestionDto q) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", row.getId());
        m.put("mongoQuestionId", row.getMongoQuestionId());
        m.put("level", resolveLevelLabel(row.getLevelId()));
        m.put("type", q != null && q.getQuestionType() != null ? q.getQuestionType() : (row.getQuestionType() != null ? row.getQuestionType().name() : ""));
        
        String type = m.get("type").toString().toUpperCase();
        
        // Xây dựng response dựa trên type
        switch (type) {
            case "VOCAB":
                m.put("title", q != null ? q.getQuestionText() : "");
                m.put("options", q != null ? q.getOptions() : null);
                m.put("correctAnswer", q != null ? q.getCorrectAnswer() : null);
                m.put("preview", q != null && q.getCorrectAnswer() != null ? q.getCorrectAnswer() : 
                       (q != null && q.getOptions() != null ? String.join(" | ", q.getOptions()) : ""));
                break;
                
            case "LISTENING":
                m.put("title", q != null ? q.getQuestionText() : "");
                m.put("preview", "Listening exercise - fill blanks");
                m.put("blankCount", q != null && q.getBlankCount() != null ? q.getBlankCount() : 0);
                m.put("correctAnswer", q != null ? q.getCorrectAnswer() : null);
                break;
                
            case "SPEAKING":
                m.put("title", q != null ? q.getQuestionText() : "");
                m.put("sampleAnswer", q != null ? q.getSampleAnswer() : "");
                m.put("keywords", q != null ? q.getKeywords() : null);
                m.put("preview", "Speaking exercise");
                break;
                
            case "MATCHING":
                // MATCHING: mỗi cặp = 1 doc, question_text = vế trái, correctAnswer = vế phải
                m.put("title", q != null ? q.getQuestionText() : "");
                m.put("correctAnswer", q != null ? q.getCorrectAnswer() : null);
                m.put("preview", "Matching pair");
                break;
                
            default:
                m.put("title", q != null ? q.getQuestionText() : "");
                m.put("preview", "");
        }
        
        m.put("audio", q != null ? q.getAudioUrl() : null);
        m.put("status", "Hiển thị");
        m.put("note", q != null ? q.getPhonetic() : null);

        return m;
    }

    @PostMapping(value = "/questions", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> createQuestion(@RequestBody Map<String, Object> body) {
        Map<String, Object> result = adminLearningService.createQuestion(body);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PutMapping(value = "/questions/{id}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> updateQuestion(@PathVariable("id") Long id, @RequestBody Map<String, Object> body) {
        Map<String, Object> result = adminLearningService.updateQuestion(id, body);
        return ResponseEntity.ok(result);
    }

    @GetMapping(value = "/stats", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> getStats() {
        Map<String, Object> out = new HashMap<>();
        for (String type : List.of("VOCAB", "LISTENING", "SPEAKING", "MATCHING")) {
            long count = questionIndexRepository.countByType(type);
            out.put(type.toLowerCase(), count);
        }
        return out;
    }

    @GetMapping(value = "/questions/debug", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> debugCounts() {
        Map<String, Object> out = new HashMap<>();
        long mysqlCount = questionIndexRepository.count();
        long mongoCount = questionRepository.count();
        out.put("mysql_questions_count", mysqlCount);
        out.put("mongo_questions_count", mongoCount);
        return out;
    }

    @GetMapping(value = "/types", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<String> getTypes() {
        List<String> types = questionIndexRepository.findDistinctQuestionTypes();
        // normalize nulls
        return types.stream().filter(Objects::nonNull).toList();
    }

    @GetMapping(value = "/levels", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<Map<String, Object>> getLevels() {
        List<Level> levels = levelRepository.findAll();
        List<Map<String, Object>> out = new ArrayList<>();
        for (Level level : levels) {
            Map<String, Object> row = new HashMap<>();
            row.put("id", level.getId());
            row.put("levelName", level.getLevelName());
            row.put("cefrCode", level.getCefrCode());
            out.add(row);
        }
        return out;
    }

    private String resolveLevelLabel(Integer levelId) {
        if (levelId == null) return "";
        Optional<Level> lvl = levelRepository.findById(levelId);
        if (lvl.isPresent()) {
            String name = lvl.get().getLevelName();
            return name != null ? name : String.valueOf(levelId);
        }
        return "L" + levelId;
    }
}
