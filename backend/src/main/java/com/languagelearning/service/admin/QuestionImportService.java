package com.languagelearning.service.admin;

import com.languagelearning.document.GeneralRevisionQuestion;
import com.languagelearning.dto.admin.revision.ImportResultDto;
import com.languagelearning.entity.GeneralRevisionQuestionIndex;
import com.languagelearning.entity.GeneralRevisionTask;
import com.languagelearning.repository.mongo.GeneralRevisionQuestionRepository;
import com.languagelearning.repository.mysql.GeneralRevisionQuestionIndexRepository;
import com.languagelearning.repository.mysql.GeneralRevisionTaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

/**
 * Import câu hỏi revision từ file Excel (.xls / .xlsx).
 *
 * Quy tắc chung cho mọi sheet:
 *   - Row 0 : header (tên cột) — bỏ qua
 *   - Row 1 : mô tả / ghi chú   — bỏ qua
 *   - Row 2+: dữ liệu thực
 *
 * Hỗ trợ:
 *   - VOCAB_IMAGE : sheet "VOCAB_IMAGE"   | cột: image_url, correct_answer
 *   - LISTENING   : sheet "LISTENING"     | cột: image_url, audio_url, sentence, correct_answer
 *   - MATCHING    : sheet "MATCHING"      | cột: pair_index, left, right
 *   - WRITING     : sheet "WRITING"       | cột: image_url, category_label, category_slots, correct_answer_json
 *
 * Sheet lookup: tìm theo tên chính xác, nếu không thấy thì fallback tìm case-insensitive
 * hoặc lấy sheet đầu tiên nếu workbook chỉ có 1 sheet.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class QuestionImportService {

    private final GeneralRevisionTaskRepository             taskRepository;
    private final GeneralRevisionQuestionIndexRepository    questionIndexRepository;
    private final GeneralRevisionQuestionRepository         mongoQuestionRepository;

    // ══════════════════════════════════════════════════════════════════════════
    //  ENTRY POINT
    // ══════════════════════════════════════════════════════════════════════════

    @Transactional
    public ImportResultDto importQuestions(Integer topicId, Integer taskId, MultipartFile file) {

        // 1. Validate task
        GeneralRevisionTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy task: " + taskId));
        if (!task.getTopic().getId().equals(topicId)) {
            throw new IllegalArgumentException("Task không thuộc topic: " + topicId);
        }
        String questionType = task.getQuestionType();

        // 2. Mở workbook — WorkbookFactory tự nhận .xls và .xlsx
        try (Workbook wb = WorkbookFactory.create(file.getInputStream())) {

            List<String> errors  = new ArrayList<>();
            int          imported = 0;

            // 3. Tính startOrder (append sau câu đã có)
            int startOrder = calcStartOrder(topicId, taskId);

            // 4. Dispatch theo loại
            switch (questionType) {
                case "VOCAB_IMAGE" -> {
                    Sheet sheet = findSheet(wb, "VOCAB_IMAGE", errors);
                    if (sheet != null) imported = importVocabImage(sheet, topicId, taskId, startOrder, errors);
                }
                case "LISTENING" -> {
                    Sheet sheet = findSheet(wb, "LISTENING", errors);
                    if (sheet != null) imported = importListening(sheet, topicId, taskId, startOrder, errors);
                }
                case "MATCHING" -> {
                    Sheet sheet = findSheet(wb, "MATCHING", errors);
                    if (sheet != null) imported = importMatching(sheet, topicId, taskId, startOrder, errors);
                }
                case "WRITING" -> {
                    Sheet sheet = findSheet(wb, "WRITING", errors);
                    if (sheet != null) imported = importWriting(sheet, topicId, taskId, startOrder, errors);
                }
                default -> errors.add("Loại câu hỏi không được hỗ trợ: " + questionType);
            }

            return ImportResultDto.builder()
                    .imported(imported)
                    .errors(errors)
                    .build();

        } catch (IOException e) {
            log.error("Không thể đọc file Excel: {}", e.getMessage(), e);
            throw new IllegalArgumentException("Không thể đọc file Excel: " + e.getMessage());
        } catch (Exception e) {
            log.error("Lỗi khi import Excel: {}", e.getMessage(), e);
            throw new IllegalArgumentException("Lỗi khi xử lý file: " + e.getMessage());
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  SHEET LOOKUP — flexible: exact → case-insensitive → first sheet
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Tìm sheet theo tên:
     * 1. Tìm chính xác
     * 2. Tìm case-insensitive
     * 3. Nếu workbook chỉ có 1 sheet → dùng luôn sheet đó
     * 4. Không tìm thấy → thêm lỗi, trả về null
     */
    private Sheet findSheet(Workbook wb, String sheetName, List<String> errors) {
        // Exact match
        Sheet sheet = wb.getSheet(sheetName);
        if (sheet != null) return sheet;

        // Case-insensitive
        for (int i = 0; i < wb.getNumberOfSheets(); i++) {
            if (wb.getSheetName(i).equalsIgnoreCase(sheetName)) {
                log.info("Sheet '{}' found via case-insensitive match as '{}'", sheetName, wb.getSheetName(i));
                return wb.getSheetAt(i);
            }
        }

        // Single-sheet workbook → dùng sheet đó, warn user
        if (wb.getNumberOfSheets() == 1) {
            log.warn("Sheet '{}' not found, using the only sheet '{}'", sheetName, wb.getSheetName(0));
            return wb.getSheetAt(0);
        }

        // All sheets listed in error for easier debugging
        List<String> names = new ArrayList<>();
        for (int i = 0; i < wb.getNumberOfSheets(); i++) names.add(wb.getSheetName(i));
        errors.add("Không tìm thấy sheet '" + sheetName + "'. Các sheet có trong file: " + names);
        return null;
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  VOCAB_IMAGE
    //  Row 0: header, Row 1: description (skip), Row 2+: data
    //  Cột: 0=image_url | 1=correct_answer
    // ══════════════════════════════════════════════════════════════════════════

    private int importVocabImage(Sheet sheet, Integer topicId, Integer taskId,
                                 int startOrder, List<String> errors) {
        int imported = 0;
        int order    = startOrder;

        for (Row row : sheet) {
            if (row.getRowNum() < 2) continue;  // skip header + description
            if (isRowEmpty(row, 2)) continue;

            String imageUrl     = cellStr(row, 0);
            String correctAnswer = cellStr(row, 1);

            // Validation
            List<String> rowErrors = new ArrayList<>();
            if (imageUrl.isBlank())      rowErrors.add("image_url bắt buộc");
            if (correctAnswer.isBlank()) rowErrors.add("correct_answer bắt buộc");
            if (!rowErrors.isEmpty()) {
                errors.add("Dòng " + (row.getRowNum() + 1) + ": " + String.join(", ", rowErrors));
                continue;
            }

            order++;
            GeneralRevisionQuestion doc = new GeneralRevisionQuestion();
            doc.setQuestionType("VOCAB_IMAGE");
            doc.setOrderIndex(order);
            doc.setImageUrl(imageUrl);
            mongoQuestionRepository.save(doc);

            questionIndexRepository.save(buildIndex(doc.getId(), topicId, taskId, "VOCAB_IMAGE", correctAnswer));
            imported++;
        }
        return imported;
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  LISTENING
    //  Row 0: header, Row 1: description (skip), Row 2+: data
    //  Cột: 0=image_url | 1=audio_url | 2=sentence | 3=correct_answer
    // ══════════════════════════════════════════════════════════════════════════

    private int importListening(Sheet sheet, Integer topicId, Integer taskId,
                                int startOrder, List<String> errors) {
        int imported = 0;
        int order    = startOrder;

        for (Row row : sheet) {
            if (row.getRowNum() < 2) continue;  // skip header + description
            if (isRowEmpty(row, 4)) continue;

            String imageUrl      = cellStr(row, 0);
            String audioUrl      = cellStr(row, 1);
            String sentence      = cellStr(row, 2);
            String correctAnswer = cellStr(row, 3);

            // Validation
            List<String> rowErrors = new ArrayList<>();
            if (audioUrl.isBlank())      rowErrors.add("audio_url bắt buộc");
            if (correctAnswer.isBlank()) rowErrors.add("correct_answer bắt buộc");
            if (!rowErrors.isEmpty()) {
                errors.add("Dòng " + (row.getRowNum() + 1) + ": " + String.join(", ", rowErrors));
                continue;
            }

            order++;
            GeneralRevisionQuestion doc = new GeneralRevisionQuestion();
            doc.setQuestionType("LISTENING");
            doc.setOrderIndex(order);
            doc.setImageUrl(imageUrl.isBlank() ? null : imageUrl);
            doc.setSentence(sentence.isBlank() ? null : sentence);

            GeneralRevisionQuestion.Metadata meta = new GeneralRevisionQuestion.Metadata();
            meta.setAudioUrl(audioUrl);
            doc.setMetadata(meta);

            mongoQuestionRepository.save(doc);
            questionIndexRepository.save(buildIndex(doc.getId(), topicId, taskId, "LISTENING", correctAnswer));
            imported++;
        }
        return imported;
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  MATCHING
    //  Row 0: header, Row 1: description (skip), Row 2+: data
    //  Cột: 0=left | 1=right
    //
    //  Toàn bộ file = 1 câu hỏi duy nhất với danh sách pairs.
    // ══════════════════════════════════════════════════════════════════════════

    private int importMatching(Sheet sheet, Integer topicId, Integer taskId,
                               int startOrder, List<String> errors) {
        int order = startOrder + 1;

        List<Map<String, String>> pairs = new ArrayList<>();

        for (Row row : sheet) {
            if (row.getRowNum() < 2) continue;  // skip header + description
            if (isRowEmpty(row, 2)) continue;

            String left  = cellStr(row, 0);
            String right = cellStr(row, 1);

            log.debug("MATCHING row {}: col0='{}' col1='{}'", row.getRowNum() + 1, left, right);

            if (left.isBlank() || right.isBlank()) {
                errors.add("Dòng " + (row.getRowNum() + 1) + " MATCHING: cả left và right đều bắt buộc");
                continue;
            }

            Map<String, String> pair = new LinkedHashMap<>();
            pair.put("left",  left);
            pair.put("right", right);
            pairs.add(pair);
        }

        if (pairs.isEmpty()) {
            errors.add("Không có pair hợp lệ nào để import");
            return 0;
        }

        flushMatching(pairs, topicId, taskId, order);
        return 1;
    }

    private void flushMatching(List<Map<String, String>> pairs, Integer topicId, Integer taskId, int order) {
        GeneralRevisionQuestion doc = new GeneralRevisionQuestion();
        doc.setQuestionType("MATCHING");
        doc.setOrderIndex(order);
        doc.setPairs(new ArrayList<>(pairs));
        mongoQuestionRepository.save(doc);
        questionIndexRepository.save(buildIndex(doc.getId(), topicId, taskId, "MATCHING", null));
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  WRITING
    //  Row 0: header, Row 1: description (skip), Row 2+: data
    //  Cột: 0=image_url | 1=category_label | 2=category_slots | 3=correct_answer_json
    //
    //  Mỗi câu hỏi gồm nhiều dòng (1 dòng/category).
    //  Câu hỏi mới bắt đầu khi cột image_url có giá trị (không rỗng).
    //  image_url có thể để trống ở các dòng category tiếp theo.
    //
    //  correct_answer_json (cột 3): JSON mảng đáp án cho từng slot của category đó.
    //  Ví dụ: [["apple","apples"],["banana"]]
    //  Nếu không có JSON hợp lệ, fallback coi như chuỗi đơn → [[value]]
    // ══════════════════════════════════════════════════════════════════════════

    private int importWriting(Sheet sheet, Integer topicId, Integer taskId,
                              int startOrder, List<String> errors) {
        int imported = 0;
        int order    = startOrder;

        String                   currentImageUrl = null;
        List<WritingCatRow>      currentCats     = new ArrayList<>();

        // Collect all data rows first (avoids getLastRowNum() unreliability with SheetJS files)
        List<Row> dataRows = new ArrayList<>();
        for (Row row : sheet) {
            if (row.getRowNum() >= 2 && !isRowEmpty(row, 2)) dataRows.add(row);
        }

        for (int i = 0; i <= dataRows.size(); i++) {   // extra sentinel iteration to flush last question
            Row     row   = (i < dataRows.size()) ? dataRows.get(i) : null;
            boolean isEnd = (row == null);

            if (!isEnd) {
                String imageUrl  = cellStr(row, 0);
                String catLabel  = cellStr(row, 1);
                String slotsStr  = cellStr(row, 2);
                String answerRaw = cellStr(row, 3);

                boolean isNewQuestion = !imageUrl.isBlank();

                // Flush previous if new question starts
                if (isNewQuestion && !currentCats.isEmpty()) {
                    order++;
                    flushWriting(currentImageUrl, currentCats, topicId, taskId, order);
                    imported++;
                    currentCats = new ArrayList<>();
                    currentImageUrl = null;
                }

                if (isNewQuestion) currentImageUrl = imageUrl;
                if (catLabel.isBlank()) continue;   // row chỉ có image, không có category

                int slots = 4;
                if (!slotsStr.isBlank()) {
                    try { slots = (int) Double.parseDouble(slotsStr); }
                    catch (NumberFormatException ignored) {
                        errors.add("Dòng " + (row.getRowNum() + 1) + " WRITING: category_slots không hợp lệ '" + slotsStr + "', dùng mặc định 4");
                    }
                }

                currentCats.add(new WritingCatRow(catLabel, slots, answerRaw));

            } else {
                // Sentinel end → flush last question
                if (!currentCats.isEmpty()) {
                    order++;
                    flushWriting(currentImageUrl, currentCats, topicId, taskId, order);
                    imported++;
                    currentCats = new ArrayList<>();
                    currentImageUrl = null;
                }
            }
        }

        return imported;
    }

    private void flushWriting(String imageUrl, List<WritingCatRow> cats,
                              Integer topicId, Integer taskId, int order) {

        List<Map<String, Object>>    categories      = new ArrayList<>();
        Map<String, List<List<String>>> correctAnswerMap = new LinkedHashMap<>();

        for (WritingCatRow cat : cats) {
            Map<String, Object> catEntry = new LinkedHashMap<>();
            catEntry.put("label", cat.label);
            catEntry.put("slots", cat.slots);
            categories.add(catEntry);

            if (!cat.answerRaw.isBlank()) {
                List<List<String>> parsed = parseWritingAnswer(cat.answerRaw, cat.slots);
                correctAnswerMap.put(cat.label, parsed);
            } else {
                // Không có đáp án → tạo slots rỗng
                List<List<String>> empty = new ArrayList<>();
                for (int s = 0; s < cat.slots; s++) empty.add(Collections.singletonList(""));
                correctAnswerMap.put(cat.label, empty);
            }
        }

        String correctAnswerJson = buildWritingAnswerJson(correctAnswerMap);

        GeneralRevisionQuestion doc = new GeneralRevisionQuestion();
        doc.setQuestionType("WRITING");
        doc.setOrderIndex(order);
        doc.setImageUrl((imageUrl == null || imageUrl.isBlank()) ? null : imageUrl);
        doc.setCategories(categories);
        mongoQuestionRepository.save(doc);

        questionIndexRepository.save(buildIndex(doc.getId(), topicId, taskId, "WRITING", correctAnswerJson));
    }

    /**
     * Parse đáp án WRITING từ chuỗi raw.
     * Hỗ trợ:
     *   - JSON mảng:        [["apple","apples"],["banana"]]
     *   - Pipe-separated:   apple|apples;;banana  (;; phân tách slot, | phân tách variant)
     *   - Chuỗi đơn giản:   apple  → [[apple]]
     */
    @SuppressWarnings("unchecked")
    private List<List<String>> parseWritingAnswer(String raw, int slots) {
        if (raw == null || raw.isBlank()) {
            List<List<String>> empty = new ArrayList<>();
            for (int i = 0; i < slots; i++) empty.add(Collections.singletonList(""));
            return empty;
        }

        String trimmed = raw.trim();

        // 1. Try JSON array
        if (trimmed.startsWith("[")) {
            try {
                // Manual simple JSON parse để không cần Jackson dependency
                // Chấp nhận: [["a","b"],["c"]]
                List<List<String>> result = new ArrayList<>();
                // Remove outer brackets
                String inner = trimmed.substring(1, trimmed.length() - 1).trim();
                if (inner.isEmpty()) return result;

                // Split into sub-arrays
                List<String> subArrays = splitJsonArrays(inner);
                for (String sub : subArrays) {
                    String s = sub.trim();
                    if (s.startsWith("[") && s.endsWith("]")) {
                        s = s.substring(1, s.length() - 1);
                        List<String> variants = new ArrayList<>();
                        for (String v : s.split(",")) {
                            String val = v.trim().replaceAll("^\"|\"$", "").trim();
                            if (!val.isEmpty()) variants.add(val);
                        }
                        result.add(variants.isEmpty() ? Collections.singletonList("") : variants);
                    } else {
                        // Bare string in array
                        String val = s.replaceAll("^\"|\"$", "").trim();
                        result.add(Collections.singletonList(val));
                    }
                }
                // Pad or truncate to slots
                while (result.size() < slots) result.add(Collections.singletonList(""));
                return result;
            } catch (Exception ignored) {
                // fallthrough
            }
        }

        // 2. Pipe/double-semicolon format: "apple|apples;;banana"
        if (trimmed.contains(";;") || trimmed.contains("|")) {
            List<List<String>> result = new ArrayList<>();
            String[] slotParts = trimmed.split(";;");
            for (String slotPart : slotParts) {
                List<String> variants = new ArrayList<>();
                for (String v : slotPart.split("\\|")) {
                    String val = v.trim();
                    if (!val.isEmpty()) variants.add(val);
                }
                result.add(variants.isEmpty() ? Collections.singletonList("") : variants);
            }
            while (result.size() < slots) result.add(Collections.singletonList(""));
            return result;
        }

        // 3. Comma-separated single slot: "apple, apples" → [[apple, apples]]
        if (trimmed.contains(",")) {
            List<String> variants = new ArrayList<>();
            for (String v : trimmed.split(",")) {
                String val = v.trim();
                if (!val.isEmpty()) variants.add(val);
            }
            List<List<String>> result = new ArrayList<>();
            result.add(variants);
            while (result.size() < slots) result.add(Collections.singletonList(""));
            return result;
        }

        // 4. Plain single value
        List<List<String>> result = new ArrayList<>();
        result.add(Collections.singletonList(trimmed));
        while (result.size() < slots) result.add(Collections.singletonList(""));
        return result;
    }

    /** Tách "[[a,b],[c]]" thành ["[a,b]", "[c]"] — xử lý nested brackets */
    private List<String> splitJsonArrays(String inner) {
        List<String> parts = new ArrayList<>();
        int depth = 0, start = 0;
        for (int i = 0; i < inner.length(); i++) {
            char c = inner.charAt(i);
            if (c == '[') { if (depth == 0) start = i; depth++; }
            else if (c == ']') {
                depth--;
                if (depth == 0) parts.add(inner.substring(start, i + 1));
            }
        }
        // Fallback: no nested arrays → treat as flat
        if (parts.isEmpty() && !inner.isBlank()) {
            for (String p : inner.split(",")) {
                parts.add(p.trim());
            }
        }
        return parts;
    }

    /** Serialise correctAnswer map → JSON string */
    private String buildWritingAnswerJson(Map<String, List<List<String>>> map) {
        if (map.isEmpty()) return null;
        StringBuilder sb = new StringBuilder("{");
        boolean firstCat = true;
        for (Map.Entry<String, List<List<String>>> entry : map.entrySet()) {
            if (!firstCat) sb.append(",");
            firstCat = false;
            sb.append("\"").append(escapeJson(entry.getKey())).append("\":[");
            boolean firstSlot = true;
            for (List<String> variants : entry.getValue()) {
                if (!firstSlot) sb.append(",");
                firstSlot = false;
                sb.append("[");
                boolean firstV = true;
                for (String v : variants) {
                    if (!firstV) sb.append(",");
                    firstV = false;
                    sb.append("\"").append(escapeJson(v)).append("\"");
                }
                sb.append("]");
            }
            sb.append("]");
        }
        sb.append("}");
        return sb.toString();
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  HELPERS
    // ══════════════════════════════════════════════════════════════════════════

    private int calcStartOrder(Integer topicId, Integer taskId) {
        return questionIndexRepository
                .findByTopicIdAndTaskIdOrderById(topicId, taskId)
                .stream()
                .mapToInt(idx -> {
                    GeneralRevisionQuestion q =
                            mongoQuestionRepository.findById(idx.getMongoQuestionId()).orElse(null);
                    return (q != null && q.getOrderIndex() != null) ? q.getOrderIndex() : 0;
                })
                .max()
                .orElse(0);
    }

    private GeneralRevisionQuestionIndex buildIndex(String mongoId, Integer topicId, Integer taskId,
                                                     String questionType, String correctAnswer) {
        GeneralRevisionQuestionIndex idx = new GeneralRevisionQuestionIndex();
        idx.setMongoQuestionId(mongoId);
        idx.setTopicId(topicId);
        idx.setTaskId(taskId);
        idx.setQuestionType(questionType);
        idx.setCorrectAnswer(correctAnswer);
        return idx;
    }

    /**
     * Đọc cell thành String, trim.
     * Dùng DataFormatter để xử lý mọi loại cell kể cả BLANK.
     */
    private String cellStr(Row row, int col) {
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                double val = cell.getNumericCellValue();
                yield (val == Math.floor(val) && !Double.isInfinite(val))
                        ? String.valueOf((long) val)
                        : String.valueOf(val);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case BLANK   -> "";
            case FORMULA -> {
                try {
                    String sv = cell.getStringCellValue().trim();
                    yield sv.isBlank() ? String.valueOf(cell.getNumericCellValue()) : sv;
                } catch (Exception ignored) {
                    try { yield String.valueOf(cell.getNumericCellValue()); }
                    catch (Exception e2) { yield new org.apache.poi.ss.usermodel.DataFormatter().formatCellValue(cell).trim(); }
                }
            }
            default -> new org.apache.poi.ss.usermodel.DataFormatter().formatCellValue(cell).trim();
        };
    }

    /** Đọc cell thành double. */
    private double cellNum(Row row, int col) {
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return 0;
        return switch (cell.getCellType()) {
            case NUMERIC -> cell.getNumericCellValue();
            case STRING  -> {
                try { yield Double.parseDouble(cell.getStringCellValue().trim()); }
                catch (NumberFormatException e) { yield 0; }
            }
            case FORMULA -> {
                try { yield cell.getNumericCellValue(); }
                catch (Exception e) { yield 0; }
            }
            default -> 0;
        };
    }

    /** Kiểm tra row có trống không (xét checkCols cột đầu). */
    private boolean isRowEmpty(Row row, int checkCols) {
        if (row == null) return true;
        for (int c = 0; c < checkCols; c++) {
            if (!cellStr(row, c).isBlank()) return false;
        }
        return true;
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    // ── Internal DTO ─────────────────────────────────────────────────────────
    private record WritingCatRow(String label, int slots, String answerRaw) {}
}
