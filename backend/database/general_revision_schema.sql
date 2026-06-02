-- ============================================================
-- PHẦN ÔN TẬP TỔNG HỢP (General Revision)
-- Tách biệt hoàn toàn với phần Học (questions / skill_node…)
-- ============================================================

USE `language_learning_app`;

-- ----------------------------------------------------------
-- 1. general_revision_topic  — 10 chủ đề cố định
--    Mỗi chủ đề có 4 task, mỗi task 1 dạng bài
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `general_revision_topic` (
    `id`          int(11)      NOT NULL AUTO_INCREMENT,
    `title`       varchar(255) NOT NULL COMMENT 'Tên chủ đề, vd: Daily Life, Travel, Business…',
    `description` text         DEFAULT NULL,
    `icon_url`    varchar(512) DEFAULT NULL,
    `order_index` int(11)      NOT NULL DEFAULT 0 COMMENT 'Thứ tự hiển thị',
    `is_active`   tinyint(1)   NOT NULL DEFAULT 1,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='10 chủ đề ôn tập tổng hợp';

-- ----------------------------------------------------------
-- 2. general_revision_task  — 4 task per topic; mỗi task 1 question_type
--    Dùng VARCHAR thay vì ENUM để dễ mở rộng thêm type mới
--    mà không cần ALTER TABLE (ví dụ: READING, WRITING, DICTATION…)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `general_revision_task` (
    `id`            int(11)     NOT NULL AUTO_INCREMENT,
    `topic_id`      int(11)     NOT NULL,
    `task_index`    tinyint(4)  NOT NULL COMMENT '1..4 — thứ tự trong chủ đề',
    `task_label`    varchar(100) NOT NULL COMMENT 'Tên task hiển thị, vd: Từ vựng, Nghe hiểu…',
    `question_type` varchar(50) NOT NULL COMMENT 'Loại bài: VOCAB | LISTENING | SPEAKING | MATCHING | READING | WRITING | DICTATION | …',
    `description`   varchar(255) DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_grt_topic_task` (`topic_id`, `task_index`),
    KEY `idx_grt_topic` (`topic_id`),
    CONSTRAINT `fk_grt_topic` FOREIGN KEY (`topic_id`) REFERENCES `general_revision_topic` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='4 task của mỗi chủ đề ôn tập tổng hợp; mỗi task ứng 1 dạng bài';

-- ----------------------------------------------------------
-- 3. user_general_revision_topic_progress  — tiến trình per user per topic
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_general_revision_topic_progress` (
    `id`              int(11)   NOT NULL AUTO_INCREMENT,
    `user_id`         int(11)   NOT NULL,
    `topic_id`        int(11)   NOT NULL,
    -- Số task đã hoàn thành (0-4)
    `completed_tasks` tinyint(4) NOT NULL DEFAULT 0,
    -- Trạng thái tổng: not_started | in_progress | completed
    `status`          enum('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
    `last_score`      int(11)   DEFAULT NULL COMMENT 'Điểm lần làm gần nhất (0-100)',
    `best_score`      int(11)   DEFAULT NULL COMMENT 'Điểm cao nhất từ trước đến nay',
    `attempt_count`   int(11)   NOT NULL DEFAULT 0,
    `updated_at`      datetime  NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_ugrtp_user_topic` (`user_id`, `topic_id`),
    KEY `idx_ugrtp_user` (`user_id`),
    KEY `idx_ugrtp_topic` (`topic_id`),
    CONSTRAINT `fk_ugrtp_user`  FOREIGN KEY (`user_id`)  REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ugrtp_topic` FOREIGN KEY (`topic_id`) REFERENCES `general_revision_topic` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tiến trình ôn tập tổng hợp của user theo từng chủ đề';

-- ----------------------------------------------------------
-- 4. user_general_revision_task_attempt  — lịch sử làm từng task
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_general_revision_task_attempt` (
    `id`               bigint(20) NOT NULL AUTO_INCREMENT,
    `user_id`          int(11)    NOT NULL,
    `task_id`          int(11)    NOT NULL,
    `correct_count`    int(11)    NOT NULL DEFAULT 0,
    `total_count`      int(11)    NOT NULL DEFAULT 0,
    `score`            int(11)    NOT NULL DEFAULT 0 COMMENT 'Điểm 0-100',
    `elapsed_seconds`  int(11)    NOT NULL DEFAULT 0,
    `passed`           tinyint(1) NOT NULL DEFAULT 0 COMMENT '1 nếu score >= 70',
    `attempted_at`     datetime   NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `idx_ugrta_user` (`user_id`),
    KEY `idx_ugrta_task` (`task_id`),
    CONSTRAINT `fk_ugrta_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ugrta_task` FOREIGN KEY (`task_id`) REFERENCES `general_revision_task` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Lịch sử làm từng task ôn tập tổng hợp';

-- ----------------------------------------------------------
-- 5. Seed dữ liệu: 10 chủ đề + 4 task mỗi chủ đề
-- ----------------------------------------------------------
INSERT IGNORE INTO `general_revision_topic` (`id`, `title`, `description`, `icon_url`, `order_index`) VALUES
(1,  'Daily Life',           'Từ vựng và kỹ năng giao tiếp hằng ngày',   '/icons/general_revision/daily_life.svg',    1),
(2,  'Travel',               'Tiếng Anh cho du lịch và khám phá',        '/icons/general_revision/travel.svg',        2),
(3,  'Food & Dining',        'Gọi món, nhà hàng và ẩm thực thế giới',    '/icons/general_revision/food.svg',          3),
(4,  'Work & Career',        'Tiếng Anh công sở, phỏng vấn và email',    '/icons/general_revision/work.svg',          4),
(5,  'Health & Body',        'Sức khỏe, bộ phận cơ thể và y tế',        '/icons/general_revision/health.svg',        5),
(6,  'Technology',           'Công nghệ, internet và thiết bị số',       '/icons/general_revision/technology.svg',    6),
(7,  'Nature & Environment', 'Môi trường, thời tiết và thiên nhiên',     '/icons/general_revision/nature.svg',        7),
(8,  'Education',            'Học tập, trường lớp và học thuật',         '/icons/general_revision/education.svg',     8),
(9,  'Shopping',             'Mua sắm, giá cả và thương lượng',          '/icons/general_revision/shopping.svg',      9),
(10, 'Culture & Traditions', 'Văn hóa, lễ hội và phong tục thế giới',   '/icons/general_revision/culture.svg',       10);

-- 4 task per topic (VOCAB → LISTENING → SPEAKING → MATCHING)
INSERT IGNORE INTO `general_revision_task` (`topic_id`, `task_index`, `task_label`, `question_type`, `description`) VALUES
-- Topic 1
(1,1,'Từ vựng',   'VOCAB',     'Điền từ còn thiếu vào chỗ trống'),
(1,2,'Nghe hiểu', 'LISTENING', 'Nghe và chọn đáp án đúng'),
(1,3,'Nói',       'SPEAKING',  'Đọc to câu cho trước'),
(1,4,'Ghép đôi',  'MATCHING',  'Ghép từ với nghĩa tương ứng'),
-- Topic 2
(2,1,'Từ vựng',   'VOCAB',     'Điền từ còn thiếu'),
(2,2,'Nghe hiểu', 'LISTENING', 'Nghe và trả lời'),
(2,3,'Nói',       'SPEAKING',  'Phát âm đúng câu'),
(2,4,'Ghép đôi',  'MATCHING',  'Ghép từ du lịch'),
-- Topic 3
(3,1,'Từ vựng',   'VOCAB',     'Điền từ ẩm thực'),
(3,2,'Nghe hiểu', 'LISTENING', 'Nghe hội thoại nhà hàng'),
(3,3,'Nói',       'SPEAKING',  'Đọc menu'),
(3,4,'Ghép đôi',  'MATCHING',  'Ghép món ăn'),
-- Topic 4
(4,1,'Từ vựng',   'VOCAB',     'Từ vựng văn phòng'),
(4,2,'Nghe hiểu', 'LISTENING', 'Nghe cuộc họp'),
(4,3,'Nói',       'SPEAKING',  'Phát âm từ chuyên ngành'),
(4,4,'Ghép đôi',  'MATCHING',  'Ghép vị trí công việc'),
-- Topic 5
(5,1,'Từ vựng',   'VOCAB',     'Từ vựng y tế'),
(5,2,'Nghe hiểu', 'LISTENING', 'Nghe khám bệnh'),
(5,3,'Nói',       'SPEAKING',  'Mô tả triệu chứng'),
(5,4,'Ghép đôi',  'MATCHING',  'Ghép bộ phận cơ thể'),
-- Topic 6
(6,1,'Từ vựng',   'VOCAB',     'Từ vựng công nghệ'),
(6,2,'Nghe hiểu', 'LISTENING', 'Nghe hướng dẫn kỹ thuật'),
(6,3,'Nói',       'SPEAKING',  'Đọc tên thiết bị'),
(6,4,'Ghép đôi',  'MATCHING',  'Ghép tính năng phần mềm'),
-- Topic 7
(7,1,'Từ vựng',   'VOCAB',     'Từ vựng môi trường'),
(7,2,'Nghe hiểu', 'LISTENING', 'Nghe dự báo thời tiết'),
(7,3,'Nói',       'SPEAKING',  'Mô tả cảnh thiên nhiên'),
(7,4,'Ghép đôi',  'MATCHING',  'Ghép hiện tượng tự nhiên'),
-- Topic 8
(8,1,'Từ vựng',   'VOCAB',     'Từ vựng học đường'),
(8,2,'Nghe hiểu', 'LISTENING', 'Nghe bài giảng'),
(8,3,'Nói',       'SPEAKING',  'Trả lời câu hỏi lớp học'),
(8,4,'Ghép đôi',  'MATCHING',  'Ghép môn học'),
-- Topic 9
(9,1,'Từ vựng',   'VOCAB',     'Từ vựng mua sắm'),
(9,2,'Nghe hiểu', 'LISTENING', 'Nghe hội thoại cửa hàng'),
(9,3,'Nói',       'SPEAKING',  'Đọc giá và thương lượng'),
(9,4,'Ghép đôi',  'MATCHING',  'Ghép loại hàng hóa'),
-- Topic 10
(10,1,'Từ vựng',  'VOCAB',     'Từ vựng văn hóa'),
(10,2,'Nghe hiểu','LISTENING', 'Nghe giới thiệu lễ hội'),
(10,3,'Nói',      'SPEAKING',  'Kể về phong tục'),
(10,4,'Ghép đôi', 'MATCHING',  'Ghép lễ hội với quốc gia');
