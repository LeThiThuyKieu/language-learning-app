package com.languagelearning.util;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.FileOutputStream;
import java.io.IOException;

/**
 * Utility: chạy main() để tạo file Excel template cho từng question type.
 * Output: src/main/resources/templates/ (copy thủ công sang frontend/public/general_revision/)
 *
 * Run once: mvn exec:java -Dexec.mainClass="com.languagelearning.util.ExcelTemplateGenerator"
 */
public class ExcelTemplateGenerator {

    public static void main(String[] args) throws IOException {
        generateWritingTemplate("WRITING_template.xlsx");
        generateVocabImageTemplate("VOCAB_IMAGE_template.xlsx");
        generateListeningTemplate("LISTENING_template.xlsx");
        generateMatchingTemplate("MATCHING_template.xlsx");
        System.out.println("Templates generated successfully.");
    }

    // ── WRITING (2 sheets) ──────────────────────────────────────────────────
    public static void generateWritingTemplate(String filename) throws IOException {
        try (Workbook wb = new XSSFWorkbook()) {
            CellStyle headerStyle = boldStyle(wb);
            CellStyle descStyle  = italicGrayStyle(wb);

            // ── Sheet 1: WRITING_1 (category-based) ──
            Sheet s1 = wb.createSheet("WRITING_1");
            // Row 0: headers
            Row h1 = s1.createRow(0);
            String[] hdrs1 = {"image_url", "category_label", "category_slots", "correct_answer"};
            for (int i = 0; i < hdrs1.length; i++) createCell(h1, i, hdrs1[i], headerStyle);

            // Row 1: description
            Row d1 = s1.createRow(1);
            String[] desc1 = {
                "URL ảnh tham khảo (tuỳ chọn, chỉ điền ở dòng đầu của mỗi câu hỏi)",
                "Tên category (vd: Kitchen, Bedroom)",
                "Số ô cần điền (số nguyên, vd: 4)",
                "Đáp án dạng JSON [[\"word1\"],[\"word2\",\"alt\"]] hoặc để trống"
            };
            for (int i = 0; i < desc1.length; i++) createCell(d1, i, desc1[i], descStyle);

            // Row 2-5: example data (1 câu hỏi, 2 categories)
            Row e1 = s1.createRow(2);
            createCell(e1, 0, "https://example.com/kitchen.jpg", null);
            createCell(e1, 1, "Kitchen",  null);
            createCell(e1, 2, "4",        null);
            createCell(e1, 3, "[[\"kettle\"],[\"pan\"],[\"toaster\"],[\"microwave\"]]", null);

            Row e2 = s1.createRow(3);
            createCell(e2, 0, "",         null);   // blank = same question
            createCell(e2, 1, "Bedroom",  null);
            createCell(e2, 2, "3",        null);
            createCell(e2, 3, "[[\"pillow\"],[\"blanket\"],[\"lamp\"]]", null);

            // blank row between questions
            s1.createRow(4);

            Row e3 = s1.createRow(5);
            createCell(e3, 0, "",           null);
            createCell(e3, 1, "Livingroom", null);
            createCell(e3, 2, "4",          null);
            createCell(e3, 3, "[[\"sofa\"],[\"TV\"],[\"carpet\"],[\"cushion\"]]", null);

            autoSize(s1, 4);

            // ── Sheet 2: WRITING_2 (simple question_text) ──
            Sheet s2 = wb.createSheet("WRITING_2");
            Row h2 = s2.createRow(0);
            String[] hdrs2 = {"question_text", "correct_answer"};
            for (int i = 0; i < hdrs2.length; i++) createCell(h2, i, hdrs2[i], headerStyle);

            Row d2 = s2.createRow(1);
            String[] desc2 = {
                "Nội dung câu hỏi / định nghĩa (bắt buộc)",
                "Đáp án đúng (bắt buộc)"
            };
            for (int i = 0; i < desc2.length; i++) createCell(d2, i, desc2[i], descStyle);

            // Example rows
            Row ex1 = s2.createRow(2);
            createCell(ex1, 0, "A device used to cook food", null);
            createCell(ex1, 1, "microwave",                  null);

            Row ex2 = s2.createRow(3);
            createCell(ex2, 0, "The soft material covering a bed", null);
            createCell(ex2, 1, "blanket",                          null);

            autoSize(s2, 2);

            try (FileOutputStream fos = new FileOutputStream(filename)) {
                wb.write(fos);
            }
        }
    }

