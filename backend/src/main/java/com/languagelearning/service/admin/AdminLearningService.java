package com.languagelearning.service.admin;

import com.languagelearning.document.Question;
import com.languagelearning.entity.QuestionIndex;
import com.languagelearning.repository.mongo.QuestionRepository;
import com.languagelearning.repository.mysql.QuestionIndexRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminLearningService {

    private final QuestionIndexRepository questionIndexRepository;
    private final QuestionRepository questionRepository;

    public Page<QuestionIndex> searchQuestions(Integer levelId, String type, String q, int page, int size) {
        // find matching mongo ids if q provided
        Set<String> matchingMongoIds = new HashSet<>();
        if (q != null && !q.isBlank()) {
            String t = q.trim();
            // search in question_text
            questionRepository.findByQuestionTextContainingIgnoreCase(t).forEach(d -> matchingMongoIds.add(d.getId()));
            // search in options / optionsAlt
            questionRepository.findByOptionsContaining(t).forEach(d -> matchingMongoIds.add(d.getId()));
            questionRepository.findByOptionsAltContaining(t).forEach(d -> matchingMongoIds.add(d.getId()));
            // search in correct answers
            questionRepository.findByCorrectAnswersContaining(t).forEach(d -> matchingMongoIds.add(d.getId()));
            // also allow searching by id substring — handled later by SQL LIKE on mongo_question_id
        }

        Specification<QuestionIndex> spec = Specification.where(null);
        if (levelId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("levelId"), levelId));
        }
        if (type != null && !type.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("questionType"), com.languagelearning.entity.QuestionType.valueOf(type)));
        }

        if (!matchingMongoIds.isEmpty()) {
            spec = spec.and((root, query, cb) -> root.get("mongoQuestionId").in(matchingMongoIds));
        } else if (q != null && !q.isBlank()) {
            String like = "%" + q.trim() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("mongoQuestionId")), like.toLowerCase()),
                    cb.like(cb.lower(root.get("correctAnswer")), like.toLowerCase())
            ));
        }

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));
        return questionIndexRepository.findAll(spec, pageable);
    }

    @Transactional
    public Map<String, Object> bulkAction(String action, List<Long> ids, Integer targetLevelId) {
        Map<String, Object> out = new HashMap<>();
        if (ids == null || ids.isEmpty()) {
            out.put("updated", 0);
            return out;
        }
        List<QuestionIndex> rows = questionIndexRepository.findAllById(ids);

        switch (action) {
            case "delete":
                // delete mysql rows and their mongo docs
                List<String> mongoIds = rows.stream().map(QuestionIndex::getMongoQuestionId).filter(Objects::nonNull).collect(Collectors.toList());
                questionIndexRepository.deleteAll(rows);
                if (!mongoIds.isEmpty()) questionRepository.deleteAllById(mongoIds);
                out.put("deleted", rows.size());
                break;
            case "duplicate":
                int created = 0;
                for (QuestionIndex r : rows) {
                    // duplicate mongo doc if exists
                    String newMongoId = null;
                    if (r.getMongoQuestionId() != null) {
                        questionRepository.findById(r.getMongoQuestionId()).ifPresent(doc -> {
                            Question copy = new Question();
                            copy.setQuestionText(doc.getQuestionText());
                            copy.setQuestionType(doc.getQuestionType());
                            copy.setOptions(doc.getOptions());
                            copy.setOptionsAlt(doc.getOptionsAlt());
                            copy.setCorrectAnswers(doc.getCorrectAnswers());
                            copy.setExplanation(doc.getExplanation());
                            copy.setPoints(doc.getPoints());
                            copy.setLevelId(doc.getLevelId());
                            copy.setSkillTreeId(doc.getSkillTreeId());
                            copy.setSkillNodeId(doc.getSkillNodeId());
                            copy.setPlacementGroup(doc.getPlacementGroup());
                            copy.setTags(doc.getTags());
                            copy.setMetadata(doc.getMetadata());
                            Question saved = questionRepository.save(copy);
                            // set new id in outer scope by side-effect via array
                            // but here we return via closure not possible; workaround below
                        });
                    }
                    // simpler: create new QuestionIndex pointing to same mongo id (no deep copy)
                    QuestionIndex dup = new QuestionIndex();
                    dup.setMongoQuestionId(r.getMongoQuestionId());
                    dup.setNodeId(r.getNodeId());
                    dup.setLevelId(r.getLevelId());
                    dup.setQuestionType(r.getQuestionType());
                    dup.setCorrectAnswer(r.getCorrectAnswer());
                    questionIndexRepository.save(dup);
                    created++;
                }
                out.put("created", created);
                break;
            case "changeLevel":
                if (targetLevelId == null) throw new IllegalArgumentException("targetLevelId required for changeLevel");
                for (QuestionIndex r : rows) {
                    r.setLevelId(targetLevelId);
                }
                questionIndexRepository.saveAll(rows);
                // update mongo documents levelId too
                List<String> toUpdate = rows.stream().map(QuestionIndex::getMongoQuestionId).filter(Objects::nonNull).collect(Collectors.toList());
                if (!toUpdate.isEmpty()) {
                    questionRepository.findAllById(toUpdate).forEach(doc -> {
                        doc.setLevelId(targetLevelId);
                        questionRepository.save(doc);
                    });
                }
                out.put("updated", rows.size());
                break;
            case "hide":
            case "show":
                boolean hide = action.equals("hide");
                int updated = 0;
                for (QuestionIndex r : rows) {
                    String mid = r.getMongoQuestionId();
                    if (mid == null) continue;
                    Optional<Question> dq = questionRepository.findById(mid);
                    if (dq.isEmpty()) continue;
                    Question doc = dq.get();
                    List<String> tags = doc.getTags() == null ? new ArrayList<>() : new ArrayList<>(doc.getTags());
                    boolean hasHidden = tags.stream().anyMatch(t -> t.equalsIgnoreCase("hidden"));
                    if (hide && !hasHidden) {
                        tags.add("hidden");
                        doc.setTags(tags);
                        questionRepository.save(doc);
                        updated++;
                    } else if (!hide && hasHidden) {
                        List<String> newTags = tags.stream().filter(t -> !t.equalsIgnoreCase("hidden")).collect(Collectors.toList());
                        doc.setTags(newTags);
                        questionRepository.save(doc);
                        updated++;
                    }
                }
                out.put("updated", updated);
                break;
            default:
                throw new IllegalArgumentException("Unknown action: " + action);
        }

        return out;
    }

    @Transactional
    public Map<String, Object> createQuestion(Map<String, Object> body) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Extract data from request body
            Integer levelId = body.get("levelId") != null ? Integer.parseInt(body.get("levelId").toString()) : null;
            String type = (String) body.get("type");
            String questionText = (String) body.get("questionText");
            Integer nodeId = body.get("nodeId") != null ? Integer.parseInt(body.get("nodeId").toString()) : null;
            String audioUrl = (String) body.get("audioUrl");
            String explanation = (String) body.get("explanation");

            // MATCHING: tạo nhiều document từ matchingPairs list
            if ("MATCHING".equalsIgnoreCase(type) && body.containsKey("matchingPairs")) {
                List<String> pairs = (List<String>) body.get("matchingPairs");
                List<Long> createdIds = new ArrayList<>();
                for (String pair : pairs) {
                    if (pair == null || !pair.contains("|")) continue;
                    String[] parts = pair.split("\\|", 2);
                    String left = parts[0].trim();
                    String right = parts[1].trim();
                    if (left.isBlank() || right.isBlank()) continue;

                    Question doc = new Question();
                    doc.setQuestionText(left);
                    doc.setQuestionType(type);
                    doc.setLevelId(levelId);
                    doc.setExplanation(explanation);
                    if (audioUrl != null && !audioUrl.isBlank()) {
                        Question.Metadata meta = new Question.Metadata();
                        meta.setAudioUrl(audioUrl);
                        doc.setMetadata(meta);
                    }
                    Question saved = questionRepository.save(doc);

                    QuestionIndex index = new QuestionIndex();
                    index.setMongoQuestionId(saved.getId());
                    index.setNodeId(nodeId);
                    index.setLevelId(levelId);
                    index.setQuestionType(com.languagelearning.entity.QuestionType.MATCHING);
                    index.setCorrectAnswer(right);
                    createdIds.add(questionIndexRepository.save(index).getId());
                }
                result.put("createdCount", createdIds.size());
                result.put("ids", createdIds);
                if (!createdIds.isEmpty()) result.put("id", createdIds.get(0));
                return result;
            }

            // Create MongoDB document (VOCAB / LISTENING / SPEAKING)
            Question mongoDoc = new Question();
            mongoDoc.setQuestionText(questionText);
            mongoDoc.setQuestionType(type);
            mongoDoc.setLevelId(levelId);
            mongoDoc.setExplanation(explanation);
            if (audioUrl != null && !audioUrl.isBlank()) {
                Question.Metadata metadata = new Question.Metadata();
                metadata.setAudioUrl(audioUrl);
                mongoDoc.setMetadata(metadata);
            }

            // Type-specific fields
            switch (type != null ? type.toUpperCase() : "") {
                case "VOCAB": {
                    List<String> options = (List<String>) body.get("options");
                    String correctAnswer = (String) body.get("correctAnswer");
                    mongoDoc.setOptions(options);
                    mongoDoc.setCorrectAnswers(correctAnswer != null ? List.of(correctAnswer) : new ArrayList<>());
                    break;
                }
                case "LISTENING": {
                    Integer blankCount = body.get("blankCount") != null ? Integer.parseInt(body.get("blankCount").toString()) : 0;
                    mongoDoc.setBlankCount(blankCount);
                    if (body.containsKey("correctAnswer")) {
                        String correctAnswer = (String) body.get("correctAnswer");
                        mongoDoc.setCorrectAnswers(correctAnswer != null ? List.of(correctAnswer) : new ArrayList<>());
                    }
                    break;
                }
                case "SPEAKING": {
                    // question_text chứa các câu ngăn cách bằng newline thật
                    String sampleAnswer = (String) body.get("sampleAnswer");
                    List<String> keywords = (List<String>) body.get("keywords");
                    mongoDoc.setSampleAnswer(sampleAnswer);
                    mongoDoc.setKeywords(keywords);
                    break;
                }
                case "MATCHING": {
                    // Không lưu đáp án trong mongo
                    break;
                }
            }

            Question savedDoc = questionRepository.save(mongoDoc);

            // Create MySQL index record
            QuestionIndex index = new QuestionIndex();
            index.setMongoQuestionId(savedDoc.getId());
            index.setNodeId(nodeId);
            index.setLevelId(levelId);
            if (type != null) {
                try {
                    index.setQuestionType(com.languagelearning.entity.QuestionType.valueOf(type));
                } catch (IllegalArgumentException e) {
                    // ignore
                }
            }
            if (("VOCAB".equalsIgnoreCase(type) || "LISTENING".equalsIgnoreCase(type) || "MATCHING".equalsIgnoreCase(type)) && body.containsKey("correctAnswer")) {
                String correctAnswer = (String) body.get("correctAnswer");
                index.setCorrectAnswer(correctAnswer);
            }
            QuestionIndex savedIndex = questionIndexRepository.save(index);

            result.put("id", savedIndex.getId());
            result.put("mongoQuestionId", savedDoc.getId());
            return result;
        } catch (Exception e) {
            result.put("error", e.getMessage());
            return result;
        }
    }

    @Transactional
    public Map<String, Object> updateQuestion(Long id, Map<String, Object> body) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            Optional<QuestionIndex> indexOpt = questionIndexRepository.findById(id);
            if (indexOpt.isEmpty()) {
                result.put("error", "Question not found");
                return result;
            }

            QuestionIndex index = indexOpt.get();
            String mongoId = index.getMongoQuestionId();

            // Extract data from request body
            Integer levelId = body.get("levelId") != null ? Integer.parseInt(body.get("levelId").toString()) : index.getLevelId();
            String type = body.get("type") != null ? (String) body.get("type") : (index.getQuestionType() != null ? index.getQuestionType().name() : null);
            String questionText = body.get("questionText") != null ? (String) body.get("questionText") : null;
            String audioUrl = (String) body.get("audioUrl");
            String explanation = (String) body.get("explanation");
            Integer nodeId = body.get("nodeId") != null ? Integer.parseInt(body.get("nodeId").toString()) : index.getNodeId();

            // Update MongoDB document if exists
            if (mongoId != null) {
                Optional<Question> mongoOpt = questionRepository.findById(mongoId);
                if (mongoOpt.isPresent()) {
                    Question mongoDoc = mongoOpt.get();
                    if (questionText != null) mongoDoc.setQuestionText(questionText);
                    if (type != null) mongoDoc.setQuestionType(type);
                    if (explanation != null) mongoDoc.setExplanation(explanation);
                    if (levelId != null) mongoDoc.setLevelId(levelId);
                    if (audioUrl != null) {
                        Question.Metadata metadata = mongoDoc.getMetadata() != null ? mongoDoc.getMetadata() : new Question.Metadata();
                        metadata.setAudioUrl(audioUrl);
                        mongoDoc.setMetadata(metadata);
                    }

                    // Type-specific fields update
                    switch (type != null ? type.toUpperCase() : "") {
                        case "VOCAB":
                            if (body.containsKey("options")) {
                                mongoDoc.setOptions((List<String>) body.get("options"));
                            }
                            if (body.containsKey("correctAnswer")) {
                                String correctAnswer = (String) body.get("correctAnswer");
                                mongoDoc.setCorrectAnswers(correctAnswer != null ? List.of(correctAnswer) : new ArrayList<>());
                            }
                            break;
                            
                        case "LISTENING":
                            if (body.containsKey("blankCount")) {
                                Integer blankCount = Integer.parseInt(body.get("blankCount").toString());
                                mongoDoc.setBlankCount(blankCount);
                            }
                            if (body.containsKey("correctAnswer")) {
                                String correctAnswer = (String) body.get("correctAnswer");
                                mongoDoc.setCorrectAnswers(correctAnswer != null ? List.of(correctAnswer) : new ArrayList<>());
                            }
                            break;
                            
                        case "SPEAKING":
                            if (body.containsKey("sampleAnswer")) {
                                mongoDoc.setSampleAnswer((String) body.get("sampleAnswer"));
                            }
                            if (body.containsKey("keywords")) {
                                mongoDoc.setKeywords((List<String>) body.get("keywords"));
                            }
                            break;

                        case "MATCHING":
                            // chỉ cập nhật vế trái trong Mongo
                            if (body.containsKey("questionText")) {
                                mongoDoc.setQuestionText(
                                        String.valueOf(body.get("questionText"))
                                );
                            }
                            break;
                    }

                    questionRepository.save(mongoDoc);
                }
            }

            // Update MySQL index
            index.setLevelId(levelId);
            index.setNodeId(nodeId);
            if (type != null) {
                try {
                    index.setQuestionType(com.languagelearning.entity.QuestionType.valueOf(type));
                } catch (IllegalArgumentException e) {
                    // ignore
                }
            }
            if (("VOCAB".equalsIgnoreCase(type) || "LISTENING".equalsIgnoreCase(type) || "MATCHING".equalsIgnoreCase(type)) && body.containsKey("correctAnswer")) {
                index.setCorrectAnswer((String) body.get("correctAnswer"));
            }
            questionIndexRepository.save(index);

            result.put("id", id);
            result.put("success", true);
            return result;
        } catch (Exception e) {
            result.put("error", e.getMessage());
            return result;
        }
    }
    @Transactional
    public Map<String, Object> importQuestions(MultipartFile file, String type, Integer levelId) {
        Map<String, Object> result = new HashMap<>();
        List<String> errors = new ArrayList<>();
        int imported = 0;

        try (InputStream is = file.getInputStream();
             Workbook wb = WorkbookFactory.create(is)) {

            // Find sheet by name (case-insensitive) or use first sheet
            Sheet sheet = null;
            for (int i = 0; i < wb.getNumberOfSheets(); i++) {
                if (wb.getSheetName(i).equalsIgnoreCase(type)) {
                    sheet = wb.getSheetAt(i);
                    break;
                }
            }
            if (sheet == null) sheet = wb.getSheetAt(0);

            // Skip row 0 (header) and row 1 (description), data starts at row 2
            for (int ri = 2; ri <= sheet.getLastRowNum(); ri++) {
                Row row = sheet.getRow(ri);
                if (row == null) continue;

                // Skip completely empty rows
                boolean allEmpty = true;
                for (Cell c : row) {
                    if (c != null && c.getCellType() != CellType.BLANK && !getCellString(c).isBlank()) {
                        allEmpty = false; break;
                    }
                }
                if (allEmpty) continue;

                try {
                    switch (type.toUpperCase()) {
                        case "VOCAB":
                            imported += importVocabRow(row, levelId, errors, ri);
                            break;
                        case "LISTENING":
                            imported += importListeningRow(row, levelId, errors, ri);
                            break;
                        case "SPEAKING":
                            imported += importSpeakingRow(row, levelId, errors, ri);
                            break;
                        case "MATCHING":
                            imported += importMatchingRow(row, levelId, errors, ri);
                            break;
                        default:
                            errors.add("Type không hỗ trợ: " + type);
                    }
                } catch (Exception e) {
                    errors.add("Dòng " + (ri + 1) + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            errors.add("Không thể đọc file: " + e.getMessage());
        }

        result.put("imported", imported);
        result.put("errors", errors);
        return result;
    }

    private int importVocabRow(Row row, Integer levelId, List<String> errors, int ri) {
        // Columns: question_text | option_1 | option_2 | option_3 | option_4 | correct_answer | audio_url
        String questionText  = getCellString(row.getCell(0));
        String opt1          = getCellString(row.getCell(1));
        String opt2          = getCellString(row.getCell(2));
        String opt3          = getCellString(row.getCell(3));
        String opt4          = getCellString(row.getCell(4));
        String correctAnswer = getCellString(row.getCell(5));
        String audioUrl      = getCellString(row.getCell(6));

        if (questionText.isBlank()) { errors.add("Dòng " + (ri + 1) + ": question_text bắt buộc"); return 0; }
        if (opt1.isBlank())         { errors.add("Dòng " + (ri + 1) + ": option_1 bắt buộc");      return 0; }
        if (opt2.isBlank())         { errors.add("Dòng " + (ri + 1) + ": option_2 bắt buộc");      return 0; }
        if (correctAnswer.isBlank()){ errors.add("Dòng " + (ri + 1) + ": correct_answer bắt buộc"); return 0; }

        List<String> options = new ArrayList<>();
        options.add(opt1); options.add(opt2);
        if (!opt3.isBlank()) options.add(opt3);
        if (!opt4.isBlank()) options.add(opt4);

        Question doc = new Question();
        doc.setQuestionText(questionText);
        doc.setQuestionType("VOCAB");
        doc.setLevelId(levelId);
        doc.setOptions(options);
        doc.setCorrectAnswers(List.of(correctAnswer));
        if (!audioUrl.isBlank()) {
            Question.Metadata meta = new Question.Metadata();
            meta.setAudioUrl(audioUrl);
            doc.setMetadata(meta);
        }
        Question saved = questionRepository.save(doc);

        QuestionIndex idx = new QuestionIndex();
        idx.setMongoQuestionId(saved.getId());
        idx.setLevelId(levelId);
        idx.setQuestionType(com.languagelearning.entity.QuestionType.VOCAB);
        idx.setCorrectAnswer(correctAnswer);
        questionIndexRepository.save(idx);
        return 1;
    }

    private int importListeningRow(Row row, Integer levelId, List<String> errors, int ri) {
        // Columns: question_text | blank_count | correct_answer | audio_url
        String questionText  = getCellString(row.getCell(0));
        String blankCountStr = getCellString(row.getCell(1));
        String correctAnswer = getCellString(row.getCell(2));
        String audioUrl      = getCellString(row.getCell(3));

        if (questionText.isBlank()) { errors.add("Dòng " + (ri + 1) + ": question_text bắt buộc");  return 0; }
        if (blankCountStr.isBlank()){ errors.add("Dòng " + (ri + 1) + ": blank_count bắt buộc");    return 0; }
        if (correctAnswer.isBlank()){ errors.add("Dòng " + (ri + 1) + ": correct_answer bắt buộc"); return 0; }

        int blankCount;
        try { blankCount = Integer.parseInt(blankCountStr.trim()); }
        catch (NumberFormatException e) { errors.add("Dòng " + (ri + 1) + ": blank_count phải là số nguyên"); return 0; }

        Question doc = new Question();
        doc.setQuestionText(questionText);
        doc.setQuestionType("LISTENING");
        doc.setLevelId(levelId);
        doc.setBlankCount(blankCount);
        doc.setCorrectAnswers(List.of(correctAnswer));
        if (!audioUrl.isBlank()) {
            Question.Metadata meta = new Question.Metadata();
            meta.setAudioUrl(audioUrl);
            doc.setMetadata(meta);
        }
        Question saved = questionRepository.save(doc);

        QuestionIndex idx = new QuestionIndex();
        idx.setMongoQuestionId(saved.getId());
        idx.setLevelId(levelId);
        idx.setQuestionType(com.languagelearning.entity.QuestionType.LISTENING);
        idx.setCorrectAnswer(correctAnswer);
        questionIndexRepository.save(idx);
        return 1;
    }

    private int importSpeakingRow(Row row, Integer levelId, List<String> errors, int ri) {
        // Columns: question_text | sample_answer | audio_url
        // question_text: các câu luyện nói, ngăn cách bằng \n (mỗi câu = 1 dòng)
        String questionText = getCellString(row.getCell(0));
        String sampleAnswer = getCellString(row.getCell(1));
        String audioUrl     = getCellString(row.getCell(2));

        if (questionText.isBlank()) { errors.add("Dòng " + (ri + 1) + ": question_text bắt buộc"); return 0; }
        if (audioUrl.isBlank())     { errors.add("Dòng " + (ri + 1) + ": audio_url bắt buộc");     return 0; }

        Question doc = new Question();
        doc.setQuestionText(questionText);
        doc.setQuestionType("SPEAKING");
        doc.setLevelId(levelId);
        if (!sampleAnswer.isBlank()) doc.setSampleAnswer(sampleAnswer);
        if (!audioUrl.isBlank()) {
            Question.Metadata meta = new Question.Metadata();
            meta.setAudioUrl(audioUrl);
            doc.setMetadata(meta);
        }
        Question saved = questionRepository.save(doc);

        QuestionIndex idx = new QuestionIndex();
        idx.setMongoQuestionId(saved.getId());
        idx.setLevelId(levelId);
        idx.setQuestionType(com.languagelearning.entity.QuestionType.SPEAKING);
        questionIndexRepository.save(idx);
        return 1;
    }

    private int importMatchingRow(Row row, Integer levelId, List<String> errors, int ri) {
        // Columns: left | right
        String left  = getCellString(row.getCell(0));
        String right = getCellString(row.getCell(1));

        if (left.isBlank())  { errors.add("Dòng " + (ri + 1) + ": left bắt buộc");  return 0; }
        if (right.isBlank()) { errors.add("Dòng " + (ri + 1) + ": right bắt buộc"); return 0; }

        Question doc = new Question();
        doc.setQuestionText(left);
        doc.setQuestionType("MATCHING");
        doc.setLevelId(levelId);
        Question saved = questionRepository.save(doc);

        QuestionIndex idx = new QuestionIndex();
        idx.setMongoQuestionId(saved.getId());
        idx.setLevelId(levelId);
        idx.setQuestionType(com.languagelearning.entity.QuestionType.MATCHING);
        idx.setCorrectAnswer(right);
        questionIndexRepository.save(idx);
        return 1;
    }

    private String getCellString(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                double d = cell.getNumericCellValue();
                yield (d == Math.floor(d)) ? String.valueOf((long) d) : String.valueOf(d);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> {
                try { yield cell.getStringCellValue().trim(); }
                catch (Exception e) { yield String.valueOf(cell.getNumericCellValue()); }
            }
            default -> "";
        };
    }
}
