package com.languagelearning.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.languagelearning.dto.learning.EnrichedQuestionDto;
import com.languagelearning.dto.placement.*;
import com.languagelearning.entity.Level;
import com.languagelearning.entity.PlacementTest;
import com.languagelearning.entity.QuestionIndex;
import com.languagelearning.entity.QuestionType;
import com.languagelearning.entity.User;
import com.languagelearning.repository.mysql.LevelRepository;
import com.languagelearning.repository.mysql.PlacementTestRepository;
import com.languagelearning.repository.mysql.QuestionIndexRepository;
import com.languagelearning.repository.mysql.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Placement test: bốc câu theo level_id (1/2/3), chấm điểm, làm đủ 3 level rồi mới kết thúc.
 * Vocab/Matching: 5 câu/level; Listening: 1 bài/level; Speaking: 1 bài Mongo/level, chấm theo từng dòng (câu nhỏ).
 */
@Service
@RequiredArgsConstructor
public class PlacementTestService {

    private static final int VOCAB_COUNT = 5;
    private static final int MATCHING_COUNT = 5;

    private final PlacementTestRepository sessionRepository;
    private final UserRepository userRepository;
    private final QuestionIndexRepository questionIndexRepository;
    private final LevelRepository levelRepository;
    private final SkillTreeQuestionService skillTreeQuestionService;
    private final ObjectMapper objectMapper;

    /** Mở phiên test mới (JWT). */
    @Transactional
    public PlacementStartResponse startSession(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        PlacementTest s = new PlacementTest();
        s.setUser(user);
        s.setStatus("IN_PROGRESS");
        s.setIssuedJson(emptyIssuedJson());
        s.setScoresJson(emptyScoresJson());
        sessionRepository.save(s);
        return new PlacementStartResponse(s.getId());
    }

