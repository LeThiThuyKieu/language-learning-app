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
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

/**
 * Xử lý import câu hỏi revision từ file Excel (.xlsx).
 * Mỗi sheet tương ứng 1 question_type và chỉ import sheet khớp với questionType của task.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class QuestionImportService {

    private final GeneralRevisionTaskRepository taskRepository;
    private final GeneralRevisionQuestionIndexRepository questionIndexRepository;
    private final GeneralRevisionQuestionRepository mongoQuestionRepository;

    /**
     * Import questions từ file Excel vào task.
     *
     * @param topicId  topic chứa task
     * @param taskId   task cần import vào
     * @param file     file .xlsx
     * @return kết quả import (số thành công, danh sách lỗi)
     */
    @Transactional
    public ImportResultDto importQuestions(Integer topicId, Integer taskId, MultipartFile file) {
        // 1. Kiểm tra task tồn tại và thuộc topic
        GeneralRevisionTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy task: " + taskId));
        if (!task.getTopic().getId().equals(topicId)) {
            throw new IllegalArgumentException("Task không thuộc topic: " + topicId);
        }

        String questionType = task.getQuestionType(); // VOCAB_IMAGE | LISTENING | MATCHING | WRITING

        // 2. Đọc file Excel
        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            List<String> errors = new ArrayList<>();
            int imported = 0;

            // Xác định orderIndex bắt đầu (sau các câu đã có)
            int currentMaxOrder = questionIndexRepository
                    .findByTopicIdAndTaskIdOrderById(topicId, taskId)
                    .stream()
                    .mapToInt(idx -> {
                        GeneralRevisionQuestion q = mongoQuestionRepository.findById(idx.getMongoQuestionId()).orElse(null);
                        return (q != null && q.getOrderIndex() != null) ? q.getOrderIndex() : 0;
                    })
                    .max()
                    .orElse(0);

            switch (questionType) {
                case "VOCAB_IMAGE" -> {
                    Sheet sheet = workbook.getSheet("VOCAB_IMAGE");
                    if (sheet == null) {
                        errors.add("Không tìm thấy sheet 'VOCAB_IMAGE' trong file");
                    } else {
                        int[] result = importVocabImage(sheet, topicId, taskId, currentMaxOrder, errors);
                        imported = result[0];
                    }
                }
                case "LISTENING" -> {
                    Sheet sheet = workbook.getSheet("LISTENING");
                    if (sheet == null) {
                        errors.add("Không tìm thấy sheet 'LISTENING' trong file");
                    } else {
                        int[] result = importListening(sheet, topicId, taskId, currentMaxOrder, errors);
                        imported = result[0];
                    }
                }
                case "MATCHING" -> {
                    Sheet sheet = workbook.getSheet("MATCHING");
                    if (sheet == null) {
                        errors.add("Không tìm thấy sheet 'MATCHING' trong file");
                    } else {
                        int[] result = importMatching(sheet, topicId, taskId, currentMaxOrder, errors);
                        imported = result[0];
                    }
                }
                case "WRITING" -> {
                    // WRITING có 2 sheet: WRITING_1 (có category) và WRITING_2 (question_text)
                    Sheet sheet1 = workbook.getSheet("WRITING_1");
                    Sheet sheet2 = workbook.getSheet("WRITING_2");
                    int nextOrder = currentMaxOrder;
                    if (sheet1 != null) {
                        int[] result = importWriting1(sheet1, topicId, taskId, nextOrder, errors);
                        imported += result[0];
                        nextOrder += result[0];
                    }
                    if (sheet2 != null) {
                        int[] result = importWriting2(sheet2, topicId, taskId, nextOrder, errors);
                        imported += result[0];
                    }
                    if (sheet1 == null && sheet2 == null) {
                        errors.add("Không tìm thấy sheet 'WRITING_1' hoặc 'WRITING_2' trong file");
                    }
                }
                default -> errors.add("Loại câu hỏi không được hỗ trợ: " + questionType);
            }

            return ImportResultDto.builder()
                    .imported(imported)
                    .errors(errors)
                    .build();

        } catch (IOException e) {
            log.error("Lỗi khi đọc file Excel", e);
            throw new IllegalArgumentException("Không thể đọc file Excel: " + e.getMessage());
        }
    }


    /**
     * Sheet VOCAB_IMAGE: header row 0, description row 1 (bỏ qua), data từ row 2.
     * Cột: image_url | correct_answer
     */
    private int[] importVocabImage(Sheet sheet, Integer topicId, Integer taskId,
                                   int startOrder, List<String> errors) {
        int imported = 0;
        int orderIdx = startOrder;

        for (int r = 2; r <= sheet.getLastRowNum(); r++) {
            Row row = sheet.getRow(r);
            if (row == null || isRowEmpty(row, 2)) continue;

            String imageUrl    = cellStr(row, 0);
            String correctAnswer = cellStr(row, 1);

            if (imageUrl.isBlank()) {
                errors.add("Dòng " + (r + 1) + ": image_url bắt buộc");
                continue;
            }
            if (correctAnswer.isBlank()) {
                errors.add("Dòng " + (r + 1) + ": correct_answer bắt buộc");
                continue;
            }

            orderIdx++;
            GeneralRevisionQuestion doc = new GeneralRevisionQuestion();
            doc.setQuestionType("VOCAB_IMAGE");
            doc.setOrderIndex(orderIdx);
            doc.setImageUrl(imageUrl);
            mongoQuestionRepository.save(doc);

            GeneralRevisionQuestionIndex idx = buildIndex(doc.getId(), topicId, taskId, "VOCAB_IMAGE", correctAnswer);
            questionIndexRepository.save(idx);
            imported++;
        }
        return new int[]{ imported };
    }

    /**
     * Sheet LISTENING: header row 0, description row 1 (bỏ qua), data từ row 2.
     * Cột: image_url | audio_url | sentence | correct_answer
     */
    private int[] importListening(Sheet sheet, Integer topicId, Integer taskId,
                                  int startOrder, List<String> errors) {
        int imported = 0;
        int orderIdx = startOrder;

        for (int r = 2; r <= sheet.getLastRowNum(); r++) {
            Row row = sheet.getRow(r);
            if (row == null || isRowEmpty(row, 4)) continue;

            String imageUrl      = cellStr(row, 0);
            String audioUrl      = cellStr(row, 1);
            String sentence      = cellStr(row, 2);
            String correctAnswer = cellStr(row, 3);

            if (audioUrl.isBlank()) {
                errors.add("Dòng " + (r + 1) + ": audio_url bắt buộc");
                continue;
            }
            if (correctAnswer.isBlank()) {
                errors.add("Dòng " + (r + 1) + ": correct_answer bắt buộc");
                continue;
            }

            orderIdx++;
            GeneralRevisionQuestion doc = new GeneralRevisionQuestion();
            doc.setQuestionType("LISTENING");
            doc.setOrderIndex(orderIdx);
            doc.setImageUrl(imageUrl.isBlank() ? null : imageUrl);
            doc.setSentence(sentence.isBlank() ? null : sentence);

            GeneralRevisionQuestion.Metadata meta = new GeneralRevisionQuestion.Metadata();
            meta.setAudioUrl(audioUrl);
            doc.setMetadata(meta);

            mongoQuestionRepository.save(doc);

            GeneralRevisionQuestionIndex idx = buildIndex(doc.getId(), topicId, taskId, "LISTENING", correctAnswer);
            questionIndexRepository.save(idx);
            imported++;
        }
        return new int[]{ imported };
    }

    /**
     * Sheet MATCHING: header row 0, description row 1 (bỏ qua), data từ row 2.
     * Cột: pair_index | left | right
     * Nhiều dòng liên tiếp tạo thành 1 câu hỏi MATCHING.
     * Câu hỏi mới bắt đầu khi pair_index == 1 và currentPairs không rỗng.
     */
    private int[] importMatching(Sheet sheet, Integer topicId, Integer taskId,
                                 int startOrder, List<String> errors) {
        int imported = 0;
        int orderIdx = startOrder;

        List<Map<String, String>> currentPairs = new ArrayList<>();

        // Collect all data rows first
        List<Row> dataRows = new ArrayList<>();
        for (int r = 2; r <= sheet.getLastRowNum(); r++) {
            Row row = sheet.getRow(r);
            if (row != null && !isRowEmpty(row, 3)) {
                dataRows.add(row);
            }
        }

        for (int i = 0; i < dataRows.size(); i++) {
            Row row = dataRows.get(i);
            int pairIndex = (int) cellNum(row, 0);
            String left   = cellStr(row, 1);
            String right  = cellStr(row, 2);

            // pair_index == 1 AND we already have pairs → flush previous question
            if (pairIndex == 1 && !currentPairs.isEmpty()) {
                orderIdx++;
                GeneralRevisionQuestion doc = new GeneralRevisionQuestion();
                doc.setQuestionType("MATCHING");
                doc.setOrderIndex(orderIdx);
                doc.setPairs(new ArrayList<>(currentPairs));
                mongoQuestionRepository.save(doc);
                questionIndexRepository.save(buildIndex(doc.getId(), topicId, taskId, "MATCHING", null));
                imported++;
                currentPairs.clear();
            }

            if (left.isBlank()) {
                errors.add("Dòng " + (sheet.getRow(2 + i) != null ? (2 + i + 1) : "?") + " MATCHING: left bắt buộc");
                continue;
            }
            if (right.isBlank()) {
                errors.add("Dòng " + (2 + i + 1) + " MATCHING: right bắt buộc");
                continue;
            }

            Map<String, String> pair = new LinkedHashMap<>();
            pair.put("left", left);
            pair.put("right", right);
            currentPairs.add(pair);
        }

        // Flush last question
        if (!currentPairs.isEmpty()) {
            orderIdx++;
            GeneralRevisionQuestion doc = new GeneralRevisionQuestion();
            doc.setQuestionType("MATCHING");
            doc.setOrderIndex(orderIdx);
            doc.setPairs(new ArrayList<>(currentPairs));
            mongoQuestionRepository.save(doc);
            questionIndexRepository.save(buildIndex(doc.getId(), topicId, taskId, "MATCHING", null));
            imported++;
        }

        return new int[]{ imported };
    }

    /**
     * Sheet WRITING_1: header row 0, description row 1 (bỏ qua), data từ row 2.
     * Cột: image_url | category_label | category_slots | correct_answer
     * Dòng đầu của mỗi câu hỏi có image_url. Các dòng tiếp theo của cùng câu hỏi để trống image_url.
     */
    private int[] importWriting1(Sheet sheet, Integer topicId, Integer taskId,
                                 int startOrder, List<String> errors) {
        int imported = 0;
        int orderIdx = startOrder;

        String currentImageUrl = null;
        List<Map<String, Object>> currentCats = new ArrayList<>();

        for (int r = 2; r <= sheet.getLastRowNum() + 1; r++) {
            Row row = (r <= sheet.getLastRowNum()) ? sheet.getRow(r) : null;
            boolean isEnd = (row == null || isRowEmpty(row, 4));

            if (!isEnd) {
                String imageUrl      = cellStr(row, 0);
                String catLabel      = cellStr(row, 1);
                String slotsStr      = cellStr(row, 2);
                String correctAnswer = cellStr(row, 3);

                boolean isNewQuestion = !imageUrl.isBlank();

                // New question starts → flush previous
                if (isNewQuestion && !currentCats.isEmpty()) {
                    orderIdx++;
                    saveWriting1Question(topicId, taskId, orderIdx, currentImageUrl, currentCats);
                    imported++;
                    currentCats = new ArrayList<>();
                    currentImageUrl = null;
                }

                if (isNewQuestion) currentImageUrl = imageUrl;
                if (catLabel.isBlank()) continue;

                int slots = 4;
                try { slots = (int) Double.parseDouble(slotsStr); } catch (Exception ignored) {}

                Map<String, Object> cat = new LinkedHashMap<>();
                cat.put("label", catLabel);
                cat.put("slots", slots);
                if (!correctAnswer.isBlank()) cat.put("correctAnswer", correctAnswer);
                currentCats.add(cat);
            } else {
                // Flush on empty row or end of sheet
                if (!currentCats.isEmpty()) {
                    orderIdx++;
                    saveWriting1Question(topicId, taskId, orderIdx, currentImageUrl, currentCats);
                    imported++;
                    currentCats = new ArrayList<>();
                    currentImageUrl = null;
                }
            }
        }

        return new int[]{ imported };
    }

    private void saveWriting1Question(Integer topicId, Integer taskId, int orderIdx,
                                      String imageUrl,
                                      List<Map<String, Object>> cats) {
        // Build categories và correctAnswer JSON
        List<Map<String, Object>> categories = new ArrayList<>();
        Map<String, Object> correctAnswerMap = new LinkedHashMap<>();

        for (Map<String, Object> cat : cats) {
            String label = (String) cat.get("label");
            int slots    = cat.get("slots") instanceof Integer ? (Integer) cat.get("slots") : 4;
            Map<String, Object> catEntry = new LinkedHashMap<>();
            catEntry.put("label", label);
            catEntry.put("slots", slots);
            categories.add(catEntry);

            String rawAnswer = (String) cat.getOrDefault("correctAnswer", "");
            if (!rawAnswer.isBlank()) {
                correctAnswerMap.put(label, rawAnswer);
            }
        }

        // Build correctAnswer JSON: { "Kitchen": [[...],[...]], ... }
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> e : correctAnswerMap.entrySet()) {
            if (!first) sb.append(",");
            first = false;
            sb.append("\"").append(escapeJson(e.getKey())).append("\":").append(e.getValue());
        }
        sb.append("}");

        GeneralRevisionQuestion doc = new GeneralRevisionQuestion();
        doc.setQuestionType("WRITING");
        doc.setOrderIndex(orderIdx);
        doc.setImageUrl((imageUrl == null || imageUrl.isBlank()) ? null : imageUrl);
        doc.setCategories(categories);
        mongoQuestionRepository.save(doc);

        GeneralRevisionQuestionIndex idx = buildIndex(doc.getId(), topicId, taskId, "WRITING",
                first ? null : sb.toString());
        questionIndexRepository.save(idx);
    }

    /**
     * Sheet WRITING_2: header row 0, description row 1 (bỏ qua), data từ row 2.
     * Cột: question_text | correct_answer
     * Mỗi dòng = 1 câu hỏi độc lập.
     */
    private int[] importWriting2(Sheet sheet, Integer topicId, Integer taskId,
                                 int startOrder, List<String> errors) {
        int imported = 0;
        int orderIdx = startOrder;

        for (int r = 2; r <= sheet.getLastRowNum(); r++) {
            Row row = sheet.getRow(r);
            if (row == null || isRowEmpty(row, 2)) continue;

            String questionText  = cellStr(row, 0);
            String correctAnswer = cellStr(row, 1);

            if (questionText.isBlank()) {
                errors.add("Dòng " + (r + 1) + " WRITING_2: question_text bắt buộc");
                continue;
            }
            if (correctAnswer.isBlank()) {
                errors.add("Dòng " + (r + 1) + " WRITING_2: correct_answer bắt buộc");
                continue;
            }

            orderIdx++;
            GeneralRevisionQuestion doc = new GeneralRevisionQuestion();
            doc.setQuestionType("WRITING");
            doc.setOrderIndex(orderIdx);
            doc.setQuestionText(questionText);
            mongoQuestionRepository.save(doc);

            GeneralRevisionQuestionIndex idx = buildIndex(doc.getId(), topicId, taskId, "WRITING", correctAnswer);
            questionIndexRepository.save(idx);
            imported++;
        }
        return new int[]{ imported };
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

    /** Đọc cell thành String, trim. */
    private String cellStr(Row row, int col) {
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                double val = cell.getNumericCellValue();
                yield (val == Math.floor(val)) ? String.valueOf((long) val) : String.valueOf(val);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> {
                try { yield cell.getStringCellValue().trim(); }
                catch (Exception e) { yield String.valueOf(cell.getNumericCellValue()); }
            }
            default -> "";
        };
    }

    /** Đọc cell thành double. */
    private double cellNum(Row row, int col) {
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return 0;
        return switch (cell.getCellType()) {
            case NUMERIC -> cell.getNumericCellValue();
            case STRING  -> { try { yield Double.parseDouble(cell.getStringCellValue().trim()); } catch (Exception e) { yield 0; } }
            default -> 0;
        };
    }

    /** Kiểm tra row có trống không (kiểm tra n cột đầu). */
    private boolean isRowEmpty(Row row, int checkCols) {
        if (row == null) return true;
        for (int c = 0; c < checkCols; c++) {
            if (!cellStr(row, c).isBlank()) return false;
        }
        return true;
    }

    private String escapeJson(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
