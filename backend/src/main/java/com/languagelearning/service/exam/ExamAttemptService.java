package com.languagelearning.service.exam;

import com.languagelearning.document.ExamQuestion;
import com.languagelearning.dto.exam.*;
import com.languagelearning.entity.*;
import com.languagelearning.repository.mongo.ExamQuestionRepository;
import com.languagelearning.repository.mysql.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExamAttemptService {

    private final UserExamAttemptRepository        attemptRepository;
    private final UserExamQuestionResultRepository questionResultRepository;
    private final UserRepository                   userRepository;
    private final ExamTestRepository               examTestRepository;
    private final ExamPaperRepository              examPaperRepository;
    private final ExamPartRepository               examPartRepository;
    private final ExamQuestionRepository           examQuestionRepository;  // MongoDB

    // Lưu kết quả 1 lần thi
    @Transactional
    public ExamAttemptSummaryDto saveAttempt(SaveExamAttemptRequest req, Authentication auth) {
        Integer userId = resolveUserId(auth);

        // Guard: testId không được null
        if (req.getTestId() == null || req.getTestId() <= 0) {
            log.warn("[ExamAttempt] saveAttempt bị gọi với testId không hợp lệ: {}", req.getTestId());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "testId không hợp lệ.");
        }

        // Validate test tồn tại
        examTestRepository.findById(req.getTestId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy bài thi id=" + req.getTestId()));

        List<SaveExamAttemptRequest.QuestionResultDto> qList =
                req.getQuestionResults() != null ? req.getQuestionResults() : new ArrayList<>();

        // Build correct_answer map + fetch MongoDB docs để recompute isCorrect server-side
        Map<String, String> correctAnswerMap = buildCorrectAnswerMap(req.getTestId());
        List<String> mongoIds = qList.stream()
                .map(SaveExamAttemptRequest.QuestionResultDto::getMongoDocId)
                .filter(Objects::nonNull).collect(Collectors.toList());
        Map<String, ExamQuestion> mongoMap = examQuestionRepository.findAllById(mongoIds)
                .stream().collect(Collectors.toMap(ExamQuestion::getId, q -> q));

        // Recompute isCorrect server-side (authoritative)
        for (SaveExamAttemptRequest.QuestionResultDto r : qList) {
            if (r.getMongoDocId() == null) continue;
            String qType = r.getQuestionType();
            if ("SHORT_WRITE".equals(qType) || "SPEAKING_TASK".equals(qType)) {
                r.setIsCorrect(null);
                continue;
            }
            String correctAnswer = correctAnswerMap.get(r.getMongoDocId());
            if (correctAnswer == null || r.getUserAnswer() == null) {
                r.setIsCorrect(null);
                continue;
            }
            ExamQuestion mongo = mongoMap.get(r.getMongoDocId());
            r.setIsCorrect(serverCheckAnswer(r.getUserAnswer(), correctAnswer, qType, mongo));
        }

        // Tính correct / total từ các câu đã recompute (tổng + per-paper)
        long correctCount = 0, totalCount = 0;
        long listeningCorrect = 0, listeningTotal = 0;
        long rwCorrect = 0, rwTotal = 0;

        for (SaveExamAttemptRequest.QuestionResultDto r : qList) {
            if (r.getIsCorrect() == null) continue; // SHORT_WRITE, SPEAKING, unanswered
            totalCount++;
            boolean correct = Boolean.TRUE.equals(r.getIsCorrect());
            if (correct) correctCount++;

            // Per-paper breakdown
            String paper = r.getPaperType();
            if (paper == null) {
                // Infer from questionType if not set
                String qt = r.getQuestionType();
                if ("FILL_IN_FORM".equals(qt) || "SHORT_WRITE".equals(qt)
                        || "FILL_IN_TEXT".equals(qt) || "MATCHING".equals(qt)) {
                    paper = "READING_WRITING";
                } else if ("SPEAKING_TASK".equals(qt)) {
                    paper = "SPEAKING";
                } else {
                    paper = "LISTENING";
                }
            }
            if ("LISTENING".equals(paper)) {
                listeningTotal++;
                if (correct) listeningCorrect++;
            } else if ("READING_WRITING".equals(paper)) {
                rwTotal++;
                if (correct) rwCorrect++;
            }
        }

        // Tạo Attempt
        UserExamAttempt attempt = new UserExamAttempt();
        attempt.setUserId(userId);
        attempt.setTestId(req.getTestId());
        attempt.setWritingScore(req.getWritingScore());
        attempt.setSpeakingScore(req.getSpeakingScore());
        attempt.setCorrectCount((int) correctCount);
        attempt.setTotalCount((int) totalCount);
        attempt.setListeningCorrect((int) listeningCorrect);
        attempt.setListeningTotal((int) listeningTotal);
        attempt.setRwCorrect((int) rwCorrect);
        attempt.setRwTotal((int) rwTotal);
        attempt.setAttemptedAt(LocalDateTime.now());
        attempt = attemptRepository.save(attempt);

        // Lưu từng câu
        if (!qList.isEmpty()) {
            List<UserExamQuestionResult> results = new ArrayList<>();
            for (SaveExamAttemptRequest.QuestionResultDto r : qList) {
                UserExamQuestionResult qr = new UserExamQuestionResult();
                qr.setAttempt(attempt);
                qr.setMongoDocId(r.getMongoDocId());
                qr.setQuestionType(r.getQuestionType());
                qr.setUserAnswer(r.getUserAnswer());
                qr.setIsCorrect(r.getIsCorrect());
                qr.setLlmScore(r.getLlmScore());
                qr.setLlmFeedback(r.getLlmFeedback());
                qr.setLlmBreakdown(r.getLlmBreakdown());
                qr.setLlmSuggestion(r.getLlmSuggestion());
                qr.setWordCount(r.getWordCount());
                qr.setTranscript(r.getTranscript());
                results.add(qr);
            }
            questionResultRepository.saveAll(results);
        }

        ExamTest test = examTestRepository.findById(req.getTestId()).orElse(null);
        return toSummaryDto(attempt, test != null ? test.getTitle() : "");
    }

    // Lịch sử thi của user (tất cả test)
    public List<ExamAttemptSummaryDto> getMyAttempts(Authentication auth) {
        Integer userId = resolveUserId(auth);
        List<UserExamAttempt> attempts =
                attemptRepository.findByUserIdOrderByAttemptedAtDesc(userId);

        // Batch fetch test titles
        Set<Integer> testIds = attempts.stream().map(UserExamAttempt::getTestId).collect(Collectors.toSet());
        Map<Integer, String> testTitles = examTestRepository.findAllById(testIds)
                .stream().collect(Collectors.toMap(ExamTest::getId, ExamTest::getTitle));

        return attempts.stream()
                .map(a -> toSummaryDto(a, testTitles.getOrDefault(a.getTestId(), "")))
                .collect(Collectors.toList());
    }

    // Lịch sử thi của user với 1 test cụ thể
    public List<ExamAttemptSummaryDto> getMyAttemptsForTest(Integer testId, Authentication auth) {
        Integer userId = resolveUserId(auth);
        List<UserExamAttempt> attempts =
                attemptRepository.findByUserIdAndTestIdOrderByAttemptedAtDesc(userId, testId);
        ExamTest test = examTestRepository.findById(testId).orElse(null);
        String title  = test != null ? test.getTitle() : "";
        return attempts.stream()
                .map(a -> toSummaryDto(a, title))
                .collect(Collectors.toList());
    }

    // Chi tiết 1 lần thi (xem lại bài)
    public ExamAttemptDetailDto getAttemptDetail(Long attemptId, Authentication auth) {
        Integer userId = resolveUserId(auth);
        UserExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy lịch sử làm bài id=" + attemptId));

        if (!attempt.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Không có quyền xem bài này.");
        }

        List<UserExamQuestionResult> qResults = questionResultRepository.findByAttemptId(attemptId);

        List<String> mongoIds = qResults.stream()
                .map(UserExamQuestionResult::getMongoDocId).collect(Collectors.toList());
        Map<String, ExamQuestion> mongoMap = examQuestionRepository.findAllById(mongoIds)
                .stream().collect(Collectors.toMap(ExamQuestion::getId, q -> q));

        Map<String, String> correctAnswerMap = buildCorrectAnswerMap(attempt.getTestId());

        // Build map: mongoDocId → {paperType, partNumber}
        Map<String, String[]> paperPartMap = buildPaperPartMap(attempt.getTestId());

        ExamTest test = examTestRepository.findById(attempt.getTestId()).orElse(null);
        String testTitle = test != null ? test.getTitle() : "";

        List<ExamAttemptDetailDto.QuestionResultDetailDto> details = qResults.stream()
                .map(qr -> {
                    String[] pp = paperPartMap.get(qr.getMongoDocId());
                    return toDetailDto(qr, mongoMap.get(qr.getMongoDocId()),
                            correctAnswerMap.get(qr.getMongoDocId()),
                            pp != null ? pp[0] : null,
                            pp != null && pp[1] != null ? Integer.parseInt(pp[1]) : null);
                })
                .collect(Collectors.toList());

        return new ExamAttemptDetailDto(
                attempt.getId(), attempt.getTestId(), testTitle,
                attempt.getWritingScore(), attempt.getSpeakingScore(),
                attempt.getCorrectCount(), attempt.getTotalCount(),
                attempt.getAttemptedAt(), details
        );
    }

    // Helpers
    private Integer resolveUserId(Authentication auth) {
        String email = auth.getName();
        return userRepository.findByEmail(email)
                .map(User::getId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private Map<String, String> buildCorrectAnswerMap(Integer testId) {
        List<ExamPaper> papers = examPaperRepository.findAllByTestId(testId);
        Map<String, String> map = new HashMap<>();
        for (ExamPaper paper : papers) {
            List<ExamPart> parts = examPartRepository.findByPaperIdWithQuestions(paper.getId());
            for (ExamPart part : parts) {
                for (ExamQuestionIndex idx : part.getQuestions()) {
                    if (idx.getCorrectAnswer() != null) {
                        map.put(idx.getMongoDocId(), idx.getCorrectAnswer());
                    }
                }
            }
        }
        return map;
    }

    /** Returns map: mongoDocId → [paperType, partNumber_as_string] */
    private Map<String, String[]> buildPaperPartMap(Integer testId) {
        List<ExamPaper> papers = examPaperRepository.findAllByTestId(testId);
        Map<String, String[]> map = new HashMap<>();
        for (ExamPaper paper : papers) {
            List<ExamPart> parts = examPartRepository.findByPaperIdWithQuestions(paper.getId());
            for (ExamPart part : parts) {
                for (ExamQuestionIndex idx : part.getQuestions()) {
                    map.put(idx.getMongoDocId(),
                            new String[]{paper.getPaperType().name(), String.valueOf(part.getPartNumber())});
                }
            }
        }
        return map;
    }

    private ExamAttemptSummaryDto toSummaryDto(UserExamAttempt a, String testTitle) {
        return new ExamAttemptSummaryDto(
                a.getId(), a.getTestId(), testTitle,
                a.getWritingScore(), a.getSpeakingScore(),
                a.getCorrectCount(), a.getTotalCount(),
                a.getListeningCorrect() != null ? a.getListeningCorrect() : 0,
                a.getListeningTotal()   != null ? a.getListeningTotal()   : 0,
                a.getRwCorrect()        != null ? a.getRwCorrect()        : 0,
                a.getRwTotal()          != null ? a.getRwTotal()          : 0,
                a.getAttemptedAt()
        );
    }

    // Server-side answer checking (authoritative)
    @SuppressWarnings({"unchecked","rawtypes"})
    private Boolean serverCheckAnswer(String userAnswer, String correctAnswer,
                                      String qType, ExamQuestion mongo) {
        try {
            if ("FILL_IN_FORM".equals(qType) || "MATCHING".equals(qType)) {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();

                // ua: user answer — always Map<String, String>
                Map<String, String> ua;
                try {
                    ua = mapper.readValue(userAnswer, Map.class);
                } catch (Exception ex) {
                    return false;
                }

                // ca: correct answer — value có thể là String hoặc List<String>
                Map<String, Object> caRaw;
                try {
                    caRaw = mapper.readValue(correctAnswer, Map.class);
                } catch (Exception ex) {
                    return false;
                }

                // Build resolved map: key → List<String> of accepted answers
                Map<String, List<String>> caAccepted = new HashMap<>();
                for (Map.Entry<String, Object> e : caRaw.entrySet()) {
                    Object val = e.getValue();
                    List<String> acceptedList = new ArrayList<>();
                    if (val instanceof List) {
                        for (Object item : (List<?>) val) {
                            if (item != null) acceptedList.add(item.toString().trim().toLowerCase());
                        }
                    } else if (val != null) {
                        String strVal = val.toString().trim();
                        // Handle A/B/C letter with blanksOptions
                        if ("FILL_IN_FORM".equals(qType) && mongo != null
                                && mongo.getBlanksOptions() != null
                                && strVal.length() == 1 && Character.isLetter(strVal.charAt(0))) {
                            int idx = Character.toUpperCase(strVal.charAt(0)) - 'A';
                            int blankNum = Integer.parseInt(e.getKey());
                            Optional<String> resolved = mongo.getBlanksOptions().stream()
                                    .filter(b -> {
                                        Object num = b.get("number");
                                        return num != null && Integer.parseInt(num.toString()) == blankNum;
                                    })
                                    .map(b -> {
                                        Object opts = b.get("options");
                                        if (opts instanceof List<?> list && idx < list.size()) {
                                            return list.get(idx).toString();
                                        }
                                        return null;
                                    })
                                    .filter(Objects::nonNull)
                                    .findFirst();
                            acceptedList.add(resolved.orElse(strVal).trim().toLowerCase());
                        } else {
                            acceptedList.add(strVal.toLowerCase());
                        }
                    }
                    caAccepted.put(e.getKey(), acceptedList);
                }

                // Check: all blanks in correct answer must be answered correctly
                return caAccepted.entrySet().stream().allMatch(e -> {
                    String uaVal = (ua.getOrDefault(e.getKey(), "")).trim().toLowerCase();
                    return e.getValue().contains(uaVal);
                });
            }
        } catch (Exception e) {
            log.warn("[ExamAttempt] Lỗi parse JSON answer: {}", e.getMessage());
        }

        // MC / FILL_IN_TEXT: correct_answer cũng có thể là array
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            List<?> arr = mapper.readValue(correctAnswer, List.class);
            String uaLower = userAnswer.trim().toLowerCase();
            return arr.stream().anyMatch(v -> v != null && v.toString().trim().equalsIgnoreCase(uaLower));
        } catch (Exception ignored) { /* not an array, fall through */ }

        return userAnswer.trim().equalsIgnoreCase(correctAnswer.trim());
    }

    private ExamAttemptDetailDto.QuestionResultDetailDto toDetailDto(
            UserExamQuestionResult qr,
            ExamQuestion mongo,
            String correctAnswer,
            String paperType,
            Integer partNumber) {

        ExamAttemptDetailDto.QuestionResultDetailDto d = new ExamAttemptDetailDto.QuestionResultDetailDto();
        d.setMongoDocId(qr.getMongoDocId());
        d.setQuestionType(qr.getQuestionType());
        d.setPaperType(paperType);
        d.setPartNumber(partNumber);
        d.setUserAnswer(qr.getUserAnswer());
        d.setIsCorrect(qr.getIsCorrect());
        d.setCorrectAnswer(correctAnswer);
        d.setLlmScore(qr.getLlmScore());
        d.setLlmFeedback(qr.getLlmFeedback());
        d.setLlmBreakdown(qr.getLlmBreakdown());
        d.setLlmSuggestion(qr.getLlmSuggestion());
        d.setWordCount(qr.getWordCount());
        d.setTranscript(qr.getTranscript());

        if (mongo != null) {
            d.setInstruction(mongo.getInstruction());
            d.setQuestionNumber(mongo.getQuestionNumber());
            d.setText(mongo.getText());
            d.setSentence(mongo.getSentence());
            d.setFormContent(mongo.getFormContent());
            d.setPromptText(mongo.getPromptText());
            d.setPartTitle(mongo.getPartTitle());
            d.setQuestionNumberStart(mongo.getQuestionNumberStart());
            d.setQuestionNumberEnd(mongo.getQuestionNumberEnd());
            d.setBlanksOptions(mongo.getBlanksOptions());
            d.setOptions(mongo.getOptions());
            d.setPassageImageUrl(mongo.getPassageImageUrl());
            d.setLeftItems(mongo.getLeftItems());
            d.setRightItems(mongo.getRightItems());
            d.setBulletPoints(mongo.getBulletPoints());
            d.setStoryImages(mongo.getStoryImages());
            d.setImageUrl(mongo.getImageUrl());
        }
        return d;
    }
}