    /** Lấy 5 câu vocab ngẫu nhiên theo level (1–3). */
    @Transactional
    public List<PlacementVocabItemDto> getVocab(String email, Integer testId, int level) {
        PlacementTest session = loadSession(email, testId);
        int levelId = assertLevel(level);
        ObjectNode root = readIssued(session);
        ObjectNode lvl = levelNode(root, level);
        if (lvl.has("vocabIds")) {
            return materializeVocab(lvl.get("vocabIds"));
        }
        List<QuestionIndex> rows = questionIndexRepository.findRandomByLevelAndType(levelId, QuestionType.VOCAB.name(), VOCAB_COUNT);
        if (rows.size() < VOCAB_COUNT) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không đủ câu VOCAB trong kho");
        }
        ArrayNode ids = objectMapper.createArrayNode();
        rows.forEach(r -> ids.add(r.getId()));
        lvl.set("vocabIds", ids);
        session.setIssuedJson(root.toString());
        sessionRepository.save(session);
        return materializeVocab(ids);
    }

    /** Lấy 5 cặp matching ngẫu nhiên theo level (1-3) đã shuffle hai cột. */
    @Transactional
    public PlacementMatchingResponse getMatching(String email, Integer testId, int level) {
        PlacementTest session = loadSession(email, testId);
        int levelId = assertLevel(level);
        ObjectNode root = readIssued(session);
        ObjectNode lvl = levelNode(root, level);
        if (lvl.has("matching")) {
            return readMatchingResponse(lvl.get("matching"), level);
        }
        List<QuestionIndex> rows = questionIndexRepository.findRandomByLevelAndType(levelId, QuestionType.MATCHING.name(), MATCHING_COUNT);
        if (rows.size() < MATCHING_COUNT) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không đủ câu MATCHING trong kho");
        }
        List<EnrichedQuestionDto> enriched = skillTreeQuestionService.enrichQuestionRows(rows);
        List<Pair> pairs = new ArrayList<>();
        for (EnrichedQuestionDto e : enriched) {
            String left = safe(e.getQuestionText());
            String right = safe(e.getCorrectAnswer());
            if (left.isEmpty() || right.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Dữ liệu matching thiếu text/đáp án");
            }
            pairs.add(new Pair(left, right));
        }
        List<PlacementMatchingCardDto> leftCards = new ArrayList<>();
        List<PlacementMatchingCardDto> rightCards = new ArrayList<>();
        for (int i = 0; i < pairs.size(); i++) {
            leftCards.add(PlacementMatchingCardDto.builder().cardId("L" + i).text(pairs.get(i).left).build());
            rightCards.add(PlacementMatchingCardDto.builder().cardId("R" + i).text(pairs.get(i).right).build());
        }
        Collections.shuffle(leftCards, new Random());
        Collections.shuffle(rightCards, new Random());
        ArrayNode correct = objectMapper.createArrayNode();
        for (Pair p : pairs) {
            String lId = leftCards.stream().filter(c -> c.getText().equals(p.left)).map(PlacementMatchingCardDto::getCardId).findFirst().orElseThrow();
            String rId = rightCards.stream().filter(c -> c.getText().equals(p.right)).map(PlacementMatchingCardDto::getCardId).findFirst().orElseThrow();
            ObjectNode c = objectMapper.createObjectNode();
            c.put("l", lId);
            c.put("r", rId);
            correct.add(c);
        }
        ObjectNode m = objectMapper.createObjectNode();
        m.set("left", objectMapper.valueToTree(leftCards));
        m.set("right", objectMapper.valueToTree(rightCards));
        m.set("correct", correct);
        lvl.set("matching", m);
        session.setIssuedJson(root.toString());
        sessionRepository.save(session);
        return PlacementMatchingResponse.builder()
                .level(level)
                .leftColumn(leftCards)
                .rightColumn(rightCards)
                .build();
    }

    /** Lấy 1 bài listening theo level (1-3) */
    @Transactional
    public PlacementListeningResponse getListening(String email, Integer testId, int level) {
        PlacementTest session = loadSession(email, testId);
        int levelId = assertLevel(level);
        ObjectNode root = readIssued(session);
        ObjectNode lvl = levelNode(root, level);
        if (lvl.has("listeningId")) {
            return materializeListening(lvl.get("listeningId").asLong(), level);
        }
        List<QuestionIndex> rows = questionIndexRepository.findRandomByLevelAndType(levelId, QuestionType.LISTENING.name(), 1);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không có bài LISTENING trong kho");
        }
        long id = rows.get(0).getId();
        PlacementListeningResponse res = materializeListening(id, level);
        lvl.put("listeningId", id);
        lvl.put("listeningBlanks", res.getBlankCount());
        session.setIssuedJson(root.toString());
        sessionRepository.save(session);
        return res;
    }

    /** Lấy 1 bài speaking theo level (1-3) */
    @Transactional
    public PlacementSpeakingResponse getSpeaking(String email, Integer testId, int level) {
        PlacementTest session = loadSession(email, testId);
        int levelId = assertLevel(level);
        ObjectNode root = readIssued(session);
        ObjectNode lvl = levelNode(root, level);
        if (lvl.has("speakingIds")) {
            return materializeSpeaking(lvl.get("speakingIds"), level);
        }
        List<QuestionIndex> rows = questionIndexRepository.findRandomByLevelAndType(levelId, QuestionType.SPEAKING.name(), 1);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không có bài SPEAKING trong kho");
        }
        ArrayNode ids = objectMapper.createArrayNode();
        rows.forEach(r -> ids.add(r.getId()));
        lvl.set("speakingIds", ids);
        PlacementSpeakingResponse res = materializeSpeaking(ids, level);
        lvl.put("speakingLineCount", res.getLines().size());
        session.setIssuedJson(root.toString());
        sessionRepository.save(session);
        return res;
    }

    /** Chấm, làm đủ 3 level rồi mới completed. */
    @Transactional
    public PlacementSubmitResponse submitSection(String email, PlacementSubmitRequest req) {
        if (req.getTestId() == null || req.getLevel() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu testId hoặc level");
        }
        int level = assertLevel(req.getLevel());
        PlacementTest session = loadSession(email, req.getTestId());
        if (!"IN_PROGRESS".equals(session.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Phiên test đã kết thúc");
        }
        ObjectNode issued = readIssued(session);
        ObjectNode lvl = levelNode(issued, level);
        if (!lvl.has("vocabIds") || !lvl.has("matching") || !lvl.has("listeningId") || !lvl.has("speakingIds")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chưa tải đủ 4 phần nội dung cho level này từ API GET");
        }

        // check payload từ req
        validateSubmitPayload(req, lvl, level);

        // Tỷ lệ đúng từng phần (%)
        double rV = scoreVocab(req.getVocabAnswers(), lvl.get("vocabIds"));
        double rM = scoreMatching(req.getMatchingAnswers(), lvl.get("matching"));
        double rL = scoreListening(req.getListeningAnswers(), lvl.get("listeningId"));
        double rS = scoreSpeaking(req.getSpeakingAnswers(), lvl.get("speakingIds"));

        int listeningGaps = lvl.path("listeningBlanks").asInt(1);
        int speakLines = resolveSpeakingLineCount(lvl, level);
        mergeScores(session, rV, rM, rL, rS, listeningGaps, speakLines);

        double avg = (rV + rL + rS + rM) / 4.0;
        String status = "continue";
        String message = "Đã nộp. Tiếp tục level tiếp theo ngay.";
        if (level >= 3) {
            status = "completed";
            session.setStatus("COMPLETED");
            finalizeScores(session);
            message = "Hoàn thành cả 3 level. Đang tổng hợp kết quả.";
        }
        sessionRepository.save(session);
        return PlacementSubmitResponse.builder()
                .testId(session.getId())
                .status(status)
                .levelAverageRatio(avg)
                .message(message)
                .build();
    }

    /** Bảng điểm + xếp level (10–55 Beginner, 60–125 Intermediate, 130–160 Advanced). */
    @Transactional
    public PlacementResultResponse getResult(String email, Integer testId) {
        PlacementTest session = loadSession(email, testId);
        if ("IN_PROGRESS".equals(session.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bài test chưa hoàn thành");
        }
        if (session.getTotalScore() == null) {
            finalizeScores(session); //Tính tổng điểm (thang 160)
            sessionRepository.save(session);
        }
        double score = session.getTotalScore() != null ? session.getTotalScore() : 0.0;
        String band;
        String labelVi;
        int detectedId;
        if (score <= 55) {
            band = "BEGINNER";
            labelVi = "Beginner";
            detectedId = 1;
        } else if (score <= 125) {
            band = "INTERMEDIATE";
            labelVi = "Intermediate";
            detectedId = 2;
        } else {
            band = "ADVANCED";
            labelVi = "Advanced";
            detectedId = 3;
        }
        Level lv = levelRepository.findById(detectedId).orElse(null); // Lấy level từ db
        Map<String, Double> skills = readSkillDoubleMap(session.getScoresJson());//lấy ra ds điểm các skill
        return PlacementResultResponse.builder()
                .testId(session.getId())
                .totalScore(score)
                .band(band)
                .bandLabelVi(labelVi)
                .detectedLevelId(lv != null ? lv.getId() : detectedId)
                .detectedLevelName(lv != null ? lv.getLevelName() : labelVi)
                .skillScores(skills)
                .build();
    }

    private record Pair(String left, String right) {}

    // Kiem tra phiên test của user
    private PlacementTest loadSession(String email, Integer testId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        return sessionRepository.findByIdAndUser(testId, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy phiên test"));
    }

    // lấy ra level
    private int assertLevel(int level) {
        if (level < 1 || level > 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "level phải là 1, 2 hoặc 3");
        }
        return level;
    }

    // Kiểm tra payload (data) từ req xem có hơp lệ ko
    private void validateSubmitPayload(PlacementSubmitRequest req, ObjectNode lvl, int level) {
        if (req.getVocabAnswers() == null || req.getVocabAnswers().size() != VOCAB_COUNT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cần đúng " + VOCAB_COUNT + " câu vocab");
        }
        if (req.getMatchingAnswers() == null || req.getMatchingAnswers().size() != MATCHING_COUNT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cần đúng " + MATCHING_COUNT + " cặp matching");
        }
        if (req.getListeningAnswers() == null || req.getListeningAnswers().size() != 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cần đúng 1 bài listening");
        }
        int sp = resolveSpeakingLineCount(lvl, level);
        if (sp <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu speakingLineCount — gọi GET /speaking trước khi nộp");
        }
        if (req.getSpeakingAnswers() == null || req.getSpeakingAnswers().size() != sp) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cần đúng " + sp + " phần speaking (số dòng câu nhỏ trong bài)");
        }
    }

    // Số câu trong 1 speaking (đã lưu khi GET hoặc tính lại từ Mongo)
    private int resolveSpeakingLineCount(ObjectNode lvl, int level) {
        int c = lvl.path("speakingLineCount").asInt(0);
        if (c > 0) {
            return c;
        }
        if (!lvl.has("speakingIds")) {
            return 0;
        }
        return materializeSpeaking(lvl.get("speakingIds"), level).getLines().size();
    }

    private String emptyIssuedJson() {
        return "{\"levels\":{}}";
    }

    private String emptyScoresJson() {
        // listening: trung bình tỷ lệ đúng theo từng đoạn (3 level) — khớp spec, khác với tổng đúng/tổng ô
        return "{\"vocab\":{\"c\":0,\"t\":0},\"matching\":{\"c\":0,\"t\":0},\"listening\":{\"sumRatio\":0,\"n\":0},\"speaking\":{\"c\":0,\"t\":0}}";
    }

    private ObjectNode readIssued(PlacementTest s) {
        try {
            JsonNode n = objectMapper.readTree(s.getIssuedJson() == null ? "{}" : s.getIssuedJson());
            if (!n.isObject()) {
                return objectMapper.createObjectNode();
            }
            ObjectNode root = (ObjectNode) n;
            if (!root.has("levels")) {
                root.set("levels", objectMapper.createObjectNode());
            }
            return root;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "issued_json lỗi");
        }
    }

    private ObjectNode levelNode(ObjectNode root, int level) {
        ObjectNode levels = (ObjectNode) root.get("levels");
        String key = String.valueOf(level);
        if (!levels.has(key)) {
            levels.set(key, objectMapper.createObjectNode());
        }
        return (ObjectNode) levels.get(key);
    }

    private List<PlacementVocabItemDto> materializeVocab(JsonNode vocabIds) {
        List<Long> ids = new ArrayList<>();
        vocabIds.forEach(n -> ids.add(n.asLong()));
        List<QuestionIndex> rows = questionIndexRepository.findAllById(ids);
        Map<Long, QuestionIndex> byId = rows.stream().collect(Collectors.toMap(QuestionIndex::getId, r -> r));
        List<PlacementVocabItemDto> out = new ArrayList<>();
        for (Long id : ids) {
            QuestionIndex row = byId.get(id);
            if (row == null) {
                continue;
            }
            EnrichedQuestionDto e = skillTreeQuestionService.enrichQuestionRows(List.of(row)).get(0);
            out.add(PlacementVocabItemDto.builder()
                    .questionId(e.getId())
                    .mongoQuestionId(e.getMongoQuestionId())
                    .questionText(e.getQuestionText())
                    .options(e.getOptions() != null ? e.getOptions() : List.of())
                    .build());
        }
        return out;
    }

    private PlacementMatchingResponse readMatchingResponse(JsonNode m, int level) {
        try {
            PlacementMatchingCardDto[] la = objectMapper.convertValue(m.get("left"), PlacementMatchingCardDto[].class);
            PlacementMatchingCardDto[] ra = objectMapper.convertValue(m.get("right"), PlacementMatchingCardDto[].class);
            return PlacementMatchingResponse.builder()
                    .level(level)
                    .leftColumn(Arrays.asList(la))
                    .rightColumn(Arrays.asList(ra))
                    .build();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không đọc lại matching đã lưu");
        }
    }

    private PlacementListeningResponse materializeListening(long questionId, int level) {
        QuestionIndex row = questionIndexRepository.findById(questionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listening không tồn tại"));
        EnrichedQuestionDto e = skillTreeQuestionService.enrichQuestionRows(List.of(row)).get(0);
        int blanks = countBlanks(e.getQuestionText());
        return PlacementListeningResponse.builder()
                .level(level)
                .questionId(e.getId())
                .mongoQuestionId(e.getMongoQuestionId())
                .audioUrl(e.getAudioUrl())
                .textWithBlanks(e.getQuestionText())
                .blankCount(Math.max(1, blanks))
                .build();
    }

    private PlacementSpeakingResponse materializeSpeaking(JsonNode ids, int level) {
        List<Long> idList = new ArrayList<>();
        ids.forEach(n -> idList.add(n.asLong()));
        List<QuestionIndex> rows = questionIndexRepository.findAllById(idList);
        Map<Long, QuestionIndex> byId = rows.stream().collect(Collectors.toMap(QuestionIndex::getId, r -> r));
        List<PlacementSpeakingLineDto> lines = new ArrayList<>();
        String audioUrl = null;
        for (Long id : idList) {
            QuestionIndex row = byId.get(id);
            if (row == null) {
                continue;
            }
            EnrichedQuestionDto e = skillTreeQuestionService.enrichQuestionRows(List.of(row)).get(0);
            if (audioUrl == null || audioUrl.isBlank()) {
                audioUrl = e.getAudioUrl();
            }
            List<String> parts = splitSpeakingLines(e.getQuestionText());
            int idx = 0;
            for (String part : parts) {
                lines.add(PlacementSpeakingLineDto.builder()
                        .questionId(e.getId())
                        .mongoQuestionId(e.getMongoQuestionId())
                        .lineIndex(idx++)
                        .line(part)
                        .build());
            }
        }
        return PlacementSpeakingResponse.builder().level(level).audioUrl(audioUrl).lines(lines).build();
    }

    // Lấy ra danh sách cac câu speaking trong 1 bài speaking
    private List<String> splitSpeakingLines(String questionText) {
        if (questionText == null || questionText.isBlank()) {
            return List.of();
        }
        return Arrays.stream(questionText.split("\\r?\\n"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    // Đếm chỗ trống trong listening
    private int countBlanks(String text) {
        if (text == null) {return 0;}
        int c = 0;
        var m = java.util.regex.Pattern.compile("_{3,}(?:\\s*\\(\\d+\\))?").matcher(text);
        while (m.find()) {c++;}
        return c;
    }

    // Tính điểm vocab (tỉ lệ, vd: 3/5 câu đúng => 0,6 (double))
    private double scoreVocab(List<PlacementSubmitRequest.VocabAnswer> answers, JsonNode vocabIds) {
        int ok = 0;
        for (PlacementSubmitRequest.VocabAnswer a : answers) {
            //Lấy thông tin đầy đủ của câu hỏi từ DB
            QuestionIndex row = questionIndexRepository.findById(a.getQuestionId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "questionId vocab không hợp lệ"));
            EnrichedQuestionDto e = skillTreeQuestionService.enrichQuestionRows(List.of(row)).get(0);
            List<String> opts = e.getOptions() != null ? e.getOptions() : List.of(); // Lấy ra các option của cau hỏi

            if (a.getSelectedOptionIndex() == null || a.getSelectedOptionIndex() < 0 || a.getSelectedOptionIndex() >= opts.size()) {
                continue;
            }
            String picked = opts.get(a.getSelectedOptionIndex()); // Lấy ra đáp án user chọn
            if (norm(picked).equals(norm(e.getCorrectAnswer()))) { //so sánh câu trả lời
                ok++;
            }
        }
        return ok / (double) VOCAB_COUNT;
    }

    // Tính điểm matching
    private double scoreMatching(List<PlacementSubmitRequest.MatchingAnswer> answers, JsonNode matchingIds) {
        // Tập hợp đáp án đúng
        //  "correct": [
        //    { "l": "1", "r": "A" },
        //    { "l": "2", "r": "B" }
        //  ]
        Set<String> correct = new HashSet<>();
        for (JsonNode c : matchingIds.get("correct")) {
            correct.add(c.get("l").asText() + "|" + c.get("r").asText());
        }
        int ok = 0;
        for (PlacementSubmitRequest.MatchingAnswer a : answers) {
            if (correct.contains(a.getLeftCardId() + "|" + a.getRightCardId())) {
                ok++;
            }
        }
        return ok / (double) MATCHING_COUNT;
    }

    // Tính điểm listening (listeningIdNode là question Id)
    private double scoreListening(List<PlacementSubmitRequest.ListeningAnswer> answers, JsonNode listeningIds) {
        if (listeningIds == null || !listeningIds.isNumber()) {
            return 0;
        }
        long qid = listeningIds.asLong();
        QuestionIndex row = questionIndexRepository.findById(qid).orElseThrow();
        EnrichedQuestionDto e = skillTreeQuestionService.enrichQuestionRows(List.of(row)).get(0);
        List<String> expected = parseListeningExpected(e.getCorrectAnswer());
        List<String> got = answers.get(0).getGapAnswers();
        if (got == null || expected.isEmpty()) {
            return 0;
        }
        int n = Math.min(expected.size(), got.size());
        int ok = 0;
        for (int i = 0; i < n; i++) {
            if (norm(got.get(i)).equals(norm(expected.get(i)))) {
                ok++;
            }
        }
        return ok / (double) expected.size();
    }

    // parse đáp án
    // 1: apple | 2: banana | 3: orange ==> ["apple", "banana", "orange"]
    private List<String> parseListeningExpected(String correctAnswer) {
        if (correctAnswer == null || correctAnswer.isBlank()) {
            return List.of();
        }
        String[] parts = correctAnswer.split("\\|");
        List<String> out = new ArrayList<>();
        for (String p : parts) {
            String t = p.trim();
            var m = java.util.regex.Pattern.compile("^\\d+\\s*:\\s*(.+)$").matcher(t);
            if (m.matches()) {
                out.add(m.group(1).trim());
            } else if (!t.isEmpty()) {
                out.add(t);
            }
        }
        return out;
    }

    // Tính điểm speaking
    private double scoreSpeaking(List<PlacementSubmitRequest.SpeakingAnswer> answers, JsonNode speakingIds) {
        if (speakingIds == null || speakingIds.isEmpty() || answers == null || answers.isEmpty()) {
            return 0;
        }
        long qid = speakingIds.get(0).asLong();
        QuestionIndex row = questionIndexRepository.findById(qid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "questionId speaking không hợp lệ"));
        EnrichedQuestionDto e = skillTreeQuestionService.enrichQuestionRows(List.of(row)).get(0);
        List<String> expectedLines = splitSpeakingLines(e.getQuestionText());
        if (expectedLines.isEmpty()) {
            return 0;
        }

        // check có lineIndex ko
        boolean anyIndex = answers.stream().anyMatch(a -> a.getLineIndex() != null);
        int ok = 0;
        if (!anyIndex) {
            int n = Math.min(answers.size(), expectedLines.size());
            for (int i = 0; i < n; i++) {
                if (weakTextMatch(answers.get(i).getTypedText(), expectedLines.get(i))) {
                    ok++;
                }
            }
        } else {
            for (int lineIdx = 0; lineIdx < expectedLines.size(); lineIdx++) {
                final int li = lineIdx;
                String exp = expectedLines.get(lineIdx);
                PlacementSubmitRequest.SpeakingAnswer a = answers.stream()
                        .filter(x -> x.getLineIndex() != null && x.getLineIndex() == li)
                        .findFirst()
                        .orElse(null);
                if (a != null && weakTextMatch(a.getTypedText(), exp)) {
                    ok++;
                }
            }
        }
        return ok / (double) expectedLines.size();
    }

    private boolean weakTextMatch(String typed, String expected) {
        if (typed == null) {
            return false;
        }
        Set<String> wa = Arrays.stream(norm(typed).split("\\s+")).filter(s -> !s.isEmpty()).collect(Collectors.toSet());
        Set<String> wb = Arrays.stream(norm(expected).split("\\s+")).filter(s -> !s.isEmpty()).collect(Collectors.toSet());
        if (wb.isEmpty()) {
            return false;
        }
        long hit = wb.stream().filter(wa::contains).count();
        return hit >= Math.ceil(wb.size() * 0.55);
    }

    private void mergeScores(
            PlacementTest session,
            double rV,
            double rM,
            double rL,
            double rS,
            int listeningGaps,
            int speakingLines
    ) {
        try {
            ObjectNode sc = readScoresNode(session);
            accumulate(sc, "vocab", rV, VOCAB_COUNT);
            accumulate(sc, "matching", rM, MATCHING_COUNT);
            mergeListeningRatio(sc, rL);
            accumulate(sc, "speaking", rS, Math.max(1, speakingLines));
            session.setScoresJson(sc.toString());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "scores_json lỗi");
        }
    }

    private ObjectNode readScoresNode(PlacementTest session) throws Exception {
        JsonNode n = objectMapper.readTree(session.getScoresJson() == null ? emptyScoresJson() : session.getScoresJson());
        return (ObjectNode) n;
    }

    private void accumulate(ObjectNode sc, String key, double ratio, int chunk) {
        ObjectNode n = (ObjectNode) sc.get(key);
        int cAdd = (int) Math.round(ratio * chunk);
        n.put("c", n.get("c").asInt() + cAdd);
        n.put("t", n.get("t").asInt() + chunk);
    }

    /** Cộng dồn tỷ lệ đúng từng bài listening (mỗi level một đoạn) để lấy TB theo đoạn. */
    private void mergeListeningRatio(ObjectNode sc, double ratioPerPassage) {
        ObjectNode n = (ObjectNode) sc.get("listening");
        if (!n.has("sumRatio")) {
            n.remove("c");
            n.remove("t");
            n.put("sumRatio", 0.0);
            n.put("n", 0);
        }
        n.put("sumRatio", n.path("sumRatio").asDouble(0.0) + ratioPerPassage);
        n.put("n", n.path("n").asInt(0) + 1);
    }

    // Tính ra điểm số cuối cùng theo thang 160
    private void finalizeScores(PlacementTest session) {
        try {
            ObjectNode sc = (ObjectNode) objectMapper.readTree(session.getScoresJson());
            SkillScores160 s160 = computeSkillScores160(sc);
            double total = (s160.vocab + s160.matching + s160.listening + s160.speaking) / 4.0;
            total = Math.max(0.0, Math.min(160.0, total));
            session.setTotalScore(total);
            int bandId;
            if (total <= 55) {
                bandId = 1;
            } else if (total <= 125) {
                bandId = 2;
            } else {
                bandId = 3;
            }
            levelRepository.findById(bandId).ifPresent(session::setDetectedLevel);
        } catch (Exception ignored) {
            session.setTotalScore(0.0);
        }
    }

    /** Bốn điểm kỹ năng trên thang 0–160, mỗi kỹ năng làm tròn số nguyên rồi mới TB */
    private record SkillScores160(int vocab, int matching, int listening, int speaking) {}
    private SkillScores160 computeSkillScores160(ObjectNode sc) {
        int vC = sc.path("vocab").path("c").asInt(0);
        int vT = Math.max(1, sc.path("vocab").path("t").asInt(1));
        int mC = sc.path("matching").path("c").asInt(0);
        int mT = Math.max(1, sc.path("matching").path("t").asInt(1));
        int sC = sc.path("speaking").path("c").asInt(0);
        int sT = Math.max(1, sc.path("speaking").path("t").asInt(1));
        return new SkillScores160(
                skillScore160(vC, vT),
                skillScore160(mC, mT),
                listeningScore160(sc.path("listening")),
                skillScore160(sC, sT)
        );
    }
    private static int skillScore160(int correct, int total) {
        if (total <= 0) {
            return 0;
        }
        return clamp160(Math.round(160.0 * correct / total));
    }

    /** TB tỷ lệ đúng từng đoạn listening; fallback dữ liệu cũ c/t. */
    private static double listeningAverageRatio(JsonNode listeningNode) {
        if (listeningNode == null || listeningNode.isMissingNode()) {
            return 0;
        }
        int nPassages = listeningNode.path("n").asInt(0);
        if (listeningNode.has("sumRatio") && nPassages > 0) {
            return listeningNode.path("sumRatio").asDouble(0.0) / nPassages;
        }
        int lC = listeningNode.path("c").asInt(0);
        int lT = Math.max(1, listeningNode.path("t").asInt(1));
        return (double) lC / lT;
    }

    private static int listeningScore160(JsonNode listeningNode) {
        return clamp160(Math.round(160.0 * listeningAverageRatio(listeningNode)));
    }

    private static int clamp160(long v) {
        return (int) Math.max(0, Math.min(160, v));
    }

    /** Điểm hiển thị từng kỹ năng 0–40 = điểm 160 (đã làm tròn) / 4. */
    private Map<String, Double> buildSkillScoresDisplay(ObjectNode sc) {
        SkillScores160 s = computeSkillScores160(sc);
        Map<String, Double> m = new LinkedHashMap<>();
        m.put("vocab", s.vocab / 4.0);
        m.put("matching", s.matching / 4.0);
        m.put("listening", s.listening / 4.0);
        m.put("speaking", s.speaking / 4.0);
        return m;
    }

    // Lấy ra ds điểm của các skill
    private Map<String, Double> readSkillDoubleMap(String json) {
        try {
            ObjectNode sc = (ObjectNode) objectMapper.readTree(json);
            return buildSkillScoresDisplay(sc);
        } catch (Exception e) {
            return Map.of();
        }
    }

    // Chuẩn hoá đáp án (tránh null crash, và tránh phân biệt chữ hoa, thường
    private static String norm(String s) {
        return s == null ? "" : s.trim().toLowerCase(Locale.ROOT);
    }

    private static String safe(String s) {
        return s == null ? "" : s.trim();
    }
}
