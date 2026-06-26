-- ============================================================
-- EXAM MODULE — SQL MIGRATION
-- Database: language_learning_app
-- Mục đích: Lưu metadata bài thi, câu hỏi index, và bài làm
--           của user để xem lại sau khi nộp bài.
--
-- Nguyên tắc thiết kế:
--   • MySQL  → metadata (test, part, question mapping, bài làm user)
--   • MongoDB → nội dung câu hỏi (text, options, audio, image…)
--   • Không chấm điểm, không Pass/Fail
--   • MULTIPLE_CHOICE / FILL_IN có correct_answer để show lại
--   • MATCHING  → correct_answer dạng JSON {"21":"E","22":"A",...}
--   • FILL_IN (form)  → correct_answer dạng JSON {"6":"July","7":"18",...}
--   • SHORT_WRITE / SPEAKING → correct_answer NULL (đánh giá bằng LLM sau)
-- ============================================================

USE `language_learning_app`;

-- ------------------------------------------------------------
-- 1. EXAM_TEST — đề thi (A2 Test 1, B1 Test 2…)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `exam_test` (
    `id`          INT          NOT NULL AUTO_INCREMENT,
    `cefr_level`  ENUM('A2','B1','B2','C1','C2') NOT NULL,
    `test_number` TINYINT      NOT NULL COMMENT 'Số thứ tự bài thi trong cấp: 1, 2, 3…',
    `title`       VARCHAR(100) NOT NULL COMMENT 'Vd: A2 Test 1',
    `description` VARCHAR(255) DEFAULT NULL,
    `is_active`   TINYINT(1)   NOT NULL DEFAULT 1,
    `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_exam_test_level_num` (`cefr_level`, `test_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Đề thi theo cấp độ CEFR';

-- ------------------------------------------------------------
-- 2. EXAM_PAPER — bài thi trong mỗi đề (Listening / R&W / Speaking)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `exam_paper` (
    `id`               INT          NOT NULL AUTO_INCREMENT,
    `exam_test_id`     INT          NOT NULL,
    `paper_type`       ENUM('LISTENING','READING_WRITING','SPEAKING') NOT NULL,
    `duration_minutes` SMALLINT     NOT NULL,
    -- audio_url chỉ dùng cho LISTENING: 1 file duy nhất chạy xuyên suốt toàn paper,
    -- user không được pause/rewind. R&W và Speaking để NULL.
    `audio_url`        VARCHAR(500) DEFAULT NULL COMMENT 'Listening only: 1 file audio chạy liên tục toàn paper',
    `order_index`      TINYINT      NOT NULL DEFAULT 0 COMMENT 'Thứ tự làm: 1=Listening, 2=R&W, 3=Speaking',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_paper_test_type` (`exam_test_id`, `paper_type`),
    CONSTRAINT `fk_paper_test` FOREIGN KEY (`exam_test_id`) REFERENCES `exam_test` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='3 bài thi (paper) trong mỗi đề thi';

-- ------------------------------------------------------------
-- 3. EXAM_PART — phần trong mỗi paper (Part 1, Part 2…)
-- instruction KHÔNG lưu ở đây — lưu trong từng question document
-- ở MongoDB để linh hoạt (mỗi nhóm câu hỏi có instruction riêng)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `exam_part` (
    `id`           INT     NOT NULL AUTO_INCREMENT,
    `paper_id`     INT     NOT NULL,
    `part_number`  TINYINT NOT NULL,
    `order_index`  TINYINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_part_paper_num` (`paper_id`, `part_number`),
    CONSTRAINT `fk_part_paper` FOREIGN KEY (`paper_id`) REFERENCES `exam_paper` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Part trong mỗi paper (Part 1…5 cho Listening, Part 1…7 cho R&W…)';

-- ------------------------------------------------------------
-- 4. EXAM_QUESTION — mapping SQL ↔ MongoDB + correct_answer để show lại
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `exam_question` (
    `id`               BIGINT       NOT NULL AUTO_INCREMENT,
    `part_id`          INT          NOT NULL,
    `mongo_doc_id`     VARCHAR(50)  NOT NULL COMMENT 'ObjectId trong MongoDB collection exam_questions',
    `question_type`    ENUM(
        'MULTIPLE_CHOICE',  -- Listening & R&W: chọn A/B/C
        'FILL_IN_FORM',     -- Listening: cả form điền (1 doc = nhiều blanks)
        'MATCHING',         -- Listening: nhóm ghép đôi (1 doc = nhiều cặp)
        'FILL_IN_TEXT',     -- R&W: điền 1 từ vào đoạn văn
        'SHORT_WRITE',      -- R&W: viết ngắn (email, story…)
        'SPEAKING_TASK'     -- Speaking: nói theo prompt
    ) NOT NULL,
    -- Số câu hỏi hiển thị (vd: "5" hoặc "6-10" cho form, "21-25" cho matching)
    `question_number_start` SMALLINT NOT NULL COMMENT 'Số câu bắt đầu (hiển thị trên UI)',
    `question_number_end`   SMALLINT NOT NULL COMMENT 'Số câu kết thúc (= start nếu 1 câu)',
    -- Đáp án đúng để show lại sau khi nộp bài
    -- • MULTIPLE_CHOICE  → "B"
    -- • FILL_IN_FORM     → JSON: {"6":"July","7":"18 / eighteen","8":"swim","9":"350","10":"CV"}
    -- • MATCHING         → JSON: {"21":"E","22":"A","23":"G","24":"B","25":"F"}
    -- • FILL_IN_TEXT     → "playing"
    -- • SHORT_WRITE      → NULL (LLM đánh giá sau)
    -- • SPEAKING_TASK    → NULL
    `correct_answer`        TEXT     DEFAULT NULL,
    `order_index`           SMALLINT NOT NULL DEFAULT 0,
    `created_at`            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_exam_question_mongo` (`mongo_doc_id`),
    KEY `idx_eq_part` (`part_id`),
    CONSTRAINT `fk_eq_part` FOREIGN KEY (`part_id`) REFERENCES `exam_part` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Mapping câu hỏi SQL ↔ MongoDB; lưu correct_answer để show lại bài làm';

-- ------------------------------------------------------------
-- 5. USER_EXAM_ATTEMPT — lần làm bài của user
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_exam_attempt` (
    `id`           BIGINT   NOT NULL AUTO_INCREMENT,
    `user_id`      INT      NOT NULL,
    `exam_test_id` INT      NOT NULL,
    `started_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `submitted_at` DATETIME DEFAULT NULL COMMENT 'NULL nếu chưa nộp hết 3 paper',
    -- Trạng thái: user làm tuần tự Listening → R&W → Speaking
    `status`       ENUM(
        'LISTENING_IN_PROGRESS',
        'LISTENING_DONE',
        'READING_WRITING_IN_PROGRESS',
        'READING_WRITING_DONE',
        'SPEAKING_IN_PROGRESS',
        'COMPLETED'             -- đã nộp hết 3 paper, có thể xem lại
    ) NOT NULL DEFAULT 'LISTENING_IN_PROGRESS',
    PRIMARY KEY (`id`),
    KEY `idx_uea_user` (`user_id`),
    KEY `idx_uea_test` (`exam_test_id`),
    CONSTRAINT `fk_uea_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_uea_test` FOREIGN KEY (`exam_test_id`) REFERENCES `exam_test` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Lần làm bài của user; 1 lần = 3 paper liên tiếp';

-- ------------------------------------------------------------
-- 6. USER_EXAM_ANSWER — câu trả lời của user cho từng question
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_exam_answer` (
    `id`              BIGINT       NOT NULL AUTO_INCREMENT,
    `attempt_id`      BIGINT       NOT NULL,
    `exam_question_id` BIGINT      NOT NULL,
    -- Câu trả lời user:
    -- • MULTIPLE_CHOICE  → "B"
    -- • FILL_IN_FORM     → JSON: {"6":"July","7":"20","8":"dance","9":"200","10":"resume"}
    -- • MATCHING         → JSON: {"21":"E","22":"A","23":"G","24":"B","25":"F"}
    -- • FILL_IN_TEXT     → "playing"
    -- • SHORT_WRITE      → full text user viết
    -- • SPEAKING_TASK    → URL recording (sau tích hợp) hoặc NULL
    `user_answer`     TEXT         DEFAULT NULL,
    -- is_correct:
    -- • MULTIPLE_CHOICE / FILL_IN_TEXT → TRUE/FALSE tự động
    -- • FILL_IN_FORM / MATCHING        → NULL (so sánh từng key trong JSON, tính ở app layer)
    -- • SHORT_WRITE / SPEAKING_TASK    → NULL (LLM sau)
    `is_correct`      TINYINT(1)   DEFAULT NULL,
    `answered_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_uea_attempt_question` (`attempt_id`, `exam_question_id`),
    KEY `idx_uea_attempt` (`attempt_id`),
    KEY `idx_uea_question` (`exam_question_id`),
    CONSTRAINT `fk_uea_attempt` FOREIGN KEY (`attempt_id`) REFERENCES `user_exam_attempt` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_uea_exam_question` FOREIGN KEY (`exam_question_id`) REFERENCES `exam_question` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Câu trả lời user; dùng để show lại bài làm sau khi nộp hết 3 paper';

-- ============================================================
-- SEED DATA — A2 Test 1 (metadata)
-- ============================================================

-- ============================================================
-- Đề thi theo cấp độ:
--   A2 → 1 test       (id = 1)
--   B1 → 1 test       (id = 2)
--   B2 → 2 tests      (id = 3, 4)
--   C1 → 2 tests      (id = 5, 6)
--   C2 → 1 test       (id = 7)
-- ============================================================
INSERT INTO `exam_test` (`cefr_level`, `test_number`, `title`, `description`)
VALUES
    ('A2', 1, 'A2 Test 1', 'Bài thi thực hành A2 số 1 — Cambridge Key (KET)'),
    ('B1', 1, 'B1 Test 1', 'Bài thi thực hành B1 số 1 — Cambridge Preliminary (PET)'),
    ('B2', 1, 'B2 Test 1', 'Bài thi thực hành B2 số 1 — Cambridge First (FCE)'),
    ('B2', 2, 'B2 Test 2', 'Bài thi thực hành B2 số 2 — Cambridge First (FCE)'),
    ('C1', 1, 'C1 Test 1', 'Bài thi thực hành C1 số 1 — Cambridge Advanced (CAE)'),
    ('C1', 2, 'C1 Test 2', 'Bài thi thực hành C1 số 2 — Cambridge Advanced (CAE)'),
    ('C2', 1, 'C2 Test 1', 'Bài thi thực hành C2 số 1 — Cambridge Proficiency (CPE)');

-- ============================================================
-- Paper thời lượng theo cấp độ:
--   A2  : Listening 30p, R&W 60p,   Speaking 10p
--   B1  : Listening 36p, R&W 90p,   Speaking 12p
--   B2  : Listening 40p, R&W 90p,   Speaking 15p
--   C1  : Listening 40p, R&W 90p,   Speaking 15p
--   C2  : Listening 40p, R&W 90p,   Speaking 16p
-- ============================================================

-- A2 Test 1 (exam_test_id = 1)
INSERT INTO `exam_paper` (`exam_test_id`, `paper_type`, `duration_minutes`, `order_index`)
VALUES
    (1, 'LISTENING',       30, 1),
    (1, 'READING_WRITING', 60, 2),
    (1, 'SPEAKING',        10, 3);

-- B1 Test 1 (exam_test_id = 2)
INSERT INTO `exam_paper` (`exam_test_id`, `paper_type`, `duration_minutes`, `order_index`)
VALUES
    (2, 'LISTENING',       36, 1),
    (2, 'READING_WRITING', 90, 2),
    (2, 'SPEAKING',        12, 3);

-- B2 Test 1 (exam_test_id = 3)
INSERT INTO `exam_paper` (`exam_test_id`, `paper_type`, `duration_minutes`, `order_index`)
VALUES
    (3, 'LISTENING',       40, 1),
    (3, 'READING_WRITING', 90, 2),
    (3, 'SPEAKING',        15, 3);

-- B2 Test 2 (exam_test_id = 4)
INSERT INTO `exam_paper` (`exam_test_id`, `paper_type`, `duration_minutes`, `order_index`)
VALUES
    (4, 'LISTENING',       40, 1),
    (4, 'READING_WRITING', 90, 2),
    (4, 'SPEAKING',        15, 3);

-- C1 Test 1 (exam_test_id = 5)
INSERT INTO `exam_paper` (`exam_test_id`, `paper_type`, `duration_minutes`, `order_index`)
VALUES
    (5, 'LISTENING',       40, 1),
    (5, 'READING_WRITING', 90, 2),
    (5, 'SPEAKING',        15, 3);

-- C1 Test 2 (exam_test_id = 6)
INSERT INTO `exam_paper` (`exam_test_id`, `paper_type`, `duration_minutes`, `order_index`)
VALUES
    (6, 'LISTENING',       40, 1),
    (6, 'READING_WRITING', 90, 2),
    (6, 'SPEAKING',        15, 3);

-- C2 Test 1 (exam_test_id = 7)
INSERT INTO `exam_paper` (`exam_test_id`, `paper_type`, `duration_minutes`, `order_index`)
VALUES
    (7, 'LISTENING',       40, 1),
    (7, 'READING_WRITING', 90, 2),
    (7, 'SPEAKING',        16, 3);

-- ============================================================
-- EXAM_PART — A2 Test 1 Listening (paper_id = 1) — 5 parts
-- ============================================================
INSERT INTO `exam_part` (`paper_id`, `part_number`, `order_index`)
VALUES (1, 1, 1), (1, 2, 2), (1, 3, 3), (1, 4, 4), (1, 5, 5);

-- ============================================================
-- EXAM_PART — A2 Test 1 Reading & Writing (paper_id = 2) — 7 parts
-- ============================================================
INSERT INTO `exam_part` (`paper_id`, `part_number`, `order_index`)
VALUES (2, 1, 1), (2, 2, 2), (2, 3, 3), (2, 4, 4), (2, 5, 5), (2, 6, 6), (2, 7, 7);

-- ============================================================
-- EXAM_PART — A2 Test 1 Speaking (paper_id = 3) — 3 parts
-- ============================================================
INSERT INTO `exam_part` (`paper_id`, `part_number`, `order_index`)
VALUES (3, 1, 1), (3, 2, 2), (3, 3, 3);

-- ============================================================
-- EXAM_QUESTION — A2 Test 1 Listening Part 1 (part_id = 1)
-- 5 câu MULTIPLE_CHOICE (có ảnh hoặc text)
-- mongo_doc_id sẽ được cập nhật sau khi insert vào MongoDB
-- ============================================================
INSERT INTO `exam_question`
    (`part_id`, `mongo_doc_id`, `question_type`, `question_number_start`, `question_number_end`, `correct_answer`, `order_index`)
VALUES
    (1, 'a2t1_l_p1_q1', 'MULTIPLE_CHOICE', 1,  1,  'C', 1),
    (1, 'a2t1_l_p1_q2', 'MULTIPLE_CHOICE', 2,  2,  'A', 2),
    (1, 'a2t1_l_p1_q3', 'MULTIPLE_CHOICE', 3,  3,  'B', 3),
    (1, 'a2t1_l_p1_q4', 'MULTIPLE_CHOICE', 4,  4,  'C', 4),
    (1, 'a2t1_l_p1_q5', 'MULTIPLE_CHOICE', 5,  5,  'A', 5);

-- A2 Test 1 Listening Part 2 (part_id = 2) — 1 FILL_IN_FORM doc (câu 6-10)
INSERT INTO `exam_question`
    (`part_id`, `mongo_doc_id`, `question_type`, `question_number_start`, `question_number_end`, `correct_answer`, `order_index`)
VALUES
    (2, 'a2t1_l_p2_form', 'FILL_IN_FORM', 6, 10,
     '{"6":"July","7":"18","8":"swim","9":"350","10":"CV"}', 1);

-- A2 Test 1 Listening Part 3 (part_id = 3) — 5 câu MULTIPLE_CHOICE (câu 11-15)
INSERT INTO `exam_question`
    (`part_id`, `mongo_doc_id`, `question_type`, `question_number_start`, `question_number_end`, `correct_answer`, `order_index`)
VALUES
    (3, 'a2t1_l_p3_q11', 'MULTIPLE_CHOICE', 11, 11, 'A', 1),
    (3, 'a2t1_l_p3_q12', 'MULTIPLE_CHOICE', 12, 12, 'B', 2),
    (3, 'a2t1_l_p3_q13', 'MULTIPLE_CHOICE', 13, 13, 'C', 3),
    (3, 'a2t1_l_p3_q14', 'MULTIPLE_CHOICE', 14, 14, 'A', 4),
    (3, 'a2t1_l_p3_q15', 'MULTIPLE_CHOICE', 15, 15, 'B', 5);

-- A2 Test 1 Listening Part 4 (part_id = 4) — 5 câu MULTIPLE_CHOICE (câu 16-20)
INSERT INTO `exam_question`
    (`part_id`, `mongo_doc_id`, `question_type`, `question_number_start`, `question_number_end`, `correct_answer`, `order_index`)
VALUES
    (4, 'a2t1_l_p4_q16', 'MULTIPLE_CHOICE', 16, 16, 'C', 1),
    (4, 'a2t1_l_p4_q17', 'MULTIPLE_CHOICE', 17, 17, 'B', 2),
    (4, 'a2t1_l_p4_q18', 'MULTIPLE_CHOICE', 18, 18, 'B', 3),
    (4, 'a2t1_l_p4_q19', 'MULTIPLE_CHOICE', 19, 19, 'A', 4),
    (4, 'a2t1_l_p4_q20', 'MULTIPLE_CHOICE', 20, 20, 'B', 5);

-- A2 Test 1 Listening Part 5 (part_id = 5) — 1 MATCHING doc (câu 21-25)
INSERT INTO `exam_question`
    (`part_id`, `mongo_doc_id`, `question_type`, `question_number_start`, `question_number_end`, `correct_answer`, `order_index`)
VALUES
    (5, 'a2t1_l_p5_match', 'MATCHING', 21, 25,
     '{"21":"E","22":"A","23":"G","24":"B","25":"F"}', 1);

-- ============================================================
-- EXAM_QUESTION — A2 Test 1 Reading & Writing
-- ============================================================

-- R&W Part 1 (part_id = 6) — 5 MULTIPLE_CHOICE (câu 1-5)
INSERT INTO `exam_question`
    (`part_id`, `mongo_doc_id`, `question_type`, `question_number_start`, `question_number_end`, `correct_answer`, `order_index`)
VALUES
    (6, 'a2t1_rw_p1_q1', 'MULTIPLE_CHOICE', 1,  1,  'B', 1),
    (6, 'a2t1_rw_p1_q2', 'MULTIPLE_CHOICE', 2,  2,  'B', 2),
    (6, 'a2t1_rw_p1_q3', 'MULTIPLE_CHOICE', 3,  3,  'B', 3),
    (6, 'a2t1_rw_p1_q4', 'MULTIPLE_CHOICE', 4,  4,  'A', 4),
    (6, 'a2t1_rw_p1_q5', 'MULTIPLE_CHOICE', 5,  5,  'B', 5);

-- R&W Part 2 (part_id = 7) — 2 MULTIPLE_CHOICE (câu 6-7)
INSERT INTO `exam_question`
    (`part_id`, `mongo_doc_id`, `question_type`, `question_number_start`, `question_number_end`, `correct_answer`, `order_index`)
VALUES
    (7, 'a2t1_rw_p2_q6', 'MULTIPLE_CHOICE', 6, 6, 'B', 1),
    (7, 'a2t1_rw_p2_q7', 'MULTIPLE_CHOICE', 7, 7, 'A', 2);

-- R&W Part 3 (part_id = 8) — 3 MULTIPLE_CHOICE (câu 8-10)
INSERT INTO `exam_question`
    (`part_id`, `mongo_doc_id`, `question_type`, `question_number_start`, `question_number_end`, `correct_answer`, `order_index`)
VALUES
    (8, 'a2t1_rw_p3_q8',  'MULTIPLE_CHOICE', 8,  8,  'B', 1),
    (8, 'a2t1_rw_p3_q9',  'MULTIPLE_CHOICE', 9,  9,  'C', 2),
    (8, 'a2t1_rw_p3_q10', 'MULTIPLE_CHOICE', 10, 10, 'C', 3);

-- R&W Part 4 (part_id = 9) — 2 MULTIPLE_CHOICE (câu 11-12)
INSERT INTO `exam_question`
    (`part_id`, `mongo_doc_id`, `question_type`, `question_number_start`, `question_number_end`, `correct_answer`, `order_index`)
VALUES
    (9, 'a2t1_rw_p4_q11', 'MULTIPLE_CHOICE', 11, 11, 'B', 1),
    (9, 'a2t1_rw_p4_q12', 'MULTIPLE_CHOICE', 12, 12, 'C', 2);

-- R&W Part 5 (part_id = 10) — 5 FILL_IN_TEXT (câu 13-17)
INSERT INTO `exam_question`
    (`part_id`, `mongo_doc_id`, `question_type`, `question_number_start`, `question_number_end`, `correct_answer`, `order_index`)
VALUES
    (10, 'a2t1_rw_p5_q13', 'FILL_IN_TEXT', 13, 13, 'playing',  1),
    (10, 'a2t1_rw_p5_q14', 'FILL_IN_TEXT', 14, 14, 'for',      2),
    (10, 'a2t1_rw_p5_q15', 'FILL_IN_TEXT', 15, 15, 'carry',    3),
    (10, 'a2t1_rw_p5_q16', 'FILL_IN_TEXT', 16, 16, 'so',       4),
    (10, 'a2t1_rw_p5_q17', 'FILL_IN_TEXT', 17, 17, 'do',       5);

-- R&W Part 6 (part_id = 11) — 1 SHORT_WRITE email (câu 18)
INSERT INTO `exam_question`
    (`part_id`, `mongo_doc_id`, `question_type`, `question_number_start`, `question_number_end`, `correct_answer`, `order_index`)
VALUES
    (11, 'a2t1_rw_p6_write', 'SHORT_WRITE', 18, 18, NULL, 1);

-- R&W Part 7 (part_id = 12) — 1 SHORT_WRITE story (câu 19)
INSERT INTO `exam_question`
    (`part_id`, `mongo_doc_id`, `question_type`, `question_number_start`, `question_number_end`, `correct_answer`, `order_index`)
VALUES
    (12, 'a2t1_rw_p7_write', 'SHORT_WRITE', 19, 19, NULL, 1);

-- ============================================================
-- EXAM_QUESTION — A2 Test 1 Speaking
-- ============================================================
INSERT INTO `exam_question`
    (`part_id`, `mongo_doc_id`, `question_type`, `question_number_start`, `question_number_end`, `correct_answer`, `order_index`)
VALUES
    (13, 'a2t1_sp_p1_task1', 'SPEAKING_TASK', 1, 1, NULL, 1),
    (13, 'a2t1_sp_p1_task2', 'SPEAKING_TASK', 2, 2, NULL, 2),
    (14, 'a2t1_sp_p2_task1', 'SPEAKING_TASK', 3, 3, NULL, 1),
    (15, 'a2t1_sp_p3_task1', 'SPEAKING_TASK', 4, 4, NULL, 1);