    // ── VOCAB_IMAGE ──────────────────────────────────────────────────────────
    public static void generateVocabImageTemplate(String filename) throws IOException {
        try (Workbook wb = new XSSFWorkbook()) {
            CellStyle headerStyle = boldStyle(wb);
            CellStyle descStyle   = italicGrayStyle(wb);
            Sheet sheet = wb.createSheet("VOCAB_IMAGE");

            Row h = sheet.createRow(0);
            createCell(h, 0, "image_url",     headerStyle);
            createCell(h, 1, "correct_answer", headerStyle);

            Row d = sheet.createRow(1);
            createCell(d, 0, "URL ảnh từ vựng (bắt buộc)",  descStyle);
            createCell(d, 1, "Đáp án đúng — từ/cụm từ (bắt buộc)", descStyle);

            Row e1 = sheet.createRow(2);
            createCell(e1, 0, "https://example.com/apple.jpg", null);
            createCell(e1, 1, "apple", null);

            Row e2 = sheet.createRow(3);
            createCell(e2, 0, "https://example.com/book.jpg", null);
            createCell(e2, 1, "book", null);

            autoSize(sheet, 2);
            try (FileOutputStream fos = new FileOutputStream(filename)) { wb.write(fos); }
        }
    }

    // ── LISTENING ────────────────────────────────────────────────────────────
    public static void generateListeningTemplate(String filename) throws IOException {
        try (Workbook wb = new XSSFWorkbook()) {
            CellStyle headerStyle = boldStyle(wb);
            CellStyle descStyle   = italicGrayStyle(wb);
            Sheet sheet = wb.createSheet("LISTENING");

            Row h = sheet.createRow(0);
            String[] hdrs = {"image_url", "audio_url", "sentence", "correct_answer"};
            for (int i = 0; i < hdrs.length; i++) createCell(h, i, hdrs[i], headerStyle);

            Row d = sheet.createRow(1);
            String[] descs = {
                "URL ảnh minh hoạ (tuỳ chọn)",
                "URL audio .mp3/.wav (bắt buộc)",
                "Câu fill-in-the-blank dùng ___ (tuỳ chọn, vd: She is a ___ student)",
                "Đáp án đúng (bắt buộc)"
            };
            for (int i = 0; i < descs.length; i++) createCell(d, i, descs[i], descStyle);

            Row e1 = sheet.createRow(2);
            createCell(e1, 0, "",                                   null);
            createCell(e1, 1, "https://example.com/audio1.mp3",     null);
            createCell(e1, 2, "She is a ___ student",               null);
            createCell(e1, 3, "good",                                null);

            autoSize(sheet, 4);
            try (FileOutputStream fos = new FileOutputStream(filename)) { wb.write(fos); }
        }
    }

    // ── MATCHING ─────────────────────────────────────────────────────────────
    public static void generateMatchingTemplate(String filename) throws IOException {
        try (Workbook wb = new XSSFWorkbook()) {
            CellStyle headerStyle = boldStyle(wb);
            CellStyle descStyle   = italicGrayStyle(wb);
            Sheet sheet = wb.createSheet("MATCHING");

            Row h = sheet.createRow(0);
            createCell(h, 0, "pair_index", headerStyle);
            createCell(h, 1, "left",       headerStyle);
            createCell(h, 2, "right",      headerStyle);

            Row d = sheet.createRow(1);
            createCell(d, 0, "1 = bắt đầu câu hỏi mới; 2,3,... = thêm pair vào câu hiện tại", descStyle);
            createCell(d, 1, "Vế trái (text hoặc URL ảnh)",  descStyle);
            createCell(d, 2, "Vế phải (text)", descStyle);

            // Example: 2 questions
            String[][] data = {
                {"1", "kettle",  "boil water"},
                {"2", "pan",     "fry eggs"},
                {"3", "cup",     "drink tea"},
                {"1", "book",    "read"},
                {"2", "pen",     "write"},
            };
            for (int i = 0; i < data.length; i++) {
                Row r = sheet.createRow(2 + i);
                createCell(r, 0, data[i][0], null);
                createCell(r, 1, data[i][1], null);
                createCell(r, 2, data[i][2], null);
            }

            autoSize(sheet, 3);
            try (FileOutputStream fos = new FileOutputStream(filename)) { wb.write(fos); }
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static void createCell(Row row, int col, String value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value == null ? "" : value);
        if (style != null) cell.setCellStyle(style);
    }

    private static CellStyle boldStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }

    private static CellStyle italicGrayStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setItalic(true);
        font.setColor(IndexedColors.GREY_50_PERCENT.getIndex());
        style.setFont(font);
        return style;
    }

    private static void autoSize(Sheet sheet, int cols) {
        for (int i = 0; i < cols; i++) {
            sheet.autoSizeColumn(i);
        }
    }
}
